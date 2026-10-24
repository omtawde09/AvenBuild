/** Branded ID types so IDs of different entities can't be mixed up. */
type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type ProjectId = Brand<string, 'ProjectId'>;
export type QuoteId = Brand<string, 'QuoteId'>;
export type LineItemId = Brand<string, 'LineItemId'>;
export type PortfolioItemId = Brand<string, 'PortfolioItemId'>;
export type WorkspaceId = Brand<string, 'WorkspaceId'>;
export type MilestoneId = Brand<string, 'MilestoneId'>;
export type SiteUpdateId = Brand<string, 'SiteUpdateId'>;
export type DocumentId = Brand<string, 'DocumentId'>;
export type AttachmentId = Brand<string, 'AttachmentId'>;
export type ChangeRequestId = Brand<string, 'ChangeRequestId'>;
export type ActivityId = Brand<string, 'ActivityId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type NotificationId = Brand<string, 'NotificationId'>;
export type ReviewId = Brand<string, 'ReviewId'>;

export type IdPrefix =
  | 'usr'
  | 'prj'
  | 'qt'
  | 'li'
  | 'pf'
  | 'ws'
  | 'ms'
  | 'su'
  | 'doc'
  | 'att'
  | 'cr'
  | 'act'
  | 'cnv'
  | 'msg'
  | 'ntf'
  | 'rev';

export type IdFactory = (prefix: IdPrefix) => string;

/** Default ID factory for runtime-created records (seed data uses fixed IDs). */
export const randomIdFactory: IdFactory = (prefix) => `${prefix}_${crypto.randomUUID()}`;

/** Deterministic ID factory for tests. */
export function sequentialIdFactory(start = 1): IdFactory {
  let n = start;
  return (prefix) => `${prefix}_t${String(n++).padStart(4, '0')}`;
}
