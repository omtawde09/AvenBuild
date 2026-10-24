import type { ActivityEvent, AgreementVersion, ChangeRequest, DemoState, Milestone, SiteUpdate, Workspace, WorkspaceDocument } from '../types';

export function currentAgreement(ws: Workspace): AgreementVersion {
  const last = ws.agreement.at(-1);
  if (!last) throw new Error(`Workspace ${ws.id} has no agreement`);
  return last;
}

export function workspaceMilestones(state: DemoState, workspaceId: string): Milestone[] {
  return Object.values(state.milestones)
    .filter((m) => m.workspaceId === workspaceId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Agreed progress: approved milestones count in full, submitted ones count half (work done, awaiting approval).
 * Never set by hand, so it can't jump randomly.
 */
export function workspaceProgress(milestones: ReadonlyArray<Milestone>): number {
  const total = milestones.reduce((s, m) => s + m.sharePercent, 0);
  if (!total) return 0;
  const done = milestones.reduce((s, m) => s + (m.status === 'approved' ? m.sharePercent : m.status === 'submitted' ? m.sharePercent / 2 : 0), 0);
  return Math.round((done / total) * 100);
}

export function workspaceForProject(state: DemoState, projectId: string): Workspace | undefined {
  return Object.values(state.workspaces).find((w) => w.projectId === projectId);
}

export function workspaceSiteUpdates(state: DemoState, workspaceId: string): SiteUpdate[] {
  return Object.values(state.siteUpdates)
    .filter((u) => u.workspaceId === workspaceId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function latestReportedProgress(updates: ReadonlyArray<SiteUpdate>): number | null {
  return updates[0]?.progressPercent ?? null;
}

export function workspaceDocuments(state: DemoState, workspaceId: string): WorkspaceDocument[] {
  return Object.values(state.documents)
    .filter((d) => d.workspaceId === workspaceId)
    .sort((a, b) => b.file.addedAt.localeCompare(a.file.addedAt));
}

export function workspaceChangeRequests(state: DemoState, workspaceId: string): ChangeRequest[] {
  return Object.values(state.changeRequests)
    .filter((c) => c.workspaceId === workspaceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function projectActivity(state: DemoState, projectId: string): ActivityEvent[] {
  return Object.values(state.activity)
    .filter((a) => a.projectId === projectId)
    .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
}

export function isParticipant(ws: Workspace, userId: string | null): boolean {
  return userId === ws.ownerId || userId === ws.contractorId;
}
