import { Star } from 'lucide-react';
import type { ReviewAggregate } from '@/domain/reviews/aggregate';
import type { VerificationStatus } from '@/domain/types';
import { verificationLabel } from '@/lib/labels';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';

/** "4.5 ★ · 4 reviews" — always text, never stars alone. */
export function RatingInline({ rating, className }: { rating: ReviewAggregate; className?: string }) {
  if (!rating.count) return <span className={cn('text-sm text-ink-3', className)}>No reviews yet</span>;
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)}>
      <Star aria-hidden className="size-4 fill-brick text-brick" />
      <span className="font-semibold tabular">{rating.average.toFixed(1)}</span>
      <span className="text-ink-3">
        <span className="sr-only">out of 5 </span>· {formatNumber(rating.count)} {rating.count === 1 ? 'review' : 'reviews'}
      </span>
    </span>
  );
}

export function RatingBreakdown({ rating }: { rating: ReviewAggregate }) {
  const max = Math.max(1, ...rating.breakdown);
  const dims: Array<[string, number | null]> = [
    ['Communication', rating.dimensions.communication],
    ['Quality of work', rating.dimensions.quality],
    ['Schedule clarity', rating.dimensions.scheduleClarity],
  ];
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <p className="text-3xl font-semibold tabular">{rating.count ? rating.average.toFixed(1) : '—'}</p>
        <p className="text-sm text-ink-3">{rating.count ? `Average of ${rating.count} ${rating.count === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}</p>
        <ol className="mt-3 space-y-1" aria-label="Rating distribution">
          {[5, 4, 3, 2, 1].map((star) => {
            const n = rating.breakdown[star - 1] ?? 0;
            return (
              <li key={star} className="flex items-center gap-2 text-sm">
                <span className="w-12 shrink-0 tabular">{star} star</span>
                <span className="h-2 flex-1 overflow-hidden rounded-xs bg-sunken" aria-hidden>
                  <span className="block h-full bg-brick" style={{ width: `${(n / max) * 100}%` }} />
                </span>
                <span className="w-6 shrink-0 text-right font-mono text-xs tabular">{n}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <div>
      <dl className="space-y-2 text-sm">
        {dims.map(([label, v]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-line pb-1.5">
            <dt className="text-ink-2">{label}</dt>
            <dd className="font-semibold tabular">{v === null ? '—' : `${v.toFixed(1)} / 5`}</dd>
          </div>
        ))}
      </dl>
        <p className="pt-2 text-xs text-ink-3">Category scores are optional, so they may be based on fewer reviews than the overall average.</p>
      </div>
    </div>
  );
}

export function VerificationTag({ status, what }: { status: VerificationStatus; what: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs border border-dashed px-1.5 py-0.5 text-xs',
        status === 'not_submitted' ? 'border-line-strong text-ink-3' : 'border-ink-3/60 text-ink-2',
      )}
    >
      {what}: {verificationLabel[status]}
    </span>
  );
}
