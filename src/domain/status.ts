/**
 * Lifecycle status vocabularies and their user-facing labels.
 * This is the single source of truth for status wording across the app.
 */

export const PROJECT_STATUSES = [
  'draft',
  'open',
  'reviewing',
  'paused',
  'awarded',
  'in_progress',
  'completed',
  'closed',
  'cancelled',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const QUOTE_STATUSES = [
  'draft',
  'submitted',
  'viewed',
  'revision_requested',
  'accepted',
  'declined',
  'withdrawn',
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
/** Quote status including the derived "expired" state. */
export type EffectiveQuoteStatus = QuoteStatus | 'expired';

export const PIPELINE_STAGES = [
  'new',
  'invited',
  'saved',
  'ignored',
  'quote_draft',
  'submitted',
  'revision_requested',
  'accepted',
  'declined',
  'withdrawn',
  'closed',
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const MILESTONE_STATUSES = ['pending', 'in_progress', 'submitted', 'changes_requested', 'approved'] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const CHANGE_REQUEST_STATUSES = ['proposed', 'accepted', 'rejected', 'withdrawn'] as const;
export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

export const WORKSPACE_STATUSES = ['active', 'completed', 'cancelled'] as const;
export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

/** Visual tone used by StatusBadge. Every tone is always paired with a text label. */
export type StatusTone = 'neutral' | 'info' | 'accent' | 'ok' | 'warn' | 'bad' | 'muted';

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

export const projectStatusMeta: Record<ProjectStatus, StatusMeta> = {
  draft: { label: 'Draft', tone: 'muted' },
  open: { label: 'Open for quotes', tone: 'info' },
  reviewing: { label: 'Reviewing quotes', tone: 'accent' },
  paused: { label: 'Paused', tone: 'warn' },
  awarded: { label: 'Awarded', tone: 'ok' },
  in_progress: { label: 'In progress', tone: 'ok' },
  completed: { label: 'Completed', tone: 'neutral' },
  closed: { label: 'Closed', tone: 'muted' },
  cancelled: { label: 'Cancelled', tone: 'bad' },
};

export const quoteStatusMeta: Record<EffectiveQuoteStatus, StatusMeta> = {
  draft: { label: 'Draft', tone: 'muted' },
  submitted: { label: 'Submitted', tone: 'info' },
  viewed: { label: 'Viewed by owner', tone: 'info' },
  revision_requested: { label: 'Revision requested', tone: 'warn' },
  accepted: { label: 'Accepted', tone: 'ok' },
  declined: { label: 'Declined', tone: 'bad' },
  withdrawn: { label: 'Withdrawn', tone: 'muted' },
  expired: { label: 'Expired', tone: 'warn' },
};

export const pipelineStageMeta: Record<PipelineStage, StatusMeta> = {
  new: { label: 'New', tone: 'info' },
  invited: { label: 'Invited', tone: 'accent' },
  saved: { label: 'Saved', tone: 'neutral' },
  ignored: { label: 'Ignored', tone: 'muted' },
  quote_draft: { label: 'Quote draft', tone: 'muted' },
  submitted: { label: 'Submitted', tone: 'info' },
  revision_requested: { label: 'Revision requested', tone: 'warn' },
  accepted: { label: 'Accepted', tone: 'ok' },
  declined: { label: 'Declined', tone: 'bad' },
  withdrawn: { label: 'Withdrawn', tone: 'muted' },
  closed: { label: 'Closed', tone: 'muted' },
};

export const milestoneStatusMeta: Record<MilestoneStatus, StatusMeta> = {
  pending: { label: 'Not started', tone: 'muted' },
  in_progress: { label: 'In progress', tone: 'info' },
  submitted: { label: 'Awaiting approval', tone: 'accent' },
  changes_requested: { label: 'Changes requested', tone: 'warn' },
  approved: { label: 'Approved', tone: 'ok' },
};

export const changeRequestStatusMeta: Record<ChangeRequestStatus, StatusMeta> = {
  proposed: { label: 'Awaiting response', tone: 'accent' },
  accepted: { label: 'Accepted', tone: 'ok' },
  rejected: { label: 'Rejected', tone: 'bad' },
  withdrawn: { label: 'Withdrawn', tone: 'muted' },
};

export const workspaceStatusMeta: Record<WorkspaceStatus, StatusMeta> = {
  active: { label: 'Active', tone: 'ok' },
  completed: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'bad' },
};
