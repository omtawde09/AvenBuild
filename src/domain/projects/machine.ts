import type { ProjectStatus } from '../status';
import type { DemoState, Project } from '../types';
import { isLiveQuote } from '../quotes/status';

export type ProjectAction = 'edit_draft' | 'delete_draft' | 'publish' | 'edit_published' | 'pause' | 'reopen' | 'close' | 'cancel' | 'complete' | 'accept_quotes';

export type Check = { ok: true } | { ok: false; reason: string };
const yes: Check = { ok: true };
const no = (reason: string): Check => ({ ok: false, reason });

const allowedFrom: Record<ProjectAction, ReadonlyArray<ProjectStatus>> = {
  edit_draft: ['draft'],
  delete_draft: ['draft'],
  publish: ['draft'],
  edit_published: ['open', 'reviewing', 'paused'],
  pause: ['open', 'reviewing'],
  reopen: ['paused'],
  close: ['draft', 'open', 'reviewing', 'paused'],
  cancel: ['open', 'reviewing', 'paused', 'awarded', 'in_progress'],
  complete: ['awarded', 'in_progress'],
  accept_quotes: ['open', 'reviewing'],
};

const reasons: Record<ProjectAction, string> = {
  edit_draft: 'Only drafts can be edited step by step.',
  delete_draft: 'Only drafts can be deleted. Close or cancel published projects instead.',
  publish: 'Only drafts can be published.',
  edit_published: 'This project can no longer be edited.',
  pause: 'Only projects that are open for quotes can be paused.',
  reopen: 'Only paused projects can be reopened.',
  close: 'Projects that are awarded, completed, closed or cancelled can’t be closed.',
  cancel: 'This project is already finished.',
  complete: 'Only awarded or in-progress projects can be completed.',
  accept_quotes: 'Quotes can only be accepted while the project is open for quotes. Reopen it first if it’s paused.',
};

/** Can this project perform the action from its current status? (Ownership is checked by commands.) */
export function canProject(project: Pick<Project, 'status'>, action: ProjectAction): Check {
  return allowedFrom[action].includes(project.status) ? yes : no(reasons[action]);
}

/** Status a paused/open project returns to, based on whether any quotes are still in play. */
export function openStatusFor(state: DemoState, projectId: string): 'open' | 'reviewing' {
  return Object.values(state.quotes).some((q) => q.projectId === projectId && isLiveQuote(q)) ? 'reviewing' : 'open';
}

export function allowedProjectActions(project: Pick<Project, 'status'>): ProjectAction[] {
  return (Object.keys(allowedFrom) as ProjectAction[]).filter((a) => canProject(project, a).ok);
}
