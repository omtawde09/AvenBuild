import type { ChangeRequestId, DocumentId, MilestoneId, SiteUpdateId, WorkspaceId } from '../ids';
import { links } from '../links';
import { formatDate, formatMoney } from '@/lib/format';
import { fail } from '../result';
import { isISODate } from '../time';
import { forbidden, invalid, notFound, Tx, type CommandContext, type CommandResult } from '../tx';
import type { AttachmentMeta, ChangeRequest, DemoState, ISODate, Milestone, Paise, Workspace } from '../types';
import type { MilestoneStatus } from '../status';
import { currentAgreement, workspaceMilestones } from './selectors';

function activeWorkspace(state: DemoState, workspaceId: WorkspaceId, ctx: CommandContext) {
  const ws = state.workspaces[workspaceId];
  if (!ws) return notFound('workspace');
  if (ctx.actorId !== ws.ownerId && ctx.actorId !== ws.contractorId) return forbidden('You’re not part of this project.');
  if (ws.status !== 'active') return invalid('This workspace is no longer active.');
  const project = state.projects[ws.projectId];
  if (!project) return notFound('project');
  return { ok: true as const, ws, project };
}

const counterpart = (ws: Workspace, actor: string) => (actor === ws.ownerId ? ws.contractorId : ws.ownerId);

// ── Milestones ────────────────────────────────────────────────────────────────

type MilestoneAction = 'start' | 'submit' | 'approve' | 'request_changes' | 'resume' | 'edit';

const milestoneRules: Record<MilestoneAction, { from: MilestoneStatus[]; actor: 'owner' | 'contractor'; to: MilestoneStatus | null; reason: string }> = {
  start: { from: ['pending'], actor: 'contractor', to: 'in_progress', reason: 'Only milestones that haven’t started can be started.' },
  submit: { from: ['in_progress'], actor: 'contractor', to: 'submitted', reason: 'Only milestones in progress can be submitted for approval.' },
  approve: { from: ['submitted'], actor: 'owner', to: 'approved', reason: 'Only milestones awaiting approval can be approved.' },
  request_changes: { from: ['submitted'], actor: 'owner', to: 'changes_requested', reason: 'Changes can be requested only on milestones awaiting approval.' },
  resume: { from: ['changes_requested'], actor: 'contractor', to: 'in_progress', reason: 'Only milestones with requested changes can be resumed.' },
  edit: { from: ['pending'], actor: 'contractor', to: null, reason: 'Only milestones that haven’t started can be edited.' },
};

export function canMilestone(m: Pick<Milestone, 'status'>, action: MilestoneAction, role: 'owner' | 'contractor'): { ok: true } | { ok: false; reason: string } {
  const rule = milestoneRules[action];
  if (rule.actor !== role) return { ok: false, reason: rule.actor === 'owner' ? 'Only the owner can do this.' : 'Only the contractor can do this.' };
  return rule.from.includes(m.status) ? { ok: true } : { ok: false, reason: rule.reason };
}

export function transitionMilestone(
  state: DemoState,
  milestoneId: MilestoneId,
  action: Exclude<MilestoneAction, 'edit'>,
  note: string,
  ctx: CommandContext,
): CommandResult {
  const m = state.milestones[milestoneId];
  if (!m) return notFound('milestone');
  const found = activeWorkspace(state, m.workspaceId as WorkspaceId, ctx);
  if (!found.ok) return found;
  const { ws, project } = found;
  const role = ctx.actorId === ws.ownerId ? 'owner' : 'contractor';
  const check = canMilestone(m, action, role);
  if (!check.ok) return invalid(check.reason);
  const text = note.trim();
  if ((action === 'submit' || action === 'request_changes') && (text.length < 10 || text.length > 1000)) {
    return fail('VALIDATION', 'Add a short note.', { note: action === 'submit' ? 'Describe the work completed (10–1000 characters).' : 'Explain what needs to change (10–1000 characters).' });
  }
  const to = milestoneRules[action].to as MilestoneStatus;
  const tx = new Tx(state, ctx);
  const next: Milestone = {
    ...m,
    status: to,
    updatedAt: ctx.now,
    ...(action === 'start' ? { startedAt: ctx.now } : {}),
    ...(action === 'submit' ? { submittedAt: ctx.now, evidenceNote: text } : {}),
    ...(action === 'approve' ? { approvedAt: ctx.now } : {}),
    ...(action === 'request_changes' ? { changeRequestNote: text } : {}),
  };
  tx.put('milestones', milestoneId, next);
  if (action === 'start' && project.status === 'awarded') tx.put('projects', project.id, { ...project, status: 'in_progress', updatedAt: ctx.now });

  const label = `“${m.title}”`;
  const map = {
    start: { type: 'milestone_started', summary: `Milestone started: ${m.title}`, notify: null },
    submit: { type: 'milestone_submitted', summary: `Milestone submitted for approval: ${m.title}`, notify: { title: 'Milestone awaiting your approval', body: `${label} on “${project.title}”: ${text}` } },
    approve: { type: 'milestone_approved', summary: `Milestone approved: ${m.title}`, notify: { title: 'Milestone approved', body: `${label} on “${project.title}” was approved.` } },
    request_changes: { type: 'milestone_changes_requested', summary: `Changes requested on milestone: ${m.title}`, notify: { title: 'Changes requested on a milestone', body: `${label}: ${text}` } },
    resume: { type: 'milestone_started', summary: `Milestone resumed after changes: ${m.title}`, notify: null },
  } as const;
  const entry = map[action];
  tx.log({ projectId: project.id, workspaceId: ws.id, type: entry.type, summary: entry.summary });
  if (entry.notify) tx.notify({ recipientId: counterpart(ws, ctx.actorId), category: 'milestone', title: entry.notify.title, body: entry.notify.body, link: links.workspace(ws.id, 'milestones') });

  if (action === 'approve') {
    const all = workspaceMilestones(tx.s, ws.id);
    if (all.every((x) => x.status === 'approved')) {
      tx.notify({ recipientId: ws.contractorId, category: 'milestone', title: 'All milestones approved', body: `The owner can now mark “${project.title}” complete.`, link: links.workspace(ws.id) });
    }
  }
  return tx.done(undefined);
}

export function editMilestone(state: DemoState, milestoneId: MilestoneId, input: { title: string; description: string; targetDate: ISODate }, ctx: CommandContext): CommandResult {
  const m = state.milestones[milestoneId];
  if (!m) return notFound('milestone');
  const found = activeWorkspace(state, m.workspaceId as WorkspaceId, ctx);
  if (!found.ok) return found;
  const { ws, project } = found;
  const check = canMilestone(m, 'edit', ctx.actorId === ws.ownerId ? 'owner' : 'contractor');
  if (!check.ok) return invalid(check.reason);
  const errors: Record<string, string> = {};
  if (input.title.trim().length < 3 || input.title.trim().length > 80) errors.title = 'Title must be 3–80 characters.';
  if (input.description.trim().length > 500) errors.description = 'Description can be at most 500 characters.';
  if (!isISODate(input.targetDate)) errors.targetDate = 'Choose a valid date.';
  else if (input.targetDate < ctx.today) errors.targetDate = 'Target date can’t be in the past.';
  if (Object.keys(errors).length) return fail('VALIDATION', 'Check the milestone details.', errors);
  const tx = new Tx(state, ctx);
  tx.put('milestones', milestoneId, { ...m, title: input.title.trim(), description: input.description.trim(), targetDate: input.targetDate, updatedAt: ctx.now });
  tx.log({ projectId: project.id, workspaceId: ws.id, type: 'milestone_updated', summary: `Milestone updated: ${input.title.trim()}` });
  if (input.targetDate !== m.targetDate) {
    tx.notify({ recipientId: ws.ownerId, category: 'milestone', title: 'Milestone date changed', body: `“${input.title.trim()}” target moved from ${formatDate(m.targetDate)} to ${formatDate(input.targetDate)}.`, link: links.workspace(ws.id, 'milestones') });
  }
  return tx.done(undefined);
}

// ── Site updates & documents ──────────────────────────────────────────────────

export function postSiteUpdate(state: DemoState, workspaceId: WorkspaceId, input: { date: ISODate; notes: string; progressPercent: number; attachments: AttachmentMeta[] }, ctx: CommandContext): CommandResult {
  const found = activeWorkspace(state, workspaceId, ctx);
  if (!found.ok) return found;
  const { ws, project } = found;
  if (ctx.actorId !== ws.contractorId) return forbidden('Site updates are posted by the contractor.');
  const errors: Record<string, string> = {};
  if (!isISODate(input.date)) errors.date = 'Choose the date of this update.';
  else if (input.date > ctx.today) errors.date = 'Site updates can’t be dated in the future.';
  const notes = input.notes.trim();
  if (notes.length < 10 || notes.length > 1500) errors.notes = 'Describe the work done (10–1500 characters).';
  if (!Number.isInteger(input.progressPercent) || input.progressPercent < 0 || input.progressPercent > 100) errors.progressPercent = 'Progress must be a whole number from 0 to 100.';
  if (input.attachments.length > 6) errors.attachments = 'Attach at most 6 files.';
  if (Object.keys(errors).length) return fail('VALIDATION', 'Check the site update.', errors);
  const tx = new Tx(state, ctx);
  const id = tx.id<SiteUpdateId>('su');
  tx.put('siteUpdates', id, { id, workspaceId, authorId: ctx.actorId, date: input.date, notes, progressPercent: input.progressPercent, attachments: input.attachments, createdAt: ctx.now });
  tx.log({ projectId: project.id, workspaceId, type: 'site_update_posted', summary: `Site update for ${formatDate(input.date)} (${input.progressPercent}% reported)` });
  tx.notify({ recipientId: ws.ownerId, category: 'milestone', title: 'New site update', body: `${formatDate(input.date)} · ${notes.slice(0, 120)}`, link: links.workspace(workspaceId, 'updates') });
  return tx.done(undefined);
}

export function addDocuments(state: DemoState, workspaceId: WorkspaceId, files: AttachmentMeta[], ctx: CommandContext): CommandResult {
  const found = activeWorkspace(state, workspaceId, ctx);
  if (!found.ok) return found;
  const { ws, project } = found;
  if (!files.length) return fail('VALIDATION', 'Choose at least one file.');
  const tx = new Tx(state, ctx);
  for (const file of files) {
    const id = tx.id<DocumentId>('doc');
    tx.put('documents', id, { id, workspaceId, addedBy: ctx.actorId, file });
  }
  tx.log({ projectId: project.id, workspaceId, type: 'document_added', summary: files.length === 1 ? `Document added: ${files[0]?.name}` : `${files.length} documents added` });
  tx.notify({ recipientId: counterpart(ws, ctx.actorId), category: 'project', title: 'Document added', body: files.map((f) => f.name).join(', '), link: links.workspace(workspaceId, 'documents') });
  return tx.done(undefined);
}

export function removeDocument(state: DemoState, documentId: DocumentId, ctx: CommandContext): CommandResult {
  const doc = state.documents[documentId];
  if (!doc) return notFound('document');
  const found = activeWorkspace(state, doc.workspaceId as WorkspaceId, ctx);
  if (!found.ok) return found;
  if (doc.addedBy !== ctx.actorId) return forbidden('Only the person who added a document can remove it.');
  const tx = new Tx(state, ctx);
  tx.remove('documents', documentId);
  tx.log({ projectId: found.project.id, workspaceId: found.ws.id, type: 'document_removed', summary: `Document removed: ${doc.file.name}` });
  return tx.done(undefined);
}

// ── Change requests ───────────────────────────────────────────────────────────

export interface ChangeRequestInput {
  reason: string;
  scopeNote: string;
  newTotalPaise: Paise | null;
  newEndDate: ISODate | null;
}

export function proposeChange(state: DemoState, workspaceId: WorkspaceId, input: ChangeRequestInput, ctx: CommandContext): CommandResult<ChangeRequestId> {
  const found = activeWorkspace(state, workspaceId, ctx);
  if (!found.ok) return found;
  const { ws, project } = found;
  if (Object.values(state.changeRequests).some((c) => c.workspaceId === workspaceId && c.status === 'proposed')) {
    return fail('CONFLICT', 'There is already a change request awaiting a response. Resolve it first.');
  }
  const agreement = currentAgreement(ws);
  const errors: Record<string, string> = {};
  const reason = input.reason.trim();
  const scopeNote = input.scopeNote.trim();
  if (reason.length < 10 || reason.length > 600) errors.reason = 'Explain the reason (10–600 characters).';
  if (scopeNote.length > 600) errors.scopeNote = 'Scope note can be at most 600 characters.';
  if (input.newTotalPaise !== null && (!Number.isSafeInteger(input.newTotalPaise) || input.newTotalPaise <= 0)) errors.newTotalPaise = 'Enter a valid new total.';
  if (input.newTotalPaise === agreement.totalPaise) errors.newTotalPaise = 'The new total is the same as the current agreed total.';
  if (input.newEndDate !== null) {
    if (!isISODate(input.newEndDate)) errors.newEndDate = 'Choose a valid date.';
    else if (input.newEndDate === agreement.endDate) errors.newEndDate = 'The new date is the same as the current end date.';
    else if (input.newEndDate < agreement.startDate) errors.newEndDate = 'End date can’t be before the start date.';
  }
  const kinds: ChangeRequest['kinds'] = [];
  if (scopeNote) kinds.push('scope');
  if (input.newEndDate !== null) kinds.push('date');
  if (input.newTotalPaise !== null) kinds.push('price');
  if (!kinds.length) errors._form = 'Propose at least one change: scope, end date or price.';
  if (Object.keys(errors).length) return fail('VALIDATION', 'Check the change request.', errors);

  const tx = new Tx(state, ctx);
  const id = tx.id<ChangeRequestId>('cr');
  tx.put('changeRequests', id, { id, workspaceId, proposedBy: ctx.actorId, kinds, reason, scopeNote, newTotalPaise: input.newTotalPaise, newEndDate: input.newEndDate, status: 'proposed', responseNote: '', createdAt: ctx.now, resolvedAt: null });
  tx.log({ projectId: project.id, workspaceId, type: 'change_proposed', summary: `Change proposed (${kinds.join(', ')}): ${reason}` });
  tx.notify({ recipientId: counterpart(ws, ctx.actorId), category: 'change', title: 'Change request to review', body: reason, link: links.workspace(workspaceId, 'changes') });
  return tx.done(id);
}

export function resolveChange(state: DemoState, changeId: ChangeRequestId, decision: 'accept' | 'reject' | 'withdraw', note: string, ctx: CommandContext): CommandResult {
  const cr = state.changeRequests[changeId];
  if (!cr) return notFound('change request');
  const found = activeWorkspace(state, cr.workspaceId as WorkspaceId, ctx);
  if (!found.ok) return found;
  const { ws, project } = found;
  if (cr.status !== 'proposed') return invalid('This change request has already been resolved.');
  if (decision === 'withdraw' && cr.proposedBy !== ctx.actorId) return forbidden('Only the person who proposed a change can withdraw it.');
  if (decision !== 'withdraw' && cr.proposedBy === ctx.actorId) return forbidden('The other party must accept or reject your change request.');
  if (decision === 'reject' && note.trim().length < 5) return fail('VALIDATION', 'Give a reason for rejecting.', { note: 'Give a reason (at least 5 characters).' });

  const tx = new Tx(state, ctx);
  const status = decision === 'accept' ? 'accepted' : decision === 'reject' ? 'rejected' : 'withdrawn';
  tx.put('changeRequests', changeId, { ...cr, status, responseNote: note.trim().slice(0, 600), resolvedAt: ctx.now });
  if (decision === 'accept') {
    const prev = currentAgreement(ws);
    const version = {
      revision: prev.revision + 1,
      totalPaise: cr.newTotalPaise ?? prev.totalPaise,
      startDate: prev.startDate,
      endDate: cr.newEndDate ?? prev.endDate,
      at: ctx.now,
      changeRequestId: changeId,
      note: cr.reason,
    };
    tx.put('workspaces', ws.id, { ...ws, agreement: [...ws.agreement, version] });
    const parts = [cr.newTotalPaise !== null ? `total ${formatMoney(prev.totalPaise)} → ${formatMoney(version.totalPaise)}` : null, cr.newEndDate ? `end date ${formatDate(prev.endDate)} → ${formatDate(version.endDate)}` : null, cr.scopeNote ? 'scope updated' : null].filter(Boolean);
    tx.log({ projectId: project.id, workspaceId: ws.id, type: 'change_accepted', summary: `Agreement revision ${version.revision}: ${parts.join('; ')}` });
  } else {
    tx.log({ projectId: project.id, workspaceId: ws.id, type: decision === 'reject' ? 'change_rejected' : 'change_withdrawn', summary: `Change request ${status}: ${cr.reason}` });
  }
  if (decision !== 'withdraw') {
    tx.notify({ recipientId: cr.proposedBy, category: 'change', title: `Change request ${status}`, body: note.trim() || cr.reason, link: links.workspace(ws.id, 'changes') });
  }
  return tx.done(undefined);
}

// ── Completion ────────────────────────────────────────────────────────────────

export function completeProject(state: DemoState, workspaceId: WorkspaceId, ctx: CommandContext): CommandResult {
  const found = activeWorkspace(state, workspaceId, ctx);
  if (!found.ok) return found;
  const { ws, project } = found;
  if (ctx.actorId !== ws.ownerId) return forbidden('Only the owner can mark the project complete.');
  if (project.status !== 'awarded' && project.status !== 'in_progress') return invalid('This project can’t be completed from its current status.');
  const milestones = workspaceMilestones(state, workspaceId);
  if (milestones.some((m) => m.status !== 'approved')) return invalid('Approve every milestone before marking the project complete.');
  if (Object.values(state.changeRequests).some((c) => c.workspaceId === workspaceId && c.status === 'proposed')) {
    return invalid('Resolve the open change request before completing the project.');
  }
  const tx = new Tx(state, ctx);
  tx.put('workspaces', ws.id, { ...ws, status: 'completed', completedAt: ctx.now });
  tx.put('projects', project.id, { ...project, status: 'completed', closedAt: ctx.now, updatedAt: ctx.now });
  tx.log({ projectId: project.id, workspaceId: ws.id, type: 'project_completed', summary: 'Project marked complete by the owner' });
  tx.notify({ recipientId: ws.contractorId, category: 'project', title: 'Project completed', body: `The owner marked “${project.title}” complete.`, link: links.workspace(ws.id) });
  return tx.done(undefined);
}
