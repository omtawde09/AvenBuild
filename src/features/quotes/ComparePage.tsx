import { useMemo, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useActorId, useData, todayISO } from '@/app/store/demoStore';
import { ownerVisibleQuotes } from '@/domain/projects/selectors';
import { effectiveQuoteStatus } from '@/domain/quotes/status';
import { safeQuoteTotals } from '@/domain/quotes/math';
import { aggregateReviews } from '@/domain/reviews/aggregate';
import { partyName } from '@/domain/messages/selectors';
import type { Quote } from '@/domain/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { RatingInline, VerificationTag } from '@/components/domain/Reputation';
import { RecordNotFound } from '@/features/public/NotFoundPage';
import { formatDate, formatMoney, formatMoneyExact, formatNumber, unitLabel } from '@/lib/format';

interface Row {
  label: string;
  render: (q: Quote) => ReactNode;
}

const list = (items: string[]) =>
  items.length ? (
    <ul className="list-disc space-y-0.5 pl-4">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  ) : (
    <span className="text-ink-3">None stated</span>
  );

/** Side-by-side comparison on everything that matters — not just the star rating. */
export function ComparePage() {
  const { projectId = '' } = useParams();
  const [params] = useSearchParams();
  const data = useData();
  const me = useActorId();
  const today = todayISO();
  const project = data.projects[projectId];
  const quotes = useMemo(() => {
    if (!project) return [];
    const ids = (params.get('ids') ?? '').split(',').filter(Boolean);
    const visible = ownerVisibleQuotes(data, project.id);
    const picked = ids.length ? visible.filter((q) => ids.includes(q.id)) : visible;
    return picked.slice(0, 4);
  }, [data, project, params]);

  if (!project || project.ownerId !== me) return <RecordNotFound what="project" backTo="/owner/projects" backLabel="Back to my projects" />;

  const totals = new Map(quotes.map((q) => [q.id, safeQuoteTotals(q.content)]));
  const comparable = quotes.filter((q) => ['submitted', 'viewed', 'revision_requested'].includes(q.status));
  const lowest = comparable.reduce<Quote | null>((min, q) => {
    const t = totals.get(q.id)?.totalPaise;
    const m = min ? totals.get(min.id)?.totalPaise : undefined;
    return t !== undefined && (m === undefined || t < m) ? q : min;
  }, null);
  const fastest = comparable.reduce<Quote | null>((min, q) => (!min || q.content.durationDays < min.content.durationDays ? q : min), null);

  const rows: Row[] = [
    {
      label: 'Total (incl. tax)',
      render: (q) => (
        <div className="space-y-1">
          <p className="font-mono text-lg font-semibold tabular">{totals.get(q.id) ? formatMoneyExact(totals.get(q.id)!.totalPaise) : '—'}</p>
          {lowest?.id === q.id && comparable.length > 1 ? <Badge tone="ok">Lowest total</Badge> : null}
        </div>
      ),
    },
    {
      label: 'Price breakdown',
      render: (q) => {
        const t = totals.get(q.id);
        return t ? (
          <dl className="space-y-0.5 font-mono text-xs tabular">
            <div className="flex justify-between gap-2">
              <dt className="font-sans text-ink-3">Subtotal</dt>
              <dd>{formatMoney(t.subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="font-sans text-ink-3">Discount</dt>
              <dd>{t.discountPaise ? `−${formatMoney(t.discountPaise)}` : '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="font-sans text-ink-3">Tax {formatNumber(q.content.taxPercent)}%</dt>
              <dd>{formatMoney(t.taxPaise)}</dd>
            </div>
          </dl>
        ) : (
          '—'
        );
      },
    },
    { label: 'Status', render: (q) => <StatusBadge kind="quote" status={effectiveQuoteStatus(q, today)} /> },
    {
      label: 'Timeline',
      render: (q) => (
        <div className="space-y-1">
          <p>
            Start {formatDate(q.content.startWindow.earliest)} – {formatDate(q.content.startWindow.latest)}
          </p>
          <p>{q.content.durationDays} days on site</p>
          {fastest?.id === q.id && comparable.length > 1 ? <Badge tone="info">Shortest duration</Badge> : null}
        </div>
      ),
    },
    { label: 'Price valid until', render: (q) => formatDate(q.content.validUntil) },
    {
      label: 'Line items',
      render: (q) => (
        <ul className="space-y-1">
          {q.content.lineItems.map((li) => (
            <li key={li.id}>
              {li.description}
              <span className="block font-mono text-xs text-ink-3 tabular">
                {formatNumber(li.quantity)} {unitLabel[li.unit]} × {formatMoney(li.ratePaise)}
              </span>
            </li>
          ))}
        </ul>
      ),
    },
    { label: 'Included', render: (q) => list(q.content.inclusions) },
    { label: 'Not included', render: (q) => list(q.content.exclusions) },
    { label: 'Assumptions', render: (q) => list(q.content.assumptions) },
    {
      label: 'Milestones',
      render: (q) => (q.content.proposedMilestones.length ? list(q.content.proposedMilestones.map((m) => `${m.title} (${m.sharePercent}%)`)) : <span className="text-ink-3">Default plan if accepted</span>),
    },
    {
      label: 'Contractor evidence',
      render: (q) => {
        const p = data.contractorProfiles[q.contractorId];
        if (!p) return '—';
        const rating = aggregateReviews(Object.values(data.reviews).filter((r) => r.contractorId === q.contractorId));
        const portfolio = Object.values(data.portfolio).filter((x) => x.contractorId === q.contractorId).length;
        return (
          <div className="space-y-1.5">
            <RatingInline rating={rating} />
            <p>
              {p.yearsExperience} yrs · team {p.teamSize} · {portfolio} portfolio
            </p>
            {p.responseTimeSampleHours !== null ? <p className="text-ink-3">Replies ~{p.responseTimeSampleHours} h (sample)</p> : null}
            <div className="flex flex-wrap gap-1">
              <VerificationTag what="Licence" status={p.qualifications.licenceStatus} />
              <VerificationTag what="GST" status={p.qualifications.gstStatus} />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Compare quotes"
        crumbs={[{ label: 'Projects', to: '/owner/projects' }, { label: project.title, to: `/owner/projects/${project.id}` }, { label: 'Quotes', to: `/owner/projects/${project.id}/quotes` }, { label: 'Compare' }]}
        meta={<span>{project.title}</span>}
      />
      {quotes.length < 2 ? (
        <EmptyState title="Pick at least two quotes to compare" action={<ButtonLink to={`/owner/projects/${project.id}/quotes`}>Choose quotes</ButtonLink>}>
          This project has {quotes.length} quote{quotes.length === 1 ? '' : 's'} available to compare.
        </EmptyState>
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-2">Read “Included” and “Not included” before comparing totals — a lower price often leaves work out.</p>

          {/* Phones: stacked by attribute so every fact stays visible without sideways scrolling. */}
          <div className="space-y-6 md:hidden">
            {rows.map((row) => (
              <section key={row.label} aria-label={row.label}>
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">{row.label}</h2>
                <ul className="divide-y divide-line border-y border-line">
                  {quotes.map((q) => (
                    <li key={q.id} className="py-2.5 text-sm">
                      <p className="mb-1 font-semibold">{partyName(data, q.contractorId)}</p>
                      {row.render(q)}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Tablet and up: one column per quote; the table scrolls inside its own container if needed. */}
          <div className="hidden overflow-x-auto border border-line md:block">
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <caption className="sr-only">Quote comparison for {project.title}</caption>
              <thead>
                <tr className="bg-sunken text-left">
                  <th scope="col" className="sticky left-0 w-40 bg-sunken px-3 py-3 text-xs font-semibold tracking-wide text-ink-3 uppercase">
                    Quote
                  </th>
                  {quotes.map((q) => (
                    <th key={q.id} scope="col" className="min-w-52 border-l border-line px-3 py-3 align-top">
                      <span className="block font-semibold">{partyName(data, q.contractorId)}</span>
                      <Link to={`/owner/projects/${project.id}/quotes/${q.id}`} className="mt-1 inline-flex min-h-9 items-center text-sm font-normal underline underline-offset-2">
                        View &amp; decide
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-t border-line align-top">
                    <th scope="row" className="sticky left-0 bg-paper px-3 py-3 text-left text-xs font-semibold tracking-wide text-ink-3 uppercase">
                      {row.label}
                    </th>
                    {quotes.map((q) => (
                      <td key={q.id} className="border-l border-line px-3 py-3">
                        {row.render(q)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 md:hidden">
            {quotes.map((q) => (
              <ButtonLink key={q.id} to={`/owner/projects/${project.id}/quotes/${q.id}`} variant="secondary" size="sm" className="h-auto py-2 text-left whitespace-normal!">
                Decide on {partyName(data, q.contractorId)}
              </ButtonLink>
            ))}
          </div>
        </>
      )}
    </>
  );
}
