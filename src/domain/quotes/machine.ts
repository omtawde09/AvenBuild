import type { QuoteStatus } from '../status';
import type { Quote } from '../types';
import type { Check } from '../projects/machine';

export type QuoteAction = 'submit' | 'revise' | 'resubmit' | 'withdraw' | 'request_revision' | 'accept' | 'decline';

const allowedFrom: Record<QuoteAction, ReadonlyArray<QuoteStatus>> = {
  submit: ['draft'],
  revise: ['revision_requested', 'withdrawn'],
  resubmit: ['revision_requested', 'withdrawn'],
  withdraw: ['submitted', 'viewed', 'revision_requested'],
  request_revision: ['submitted', 'viewed'],
  accept: ['submitted', 'viewed'],
  decline: ['submitted', 'viewed', 'revision_requested'],
};

const reasons: Record<QuoteAction, string> = {
  submit: 'Only draft quotes can be submitted.',
  revise: 'A quote can be revised after the owner asks for changes, or after you withdraw it.',
  resubmit: 'A quote can be resubmitted after the owner asks for changes, or after you withdraw it.',
  withdraw: 'Only quotes that are waiting for the owner’s decision can be withdrawn.',
  request_revision: 'Revisions can be requested only on submitted quotes.',
  accept: 'Only submitted quotes can be accepted. Wait for the contractor to resubmit if a revision was requested.',
  decline: 'This quote has already been decided or withdrawn.',
};

export function canQuote(quote: Pick<Quote, 'status'>, action: QuoteAction): Check {
  return allowedFrom[action].includes(quote.status) ? { ok: true } : { ok: false, reason: reasons[action] };
}
