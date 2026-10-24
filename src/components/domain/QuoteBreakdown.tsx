import { localeConfig } from '@/config/locale';
import { safeQuoteTotals } from '@/domain/quotes/math';
import type { QuoteContent } from '@/domain/types';
import { formatDate, formatMoneyExact, formatNumber, unitLabel } from '@/lib/format';
import { cn } from '@/lib/cn';

export function TotalsBlock({ content, className }: { content: Pick<QuoteContent, 'lineItems' | 'discount' | 'taxPercent'>; className?: string }) {
  const totals = safeQuoteTotals(content);
  if (!totals) return <p className={cn('text-sm text-ink-3', className)}>Totals appear once every line has a valid quantity and rate.</p>;
  const discountLabel = content.discount.kind === 'percent' ? `Discount (${formatNumber(content.discount.percent)}%)` : 'Discount';
  return (
    <div className={className}>
    <dl className="space-y-1.5 font-mono text-sm tabular">
      <div className="flex justify-between gap-4">
        <dt className="font-sans text-ink-2">Subtotal</dt>
        <dd>{formatMoneyExact(totals.subtotalPaise)}</dd>
      </div>
      {totals.discountPaise ? (
        <div className="flex justify-between gap-4">
          <dt className="font-sans text-ink-2">{discountLabel}</dt>
          <dd>−{formatMoneyExact(totals.discountPaise)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-4">
        <dt className="font-sans text-ink-2">
          {localeConfig.taxLabel} {formatNumber(content.taxPercent)}%
        </dt>
        <dd>{formatMoneyExact(totals.taxPaise)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-line pt-2 text-base font-semibold">
        <dt className="font-sans">Total</dt>
        <dd>{formatMoneyExact(totals.totalPaise)}</dd>
      </div>
    </dl>
      <p className="mt-1.5 text-xs text-ink-3">Each line, the discount and the tax are rounded to the nearest paisa. Tax figures are demo inputs, not tax advice.</p>
    </div>
  );
}

/** Line items: a table on wider screens, stacked rows on phones (no facts hidden). */
export function LineItems({ content }: { content: QuoteContent }) {
  const totals = safeQuoteTotals(content);
  const amount = (id: string) => totals?.lines.find((l) => l.id === id)?.amountPaise;
  return (
    <>
      <ul className="divide-y divide-line border-y border-line md:hidden">
        {content.lineItems.map((li) => (
          <li key={li.id} className="py-2.5">
            <p className="text-sm font-medium">{li.description || 'Untitled item'}</p>
            <p className="mt-0.5 flex justify-between gap-2 font-mono text-sm text-ink-2 tabular">
              <span>
                {formatNumber(li.quantity)} {unitLabel[li.unit]} × {formatMoneyExact(li.ratePaise)}
              </span>
              <span className="text-ink">{amount(li.id) !== undefined ? formatMoneyExact(amount(li.id)!) : '—'}</span>
            </p>
          </li>
        ))}
      </ul>
      <table className="hidden w-full text-sm md:table">
        <caption className="sr-only">Line items</caption>
        <thead>
          <tr className="border-b border-line-strong text-left text-xs tracking-wide text-ink-3 uppercase">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Item
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">
              Qty
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Unit
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">
              Rate
            </th>
            <th scope="col" className="py-2 text-right font-semibold">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="font-mono tabular">
          {content.lineItems.map((li) => (
            <tr key={li.id} className="border-b border-line align-top">
              <td className="py-2 pr-3 font-sans">{li.description || 'Untitled item'}</td>
              <td className="py-2 pr-3 text-right">{formatNumber(li.quantity)}</td>
              <td className="py-2 pr-3 font-sans text-ink-2">{unitLabel[li.unit]}</td>
              <td className="py-2 pr-3 text-right">{formatMoneyExact(li.ratePaise)}</td>
              <td className="py-2 text-right">{amount(li.id) !== undefined ? formatMoneyExact(amount(li.id)!) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function TermList({ title, items, empty = 'None stated' }: { title: string; items: ReadonlyArray<string>; empty?: string }) {
  return (
    <div>
      <h4 className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{title}</h4>
      {items.length ? (
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-sm text-ink-3">{empty}</p>
      )}
    </div>
  );
}

/** Full itemised quote: lines, totals, schedule, validity and written terms. */
export function QuoteBreakdown({ content, showSchedule = true }: { content: QuoteContent; showSchedule?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <LineItems content={content} />
        <TotalsBlock content={content} className="ml-auto max-w-sm" />
      </div>
      {showSchedule ? (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
          <div className="border-t border-line pt-2">
            <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Start window</dt>
            <dd className="mt-0.5 text-sm">
              {formatDate(content.startWindow.earliest)} – {formatDate(content.startWindow.latest)}
            </dd>
          </div>
          <div className="border-t border-line pt-2">
            <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Duration</dt>
            <dd className="mt-0.5 text-sm">{content.durationDays} days</dd>
          </div>
          <div className="border-t border-line pt-2">
            <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Price valid until</dt>
            <dd className="mt-0.5 text-sm">{formatDate(content.validUntil)}</dd>
          </div>
        </dl>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-3">
        <TermList title="Included" items={content.inclusions} />
        <TermList title="Not included" items={content.exclusions} />
        <TermList title="Assumptions" items={content.assumptions} />
      </div>
      {content.proposedMilestones.length ? (
        <div>
          <h4 className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Proposed milestones</h4>
          <ol className="mt-1.5 space-y-1 text-sm">
            {content.proposedMilestones.map((m, i) => (
              <li key={`${m.title}-${i}`} className="flex justify-between gap-3 border-b border-line pb-1">
                <span>
                  {i + 1}. {m.title}
                </span>
                <span className="font-mono tabular">{m.sharePercent}%</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {content.note ? (
        <div>
          <h4 className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Note from the contractor</h4>
          <p className="mt-1.5 text-sm whitespace-pre-line">{content.note}</p>
        </div>
      ) : null}
    </div>
  );
}
