import type { EffectiveQuoteStatus, QuoteStatus } from '../status';
import type { ISODate, Quote } from '../types';

/** Statuses in which a quote is still "in play" for its project. */
export const LIVE_QUOTE_STATUSES: ReadonlySet<QuoteStatus> = new Set(['submitted', 'viewed', 'revision_requested']);

export function isLiveQuote(q: Quote): boolean {
  return LIVE_QUOTE_STATUSES.has(q.status);
}

/** A submitted/viewed quote whose validity date has passed is treated as expired (derived, never stored). */
export function isExpired(q: Quote, today: ISODate): boolean {
  return (q.status === 'submitted' || q.status === 'viewed') && q.content.validUntil < today;
}

export function effectiveQuoteStatus(q: Quote, today: ISODate): EffectiveQuoteStatus {
  return isExpired(q, today) ? 'expired' : q.status;
}

/** Content the owner sees: always the last submitted version (pending revision edits stay private). */
export function ownerVisibleContent(q: Quote) {
  return q.content;
}

/** Content the contractor edits in the composer. */
export function editableContent(q: Quote) {
  return q.pendingContent ?? q.content;
}
