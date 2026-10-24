import type { UserId } from '../ids';
import { isOpenForQuotes } from '../matching/match';
import type { PipelineStage } from '../status';
import type { DemoState, ISODate, ISODateTime, Project, Quote } from '../types';
import { invitationKey, leadKey } from '../types';
import { isExpired } from '../quotes/status';

export interface PipelineEntry {
  project: Project;
  quote: Quote | null;
  stage: PipelineStage;
  /** Timestamp of the event that produced the current stage. */
  stageAt: ISODateTime;
  expired: boolean;
}

/** Derive a contractor's pipeline stage for one project (architecture §6.5). */
export function pipelineStage(state: DemoState, contractorId: UserId, project: Project, quote: Quote | null, today: ISODate): PipelineEntry {
  const lead = state.leadStates[leadKey(contractorId, project.id)];
  const invitation = state.invitations[invitationKey(contractorId, project.id)];
  const base = { project, quote, expired: quote ? isExpired(quote, today) : false };
  if (quote) {
    switch (quote.status) {
      case 'accepted':
        return { ...base, stage: 'accepted', stageAt: quote.decidedAt ?? quote.updatedAt };
      case 'declined':
        return { ...base, stage: quote.declineReason === 'owner' ? 'declined' : 'closed', stageAt: quote.decidedAt ?? quote.updatedAt };
      case 'withdrawn':
        return { ...base, stage: isOpenForQuotes(project) ? 'withdrawn' : 'closed', stageAt: quote.withdrawnAt ?? quote.updatedAt };
      case 'revision_requested':
        return { ...base, stage: 'revision_requested', stageAt: quote.revisionRequest?.at ?? quote.updatedAt };
      case 'submitted':
      case 'viewed':
        return { ...base, stage: 'submitted', stageAt: quote.viewedAt ?? quote.submittedAt ?? quote.updatedAt };
      case 'draft':
        return { ...base, stage: isOpenForQuotes(project) ? 'quote_draft' : 'closed', stageAt: quote.updatedAt };
    }
  }
  if (!isOpenForQuotes(project)) return { ...base, stage: 'closed', stageAt: project.closedAt ?? project.updatedAt };
  if (lead?.disposition === 'saved') return { ...base, stage: 'saved', stageAt: lead.updatedAt };
  if (lead?.disposition === 'ignored') return { ...base, stage: 'ignored', stageAt: lead.updatedAt };
  if (invitation) return { ...base, stage: 'invited', stageAt: invitation.createdAt };
  return { ...base, stage: 'new', stageAt: project.publishedAt ?? project.createdAt };
}

/** Every project the contractor has engaged with: quoted, saved, ignored or been invited to. */
export function contractorPipeline(state: DemoState, contractorId: UserId, today: ISODate): PipelineEntry[] {
  const projectIds = new Set<string>();
  for (const q of Object.values(state.quotes)) if (q.contractorId === contractorId) projectIds.add(q.projectId);
  for (const l of Object.values(state.leadStates)) if (l.contractorId === contractorId) projectIds.add(l.projectId);
  for (const i of Object.values(state.invitations)) if (i.contractorId === contractorId) projectIds.add(i.projectId);
  const entries: PipelineEntry[] = [];
  for (const pid of projectIds) {
    const project = state.projects[pid];
    if (!project) continue;
    const quote = Object.values(state.quotes).find((q) => q.projectId === pid && q.contractorId === contractorId) ?? null;
    entries.push(pipelineStage(state, contractorId, project, quote, today));
  }
  return entries.sort((a, b) => b.stageAt.localeCompare(a.stageAt) || a.project.id.localeCompare(b.project.id));
}
