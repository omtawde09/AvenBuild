import type { UserId } from '../ids';
import { links } from '../links';
import { conversationsFor } from '../messages/selectors';
import { effectiveQuoteStatus, isLiveQuote } from '../quotes/status';
import { reviewEligibility } from '../reviews/commands';
import type { ProjectStatus } from '../status';
import type { DemoState, ISODate, Project, Quote } from '../types';
import { workspaceForProject, workspaceMilestones } from '../workspace/selectors';

export function ownerProjects(state: DemoState, ownerId: UserId): Project[] {
  return Object.values(state.projects)
    .filter((p) => p.ownerId === ownerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
}

/** Quotes the owner may see for a project — never the contractor's unsubmitted drafts. */
export function ownerVisibleQuotes(state: DemoState, projectId: string): Quote[] {
  return Object.values(state.quotes)
    .filter((q) => q.projectId === projectId && q.status !== 'draft')
    .sort((a, b) => (b.submittedAt ?? b.updatedAt).localeCompare(a.submittedAt ?? a.updatedAt));
}

export function liveQuoteCount(state: DemoState, projectId: string): number {
  return Object.values(state.quotes).filter((q) => q.projectId === projectId && isLiveQuote(q)).length;
}

export function unseenQuoteCount(state: DemoState, projectId: string): number {
  return Object.values(state.quotes).filter((q) => q.projectId === projectId && q.status === 'submitted').length;
}

export const PROJECT_GROUPS: ReadonlyArray<{ value: 'active' | 'quoting' | 'drafts' | 'closed'; label: string; statuses: ProjectStatus[] }> = [
  { value: 'quoting', label: 'Collecting quotes', statuses: ['open', 'reviewing', 'paused'] },
  { value: 'active', label: 'Work in progress', statuses: ['awarded', 'in_progress'] },
  { value: 'drafts', label: 'Drafts', statuses: ['draft'] },
  { value: 'closed', label: 'Finished', statuses: ['completed', 'closed', 'cancelled'] },
];

export interface NextAction {
  id: string;
  title: string;
  detail: string;
  to: string;
  tone: 'accent' | 'warn' | 'info';
}

/** Owner "what needs me" list, derived only from real state. */
export function ownerNextActions(state: DemoState, ownerId: UserId, today: ISODate): NextAction[] {
  const actions: NextAction[] = [];
  for (const p of ownerProjects(state, ownerId)) {
    if (p.status === 'draft') {
      actions.push({ id: `draft-${p.id}`, title: `Finish and publish “${p.title || 'Untitled draft'}”`, detail: 'Drafts aren’t visible to contractors until published.', to: `/owner/projects/${p.id}/edit`, tone: 'info' });
    }
    if (p.status === 'open' || p.status === 'reviewing') {
      const fresh = ownerVisibleQuotes(state, p.id).filter((q) => q.status === 'submitted' && effectiveQuoteStatus(q, today) !== 'expired');
      if (fresh.length) {
        actions.push({ id: `quotes-${p.id}`, title: `${fresh.length} new ${fresh.length === 1 ? 'quote' : 'quotes'} to review`, detail: p.title, to: links.ownerQuotes(p.id), tone: 'accent' });
      }
    }
    if (p.status === 'paused') {
      actions.push({ id: `paused-${p.id}`, title: `“${p.title}” is paused`, detail: 'Contractors can’t see it. Reopen it when you’re ready.', to: links.ownerProject(p.id), tone: 'info' });
    }
    const ws = workspaceForProject(state, p.id);
    if (ws?.status === 'active') {
      const ms = workspaceMilestones(state, ws.id);
      const waiting = ms.filter((m) => m.status === 'submitted');
      if (waiting.length) actions.push({ id: `ms-${ws.id}`, title: `Approve ${waiting.length === 1 ? `“${waiting[0]!.title}”` : `${waiting.length} milestones`}`, detail: p.title, to: links.workspace(ws.id, 'milestones'), tone: 'warn' });
      const pendingCr = Object.values(state.changeRequests).find((c) => c.workspaceId === ws.id && c.status === 'proposed' && c.proposedBy !== ownerId);
      if (pendingCr) actions.push({ id: `cr-${pendingCr.id}`, title: 'Respond to a change request', detail: pendingCr.reason, to: links.workspace(ws.id, 'changes'), tone: 'warn' });
      if (ms.length && ms.every((m) => m.status === 'approved')) actions.push({ id: `complete-${ws.id}`, title: `Mark “${p.title}” complete`, detail: 'All milestones are approved.', to: links.workspace(ws.id), tone: 'accent' });
    }
    if (ws?.status === 'completed' && reviewEligibility(state, ws.id, ownerId).ok) {
      const name = state.contractorProfiles[ws.contractorId]?.businessName ?? 'the contractor';
      actions.push({ id: `review-${ws.id}`, title: `Review ${name}`, detail: p.title, to: links.workspace(ws.id, 'review'), tone: 'info' });
    }
  }
  const unread = conversationsFor(state, ownerId).filter((r) => r.unread > 0);
  if (unread.length) actions.push({ id: 'unread', title: `${unread.length} ${unread.length === 1 ? 'conversation has' : 'conversations have'} unread messages`, detail: 'Open Messages to reply.', to: '/messages', tone: 'info' });
  const weight = { warn: 0, accent: 1, info: 2 } as const;
  return actions.sort((a, b) => weight[a.tone] - weight[b.tone]);
}
