import type { UserId } from '../ids';
import { buildLeadRows } from '../matching/filters';
import { contractorPipeline } from './pipeline';
import type { DemoState, ISODate, Milestone, Workspace } from '../types';
import { addDays } from '../time';
import { workspaceMilestones } from '../workspace/selectors';

export interface ContractorMetrics {
  /** Open, matching projects the contractor hasn't ignored or quoted on yet. */
  newLeads: number;
  saved: number;
  awaitingOwner: number;
  revisionRequested: number;
  drafts: number;
  activeJobs: number;
  /** Quotes the owner decided on (accepted or declined by the owner) in this demo's data. */
  decided: number;
  accepted: number;
}

export function contractorMetrics(state: DemoState, me: UserId, today: ISODate): ContractorMetrics {
  const rows = buildLeadRows(state, me, today);
  const pipeline = contractorPipeline(state, me, today);
  const stageCount = (s: string) => pipeline.filter((e) => e.stage === s).length;
  const quotedProjects = new Set(Object.values(state.quotes).filter((q) => q.contractorId === me).map((q) => q.projectId));
  return {
    newLeads: rows.filter((r) => r.disposition !== 'ignored' && !quotedProjects.has(r.project.id)).length,
    saved: rows.filter((r) => r.disposition === 'saved').length,
    awaitingOwner: stageCount('submitted'),
    revisionRequested: stageCount('revision_requested'),
    drafts: stageCount('quote_draft'),
    activeJobs: Object.values(state.workspaces).filter((w) => w.contractorId === me && w.status === 'active').length,
    decided: stageCount('accepted') + stageCount('declined'),
    accepted: stageCount('accepted'),
  };
}

export interface UpcomingMilestone {
  milestone: Milestone;
  workspace: Workspace;
}

/** Milestones the contractor still has to deliver, due within `days`. Overdue ones are included. */
export function upcomingMilestones(state: DemoState, me: UserId, today: ISODate, days = 21): UpcomingMilestone[] {
  const limit = addDays(today, days);
  const out: UpcomingMilestone[] = [];
  for (const ws of Object.values(state.workspaces)) {
    if (ws.contractorId !== me || ws.status !== 'active') continue;
    for (const m of workspaceMilestones(state, ws.id)) {
      if ((m.status === 'pending' || m.status === 'in_progress' || m.status === 'changes_requested') && m.targetDate <= limit) out.push({ milestone: m, workspace: ws });
    }
  }
  return out.sort((a, b) => a.milestone.targetDate.localeCompare(b.milestone.targetDate));
}
