import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Inbox } from 'lucide-react';
import { useActorId, useData, todayISO } from '@/app/store/demoStore';
import { contractorMetrics, upcomingMilestones } from '@/domain/leads/selectors';
import { contractorPipeline } from '@/domain/leads/pipeline';
import { buildLeadRows, defaultLeadFilters, filterLeads } from '@/domain/matching/filters';
import { portfolioCompleteness } from '@/domain/profile/commands';
import { quoteTotal } from '@/domain/quotes/math';
import { categoryLabel } from '@/data/categories';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, ProgressBar, SectionHeading } from '@/components/ui/Feedback';
import { budgetLabel } from '@/lib/labels';
import { formatDate, formatMoney, formatRelative } from '@/lib/format';
import { cn } from '@/lib/cn';

export function ContractorDashboard() {
  const data = useData();
  const me = useActorId();
  const today = todayISO();
  const profile = data.contractorProfiles[me];
  const metrics = useMemo(() => contractorMetrics(data, me, today), [data, me, today]);
  const leads = useMemo(() => filterLeads(buildLeadRows(data, me, today), defaultLeadFilters, today).filter((r) => !Object.values(data.quotes).some((q) => q.projectId === r.project.id && q.contractorId === me)).slice(0, 4), [data, me, today]);
  const needsAction = useMemo(() => contractorPipeline(data, me, today).filter((e) => e.stage === 'revision_requested' || e.stage === 'quote_draft'), [data, me, today]);
  const upcoming = useMemo(() => upcomingMilestones(data, me, today), [data, me, today]);
  const completeness = profile ? portfolioCompleteness(data, profile) : null;

  const stats: Array<{ label: string; value: number; to: string; hint: string }> = [
    { label: 'New matching leads', value: metrics.newLeads, to: '/contractor/leads', hint: 'Open projects in your trades and areas you haven’t quoted on' },
    { label: 'Saved leads', value: metrics.saved, to: '/contractor/leads?view=saved', hint: 'Leads you saved for later' },
    { label: 'Awaiting owner', value: metrics.awaitingOwner, to: '/contractor/quotes?stage=submitted', hint: 'Quotes submitted, no decision yet' },
    { label: 'Active jobs', value: metrics.activeJobs, to: '/workspace', hint: 'Accepted projects with an active workspace' },
  ];

  return (
    <>
      <PageHeader
        title={profile?.businessName ?? 'Dashboard'}
        meta={<span>Leads, quotes and jobs for your business.</span>}
        actions={
          <ButtonLink to="/contractor/leads" icon={<Inbox aria-hidden className="size-4" />}>
            Browse leads
          </ButtonLink>
        }
      />
      <dl className="mb-3 grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={cn('px-1 py-3 sm:px-4', i % 2 === 1 && 'border-l border-line', i > 0 && 'sm:border-l')}>
            <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{s.label}</dt>
            <dd className="mt-0.5">
              <Link to={s.to} className="font-condensed text-3xl font-semibold tabular hover:underline hover:underline-offset-2" aria-label={`${s.value} ${s.label}. ${s.hint}`}>
                {s.value}
              </Link>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mb-8 text-xs text-ink-3">
        Counts come from the projects and quotes stored in this demo. Owners have decided on {metrics.decided} of your quotes so far; {metrics.accepted} {metrics.accepted === 1 ? 'was' : 'were'} accepted.
      </p>

      <div className="grid grid-cols-1 gap-10 *:min-w-0 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          {needsAction.length ? (
            <section aria-labelledby="todo">
              <SectionHeading id="todo" title="Needs your action" />
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {needsAction.map((e) => (
                  <li key={e.project.id}>
                    <Link to={`/contractor/leads/${e.project.id}/quote`} className="flex items-start gap-3 px-1 py-3 hover:bg-surface sm:px-3">
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{e.stage === 'revision_requested' ? 'Revise your quote' : 'Finish your quote draft'}</span>
                        <span className="block truncate text-sm text-ink-2">{e.project.title}</span>
                        {e.stage === 'revision_requested' && e.quote?.revisionRequest ? <span className="mt-1 block text-sm text-ink-3">Owner: “{e.quote.revisionRequest.message}”</span> : null}
                      </span>
                      <StatusBadge kind="pipeline" status={e.stage} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="new-leads">
            <SectionHeading
              id="new-leads"
              title="New leads for you"
              action={
                <Link to="/contractor/leads" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2">
                  All leads
                </Link>
              }
            />
            {leads.length ? (
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {leads.map((r) => (
                  <li key={r.project.id}>
                    <Link to={`/contractor/leads/${r.project.id}`} className="group flex items-start gap-3 px-1 py-3 hover:bg-surface sm:px-3">
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold group-hover:underline group-hover:underline-offset-2">{r.project.title}</span>
                        <span className="block text-sm text-ink-2">
                          {r.project.category ? categoryLabel(r.project.category) : ''} · {r.project.location.locality}, {r.project.location.city} · <span className="font-mono tabular">{budgetLabel(r.project.budget)}</span>
                        </span>
                        <span className="block text-xs text-ink-3">
                          {r.invited ? 'Invited by the owner · ' : ''}Posted {r.project.publishedAt ? formatRelative(r.project.publishedAt) : ''} · {r.quoteCount} {r.quoteCount === 1 ? 'quote' : 'quotes'} so far
                        </span>
                      </span>
                      <ArrowRight aria-hidden className="mt-1 size-4 text-ink-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState className="mt-3" title="No new leads right now" action={<ButtonLink to="/contractor/profile" variant="secondary">Review services & areas</ButtonLink>}>
                Leads appear when owners publish projects in your trades and service areas.
              </EmptyState>
            )}
          </section>
        </div>

        <aside className="space-y-10" aria-label="Jobs and profile">
          <section aria-labelledby="upcoming">
            <SectionHeading id="upcoming" title="Upcoming milestones" />
            {upcoming.length ? (
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {upcoming.map(({ milestone: m, workspace: ws }) => {
                  const overdue = m.targetDate < today;
                  return (
                    <li key={m.id}>
                      <Link to={`/workspace/${ws.id}/milestones`} className="block px-1 py-2.5 hover:bg-surface sm:px-2">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">{m.title}</span>
                          <StatusBadge kind="milestone" status={m.status} />
                        </span>
                        <span className={cn('mt-0.5 block text-sm', overdue ? 'text-bad' : 'text-ink-2')}>
                          {overdue ? 'Overdue · was due' : 'Due'} {formatDate(m.targetDate)} · {data.projects[ws.projectId]?.title}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-3">No milestones due in the next three weeks.</p>
            )}
          </section>

          <section aria-labelledby="recent-quotes">
            <SectionHeading
              id="recent-quotes"
              title="Recent quotes"
              action={
                <Link to="/contractor/quotes" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2">
                  Pipeline
                </Link>
              }
            />
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {contractorPipeline(data, me, today)
                .filter((e) => e.quote && e.quote.status !== 'draft')
                .slice(0, 4)
                .map((e) => {
                  const total = e.quote ? quoteTotal(e.quote.content) : null;
                  return (
                    <li key={e.project.id}>
                      <Link to={`/contractor/quotes/${e.quote!.id}`} className="block px-1 py-2.5 hover:bg-surface sm:px-2">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">{e.project.title}</span>
                          <StatusBadge kind="pipeline" status={e.stage} />
                        </span>
                        <span className="mt-0.5 flex justify-between text-sm text-ink-2">
                          <span>{formatDate(e.stageAt)}</span>
                          <span className="font-mono tabular">{total !== null ? formatMoney(total) : '—'}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>

          {completeness ? (
            <section aria-labelledby="completeness" className="border border-line bg-surface p-4">
              <h2 id="completeness" className="font-semibold">
                Profile completeness
              </h2>
              <ProgressBar className="mt-2" value={completeness.percent} label="Profile completeness" />
              {completeness.missing.length ? (
                <p className="mt-2 text-sm text-ink-2">Still missing: {completeness.missing.join(', ').toLowerCase()}.</p>
              ) : (
                <p className="mt-2 text-sm text-ink-2">Everything owners look for is filled in.</p>
              )}
              <ButtonLink to="/contractor/portfolio" variant="secondary" size="sm" className="mt-3">
                Manage portfolio
              </ButtonLink>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
