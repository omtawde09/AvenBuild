import { serviceCategories } from '@/data/categories';
import { validateQuoteForSubmit } from '@/lib/validation/quote';
import type { LineItemId, ProjectId, QuoteId, UserId } from '../ids';
import { links } from '../links';
import { isOpenForQuotes } from '../matching/match';
import { canProject } from '../projects/machine';
import { closeOutQuotes } from '../projects/commands';
import { fail } from '../result';
import { addDays } from '../time';
import { forbidden, invalid, notFound, Tx, type CommandContext, type CommandResult } from '../tx';
import type { DemoState, Project, Quote, QuoteContent } from '../types';
import { createWorkspaceFromQuote } from '../workspace/create';
import { computeQuoteTotals } from './math';
import { canQuote } from './machine';
import { isExpired, isLiveQuote } from './status';
import { formatPaisePlain } from '@/lib/format';

export function defaultQuoteContent(state: DemoState, project: Project, contractorId: UserId, ctx: CommandContext): QuoteContent {
  const profile = state.contractorProfiles[contractorId];
  const defaults = profile?.quoteDefaults ?? { validityDays: 21, taxPercent: 18, inclusions: [], exclusions: [] };
  const unit = project.category ? serviceCategories[project.category].defaultUnit : 'lump_sum';
  const durationDays = project.durationEstimate ? project.durationEstimate.value * (project.durationEstimate.unit === 'weeks' ? 7 : 1) : 14;
  return {
    lineItems: [{ id: ctx.newId('li') as LineItemId, description: '', quantity: 1, unit, ratePaise: 0 }],
    discount: { kind: 'none' },
    taxPercent: defaults.taxPercent,
    startWindow: { earliest: addDays(ctx.today, 7), latest: addDays(ctx.today, 21) },
    durationDays,
    proposedMilestones: [],
    inclusions: [...defaults.inclusions],
    exclusions: [...defaults.exclusions],
    assumptions: [],
    validUntil: addDays(ctx.today, defaults.validityDays),
    note: '',
  };
}

function ownQuote(state: DemoState, quoteId: QuoteId, ctx: CommandContext) {
  const quote = state.quotes[quoteId];
  if (!quote) return notFound('quote');
  if (quote.contractorId !== ctx.actorId) return forbidden('Only the contractor who wrote this quote can change it.');
  const project = state.projects[quote.projectId];
  if (!project) return notFound('project');
  return { ok: true as const, quote, project };
}

function ownersQuote(state: DemoState, quoteId: QuoteId, ctx: CommandContext) {
  const quote = state.quotes[quoteId];
  if (!quote) return notFound('quote');
  const project = state.projects[quote.projectId];
  if (!project) return notFound('project');
  if (project.ownerId !== ctx.actorId) return forbidden('Only the project owner can do that.');
  return { ok: true as const, quote, project };
}

function eligibilityError(project: Project): string | null {
  if (isOpenForQuotes(project)) return null;
  if (project.status === 'draft') return 'This project hasn’t been published, so it can’t receive quotes.';
  if (project.status === 'paused') return 'The owner has paused this project. Quotes can be sent when it reopens.';
  return 'This project is no longer accepting quotes.';
}

/** Start (or return the existing) quote for a project. */
export function startQuote(state: DemoState, projectId: ProjectId, ctx: CommandContext): CommandResult<QuoteId> {
  const project = state.projects[projectId];
  if (!project) return notFound('project');
  const profile = state.contractorProfiles[ctx.actorId];
  if (!profile) return forbidden('Only contractors can write quotes.');
  const existing = Object.values(state.quotes).find((q) => q.projectId === projectId && q.contractorId === ctx.actorId);
  if (existing) return { ok: true, value: { state, value: existing.id } };
  const err = eligibilityError(project);
  if (err) return invalid(err);
  const tx = new Tx(state, ctx);
  const id = tx.id<QuoteId>('qt');
  const quote: Quote = {
    id,
    projectId,
    contractorId: ctx.actorId,
    status: 'draft',
    revision: 1,
    content: defaultQuoteContent(state, project, ctx.actorId, ctx),
    pendingContent: null,
    history: [],
    revisionRequest: null,
    declineReason: null,
    declineNote: '',
    createdAt: ctx.now,
    updatedAt: ctx.now,
    submittedAt: null,
    viewedAt: null,
    decidedAt: null,
    withdrawnAt: null,
    isSeed: false,
  };
  tx.put('quotes', id, quote);
  return tx.done(id);
}

/** Save unsubmitted edits: the draft itself, or pending revision content. */
export function saveQuoteDraft(state: DemoState, quoteId: QuoteId, content: QuoteContent, ctx: CommandContext): CommandResult {
  const found = ownQuote(state, quoteId, ctx);
  if (!found.ok) return found;
  const { quote } = found;
  const tx = new Tx(state, ctx);
  if (quote.status === 'draft') tx.put('quotes', quoteId, { ...quote, content, updatedAt: ctx.now });
  else if (canQuote(quote, 'revise').ok) tx.put('quotes', quoteId, { ...quote, pendingContent: content, updatedAt: ctx.now });
  else return invalid('This quote can’t be edited in its current state.');
  return tx.done(undefined);
}

export function discardQuoteDraft(state: DemoState, quoteId: QuoteId, ctx: CommandContext): CommandResult {
  const found = ownQuote(state, quoteId, ctx);
  if (!found.ok) return found;
  const tx = new Tx(state, ctx);
  if (found.quote.status === 'draft') tx.remove('quotes', quoteId);
  else if (found.quote.pendingContent) tx.put('quotes', quoteId, { ...found.quote, pendingContent: null, updatedAt: ctx.now });
  else return invalid('There are no unsent changes to discard.');
  return tx.done(undefined);
}

/** Submit a draft, or resubmit a revision (after a revision request or a withdrawal). */
export function submitQuote(state: DemoState, quoteId: QuoteId, content: QuoteContent, ctx: CommandContext): CommandResult {
  const found = ownQuote(state, quoteId, ctx);
  if (!found.ok) return found;
  const { quote, project } = found;
  const isResubmit = quote.status !== 'draft';
  const check = canQuote(quote, isResubmit ? 'resubmit' : 'submit');
  if (!check.ok) return invalid(check.reason);
  const err = eligibilityError(project);
  if (err) return invalid(err);
  const errors = validateQuoteForSubmit(content, ctx.today);
  if (Object.keys(errors).length) return fail('VALIDATION', 'Some quote details are missing or invalid.', errors);

  const tx = new Tx(state, ctx);
  const history = isResubmit && quote.submittedAt ? [...quote.history, { revision: quote.revision, content: quote.content, submittedAt: quote.submittedAt }] : quote.history;
  const next: Quote = {
    ...quote,
    status: 'submitted',
    revision: isResubmit ? quote.revision + 1 : quote.revision,
    content,
    pendingContent: null,
    history,
    revisionRequest: null,
    submittedAt: ctx.now,
    viewedAt: null,
    withdrawnAt: null,
    updatedAt: ctx.now,
  };
  tx.put('quotes', quoteId, next);
  if (project.status === 'open') tx.put('projects', project.id, { ...project, status: 'reviewing', updatedAt: ctx.now });
  const business = state.contractorProfiles[ctx.actorId]?.businessName ?? 'A contractor';
  const total = formatPaisePlain(computeQuoteTotals(content).totalPaise);
  tx.log({
    projectId: project.id,
    type: isResubmit ? 'quote_revised' : 'quote_submitted',
    summary: isResubmit ? `${business} sent revision ${next.revision} (₹${total})` : `${business} submitted a quote (₹${total})`,
  });
  tx.notify({
    recipientId: project.ownerId,
    category: 'quote',
    title: isResubmit ? 'Revised quote received' : 'New quote received',
    body: `${business} · ₹${total} for “${project.title}”`,
    link: links.ownerQuote(project.id, quoteId),
  });
  return tx.done(undefined);
}

export function withdrawQuote(state: DemoState, quoteId: QuoteId, ctx: CommandContext): CommandResult {
  const found = ownQuote(state, quoteId, ctx);
  if (!found.ok) return found;
  const { quote, project } = found;
  const check = canQuote(quote, 'withdraw');
  if (!check.ok) return invalid(check.reason);
  const tx = new Tx(state, ctx);
  tx.put('quotes', quoteId, { ...quote, status: 'withdrawn', withdrawnAt: ctx.now, updatedAt: ctx.now, revisionRequest: null });
  revertToOpenIfNoLiveQuotes(tx, project);
  const business = state.contractorProfiles[ctx.actorId]?.businessName ?? 'A contractor';
  tx.notify({ recipientId: project.ownerId, category: 'quote', title: 'Quote withdrawn', body: `${business} withdrew their quote for “${project.title}”.`, link: links.ownerQuote(project.id, quoteId) });
  return tx.done(undefined);
}

function revertToOpenIfNoLiveQuotes(tx: Tx, project: Project): void {
  const current = tx.s.projects[project.id];
  if (current?.status !== 'reviewing') return;
  const anyLive = Object.values(tx.s.quotes).some((q) => q.projectId === project.id && isLiveQuote(q));
  if (!anyLive) tx.put('projects', project.id, { ...current, status: 'open', updatedAt: tx.ctx.now });
}

/** Owner opened the quote: submitted → viewed. Idempotent and silent (no notification). */
export function markQuoteViewed(state: DemoState, quoteId: QuoteId, ctx: CommandContext): CommandResult {
  const found = ownersQuote(state, quoteId, ctx);
  if (!found.ok) return found;
  if (found.quote.status !== 'submitted') return { ok: true, value: { state, value: undefined } };
  const tx = new Tx(state, ctx);
  tx.put('quotes', quoteId, { ...found.quote, status: 'viewed', viewedAt: ctx.now });
  return tx.done(undefined);
}

export function requestRevision(state: DemoState, quoteId: QuoteId, message: string, ctx: CommandContext): CommandResult {
  const found = ownersQuote(state, quoteId, ctx);
  if (!found.ok) return found;
  const { quote, project } = found;
  const check = canQuote(quote, 'request_revision');
  if (!check.ok) return invalid(check.reason);
  if (!canProject(project, 'accept_quotes').ok) return invalid('Reopen the project before asking for revisions.');
  const text = message.trim();
  if (text.length < 10 || text.length > 1000) return fail('VALIDATION', 'Explain what should change.', { message: 'Write 10–1000 characters explaining what should change.' });
  const tx = new Tx(state, ctx);
  tx.put('quotes', quoteId, { ...quote, status: 'revision_requested', revisionRequest: { message: text, at: ctx.now }, updatedAt: ctx.now });
  tx.notify({ recipientId: quote.contractorId, category: 'quote', title: 'Revision requested', body: `The owner of “${project.title}” asked: ${text}`, link: links.contractorQuote(quoteId) });
  return tx.done(undefined);
}

export function declineQuote(state: DemoState, quoteId: QuoteId, note: string, ctx: CommandContext): CommandResult {
  const found = ownersQuote(state, quoteId, ctx);
  if (!found.ok) return found;
  const { quote, project } = found;
  const check = canQuote(quote, 'decline');
  if (!check.ok) return invalid(check.reason);
  const tx = new Tx(state, ctx);
  tx.put('quotes', quoteId, { ...quote, status: 'declined', declineReason: 'owner', declineNote: note.trim().slice(0, 500), decidedAt: ctx.now, updatedAt: ctx.now, pendingContent: null });
  revertToOpenIfNoLiveQuotes(tx, project);
  tx.notify({ recipientId: quote.contractorId, category: 'quote', title: 'Quote declined', body: `The owner declined your quote for “${project.title}”.${note.trim() ? ` Note: ${note.trim()}` : ''}`, link: links.contractorQuote(quoteId) });
  return tx.done(undefined);
}

/**
 * Accept one quote — an atomic transaction: quote accepted, competing quotes declined, project awarded,
 * exactly one workspace created with milestones, conversations updated, parties notified.
 */
export function acceptQuote(state: DemoState, quoteId: QuoteId, ctx: CommandContext): CommandResult<string> {
  const found = ownersQuote(state, quoteId, ctx);
  if (!found.ok) return found;
  const { quote, project } = found;
  const projectCheck = canProject(project, 'accept_quotes');
  if (!projectCheck.ok) return invalid(projectCheck.reason);
  const check = canQuote(quote, 'accept');
  if (!check.ok) return invalid(check.reason);
  if (isExpired(quote, ctx.today)) return invalid('This quote has expired. Ask the contractor for a revision with a new validity date.');
  if (Object.values(state.workspaces).some((w) => w.projectId === project.id)) return fail('CONFLICT', 'A contractor has already been chosen for this project.');

  const tx = new Tx(state, ctx);
  const accepted: Quote = { ...quote, status: 'accepted', decidedAt: ctx.now, updatedAt: ctx.now, pendingContent: null };
  tx.put('quotes', quoteId, accepted);
  const awarded: Project = { ...project, status: 'awarded', updatedAt: ctx.now };
  tx.put('projects', project.id, awarded);
  closeOutQuotes(tx, awarded, 'awarded_elsewhere', quote.contractorId);
  const workspaceId = createWorkspaceFromQuote(tx, awarded, accepted);
  const business = state.contractorProfiles[quote.contractorId]?.businessName ?? 'the contractor';
  tx.log({ projectId: project.id, workspaceId, type: 'quote_accepted', summary: `Quote from ${business} accepted (revision ${quote.revision})` });
  tx.notify({ recipientId: quote.contractorId, category: 'quote', title: 'Your quote was accepted', body: `“${project.title}” is now an active project. Open the workspace to plan milestones.`, link: links.workspace(workspaceId) });
  return tx.done(workspaceId);
}
