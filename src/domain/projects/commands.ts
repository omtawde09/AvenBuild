import { categoryLabel } from '@/data/categories';
import { validateProjectForPublish } from '@/lib/validation/project';
import type { ProjectId, UserId } from '../ids';
import { links } from '../links';
import { matchProject } from '../matching/match';
import { isLiveQuote } from '../quotes/status';
import { fail } from '../result';
import { forbidden, invalid, notFound, Tx, type CommandContext, type CommandResult } from '../tx';
import type { DemoState, Project } from '../types';
import { invitationKey } from '../types';
import { canProject, openStatusFor } from './machine';

/** Fields an owner can set on a brief. */
export type ProjectDraftInput = Partial<
  Pick<
    Project,
    | 'category'
    | 'title'
    | 'scope'
    | 'scopeItems'
    | 'propertyType'
    | 'location'
    | 'budget'
    | 'startPreference'
    | 'targetStartDate'
    | 'durationEstimate'
    | 'siteVisit'
    | 'materialResponsibility'
    | 'attachments'
    | 'accessNotes'
  >
>;

/** Fields that may change after publishing (category and city are fixed because quotes depend on them). */
export const EDITABLE_AFTER_PUBLISH = ['title', 'scope', 'scopeItems', 'accessNotes', 'attachments', 'siteVisit', 'durationEstimate', 'materialResponsibility'] as const;

export function emptyDraft(id: ProjectId, ownerId: UserId, now: string): Project {
  return {
    id,
    ownerId,
    status: 'draft',
    category: null,
    title: '',
    scope: '',
    scopeItems: [],
    propertyType: null,
    location: { city: '', locality: '', landmark: '' },
    budget: { kind: 'undisclosed' },
    startPreference: null,
    targetStartDate: null,
    durationEstimate: null,
    siteVisit: { days: [], window: '' },
    materialResponsibility: null,
    attachments: [],
    accessNotes: '',
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    pausedFromStatus: null,
    closedReason: null,
    closedAt: null,
    draftStep: 0,
    isSeed: false,
  };
}

function ownedProject(state: DemoState, projectId: ProjectId, ctx: CommandContext) {
  const project = state.projects[projectId];
  if (!project) return notFound('project');
  if (project.ownerId !== ctx.actorId) return forbidden('Only the project owner can do that.');
  return { ok: true as const, project };
}

export function createDraft(state: DemoState, input: ProjectDraftInput, draftStep: number, ctx: CommandContext): CommandResult<ProjectId> {
  if (state.users[ctx.actorId]?.role !== 'owner') return forbidden('Only property owners can post projects.');
  const tx = new Tx(state, ctx);
  const id = tx.id<ProjectId>('prj');
  tx.put('projects', id, { ...emptyDraft(id, ctx.actorId, ctx.now), ...input, draftStep });
  return tx.done(id);
}

export function updateDraft(state: DemoState, projectId: ProjectId, input: ProjectDraftInput, draftStep: number, ctx: CommandContext): CommandResult {
  const found = ownedProject(state, projectId, ctx);
  if (!found.ok) return found;
  const check = canProject(found.project, 'edit_draft');
  if (!check.ok) return invalid(check.reason);
  const tx = new Tx(state, ctx);
  tx.put('projects', projectId, { ...found.project, ...input, draftStep, updatedAt: ctx.now });
  return tx.done(undefined);
}

export function deleteDraft(state: DemoState, projectId: ProjectId, ctx: CommandContext): CommandResult<Project> {
  const found = ownedProject(state, projectId, ctx);
  if (!found.ok) return found;
  const check = canProject(found.project, 'delete_draft');
  if (!check.ok) return invalid(check.reason);
  const tx = new Tx(state, ctx);
  tx.remove('projects', projectId);
  return tx.done(found.project);
}

/** Undo for deleteDraft: puts the exact draft back. */
export function restoreDraft(state: DemoState, project: Project, ctx: CommandContext): CommandResult {
  if (project.ownerId !== ctx.actorId) return forbidden('Only the project owner can do that.');
  if (state.projects[project.id]) return invalid('This draft already exists.');
  if (project.status !== 'draft') return invalid('Only drafts can be restored.');
  const tx = new Tx(state, ctx);
  tx.put('projects', project.id, project);
  return tx.done(undefined);
}

export function publishProject(state: DemoState, projectId: ProjectId, ctx: CommandContext): CommandResult {
  const found = ownedProject(state, projectId, ctx);
  if (!found.ok) return found;
  const check = canProject(found.project, 'publish');
  if (!check.ok) return invalid(check.reason);
  const errors = validateProjectForPublish(found.project, ctx.today);
  if (Object.keys(errors).length) return fail('VALIDATION', 'Some details are missing or invalid. Fix them before publishing.', errors);

  const tx = new Tx(state, ctx);
  const project: Project = { ...found.project, status: 'open', publishedAt: ctx.now, updatedAt: ctx.now };
  tx.put('projects', projectId, project);
  tx.log({ projectId, type: 'project_published', summary: `Project published: ${project.title}` });
  for (const profile of Object.values(state.contractorProfiles)) {
    if (matchProject(profile, project).eligible) {
      tx.notify({
        recipientId: profile.userId,
        category: 'project',
        title: 'New matching lead',
        body: `${project.title} · ${project.category ? categoryLabel(project.category) : ''} in ${project.location.locality}, ${project.location.city}`,
        link: links.lead(projectId),
      });
    }
  }
  return tx.done(undefined);
}

export function updatePublished(state: DemoState, projectId: ProjectId, input: ProjectDraftInput, ctx: CommandContext): CommandResult {
  const found = ownedProject(state, projectId, ctx);
  if (!found.ok) return found;
  const check = canProject(found.project, 'edit_published');
  if (!check.ok) return invalid(check.reason);
  const disallowed = Object.keys(input).filter((k) => !(EDITABLE_AFTER_PUBLISH as ReadonlyArray<string>).includes(k));
  if (disallowed.length) return invalid('Category, location and budget can’t change after publishing. Close this project and post a new one instead.');
  const candidate: Project = { ...found.project, ...input, updatedAt: ctx.now };
  const errors = validateProjectForPublish(candidate, '0000-00-00');
  if (Object.keys(errors).length) return fail('VALIDATION', 'Some details are invalid.', errors);

  const tx = new Tx(state, ctx);
  tx.put('projects', projectId, candidate);
  tx.log({ projectId, type: 'project_updated', summary: 'Project brief updated' });
  for (const q of Object.values(state.quotes)) {
    if (q.projectId === projectId && isLiveQuote(q)) {
      tx.notify({ recipientId: q.contractorId, category: 'project', title: 'Brief updated', body: `The owner updated “${candidate.title}”. Check whether your quote still fits.`, link: links.lead(projectId) });
    }
  }
  return tx.done(undefined);
}

export function pauseProject(state: DemoState, projectId: ProjectId, ctx: CommandContext): CommandResult {
  const found = ownedProject(state, projectId, ctx);
  if (!found.ok) return found;
  const check = canProject(found.project, 'pause');
  if (!check.ok) return invalid(check.reason);
  const from = found.project.status === 'reviewing' ? 'reviewing' : 'open';
  const tx = new Tx(state, ctx);
  tx.put('projects', projectId, { ...found.project, status: 'paused', pausedFromStatus: from, updatedAt: ctx.now });
  return tx.done(undefined);
}

export function reopenProject(state: DemoState, projectId: ProjectId, ctx: CommandContext): CommandResult {
  const found = ownedProject(state, projectId, ctx);
  if (!found.ok) return found;
  const check = canProject(found.project, 'reopen');
  if (!check.ok) return invalid(check.reason);
  const tx = new Tx(state, ctx);
  tx.put('projects', projectId, { ...found.project, status: openStatusFor(state, projectId), pausedFromStatus: null, updatedAt: ctx.now });
  return tx.done(undefined);
}

/** Declines every live quote and closes enquiry conversations when a project stops accepting quotes. */
export function closeOutQuotes(tx: Tx, project: Project, reason: 'project_closed' | 'awarded_elsewhere', keepContractorId?: UserId): void {
  for (const q of Object.values(tx.s.quotes)) {
    if (q.projectId !== project.id || q.contractorId === keepContractorId) continue;
    if (isLiveQuote(q) || q.status === 'draft') {
      tx.put('quotes', q.id, { ...q, status: 'declined', declineReason: reason, decidedAt: tx.ctx.now, updatedAt: tx.ctx.now, pendingContent: null });
      tx.notify({
        recipientId: q.contractorId,
        category: 'quote',
        title: reason === 'awarded_elsewhere' ? 'Project awarded to another contractor' : 'Project closed',
        body: `“${project.title}” is no longer accepting quotes.`,
        link: links.contractorQuote(q.id),
      });
    }
  }
  for (const c of Object.values(tx.s.conversations)) {
    if (c.projectId === project.id && c.contractorId !== keepContractorId && !c.closedReason) {
      tx.put('conversations', c.id, { ...c, closedReason: reason === 'awarded_elsewhere' ? 'This project was awarded to another contractor.' : 'This project was closed by the owner.' });
    }
  }
  for (const [key, inv] of Object.entries(tx.s.invitations)) {
    if (inv.projectId === project.id && inv.contractorId !== keepContractorId) tx.remove('invitations', key);
  }
}

export function closeProject(state: DemoState, projectId: ProjectId, reason: string, ctx: CommandContext): CommandResult {
  const found = ownedProject(state, projectId, ctx);
  if (!found.ok) return found;
  const check = canProject(found.project, 'close');
  if (!check.ok) return invalid(check.reason);
  const tx = new Tx(state, ctx);
  const project: Project = { ...found.project, status: 'closed', closedReason: reason.trim() || 'Closed by owner', closedAt: ctx.now, updatedAt: ctx.now };
  tx.put('projects', projectId, project);
  closeOutQuotes(tx, project, 'project_closed');
  return tx.done(undefined);
}

export function cancelProject(state: DemoState, projectId: ProjectId, reason: string, ctx: CommandContext): CommandResult {
  const found = ownedProject(state, projectId, ctx);
  if (!found.ok) return found;
  const check = canProject(found.project, 'cancel');
  if (!check.ok) return invalid(check.reason);
  if (reason.trim().length < 5) return fail('VALIDATION', 'Give a short reason for cancelling.', { reason: 'Give a reason (at least 5 characters).' });
  const tx = new Tx(state, ctx);
  const project: Project = { ...found.project, status: 'cancelled', closedReason: reason.trim(), closedAt: ctx.now, updatedAt: ctx.now };
  tx.put('projects', projectId, project);
  closeOutQuotes(tx, project, 'project_closed');
  const ws = Object.values(state.workspaces).find((w) => w.projectId === projectId && w.status === 'active');
  if (ws) {
    tx.put('workspaces', ws.id, { ...ws, status: 'cancelled', cancelledAt: ctx.now });
    tx.log({ projectId, workspaceId: ws.id, type: 'project_cancelled', summary: `Project cancelled by owner: ${reason.trim()}` });
    tx.notify({ recipientId: ws.contractorId, category: 'project', title: 'Project cancelled', body: `The owner cancelled “${project.title}”. Reason: ${reason.trim()}`, link: links.workspace(ws.id) });
  }
  return tx.done(undefined);
}

export function inviteToQuote(state: DemoState, projectId: ProjectId, contractorId: UserId, ctx: CommandContext): CommandResult {
  const found = ownedProject(state, projectId, ctx);
  if (!found.ok) return found;
  if (!canProject(found.project, 'accept_quotes').ok) return invalid('You can only invite contractors to projects that are open for quotes.');
  const profile = state.contractorProfiles[contractorId];
  if (!profile) return notFound('contractor');
  const key = invitationKey(contractorId, projectId);
  if (state.invitations[key]) return fail('CONFLICT', `You already invited ${profile.businessName} to quote on this project.`);
  if (Object.values(state.quotes).some((q) => q.projectId === projectId && q.contractorId === contractorId && q.status !== 'draft')) {
    return fail('CONFLICT', `${profile.businessName} has already quoted on this project.`);
  }
  const tx = new Tx(state, ctx);
  tx.put('invitations', key, { ownerId: ctx.actorId, contractorId, projectId, createdAt: ctx.now });
  tx.notify({ recipientId: contractorId, category: 'project', title: 'Invitation to quote', body: `You were invited to quote on “${found.project.title}”.`, link: links.lead(projectId) });
  return tx.done(undefined);
}
