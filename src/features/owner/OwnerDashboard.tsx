import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CircleAlert, Clock, Plus } from 'lucide-react';
import { useActorId, useData, todayISO } from '@/app/store/demoStore';
import { ownerNextActions, ownerProjects, ownerVisibleQuotes, PROJECT_GROUPS } from '@/domain/projects/selectors';
import { conversationsFor, partyName } from '@/domain/messages/selectors';
import { effectiveQuoteStatus } from '@/domain/quotes/status';
import { quoteTotal } from '@/domain/quotes/math';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, SectionHeading } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/Badge';
import { formatMoney, formatRelative, formatShortDate } from '@/lib/format';
import { ProjectRow } from '@/features/projects/ProjectRow';
import { cn } from '@/lib/cn';

export function OwnerDashboard() {
  const data = useData();
  const me = useActorId();
  const today = todayISO();
  const user = data.users[me];

  const projects = useMemo(() => ownerProjects(data, me), [data, me]);
  const actions = useMemo(() => ownerNextActions(data, me, today), [data, me, today]);
  const counts = useMemo(() => PROJECT_GROUPS.map((g) => ({ ...g, count: projects.filter((p) => g.statuses.includes(p.status)).length })), [projects]);
  const quoteActivity = useMemo(
    () =>
      projects
        .flatMap((p) => ownerVisibleQuotes(data, p.id).map((q) => ({ q, p })))
        .sort((a, b) => (b.q.updatedAt ?? '').localeCompare(a.q.updatedAt ?? ''))
        .slice(0, 5),
    [data, projects],
  );
  const conversations = useMemo(() => conversationsFor(data, me).slice(0, 4), [data, me]);
  const updates = useMemo(() => {
    const myWs = new Set(Object.values(data.workspaces).filter((w) => w.ownerId === me).map((w) => w.id));
    return Object.values(data.siteUpdates)
      .filter((u) => myWs.has(u.workspaceId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3);
  }, [data, me]);
  const active = projects.filter((p) => p.status !== 'completed' && p.status !== 'closed' && p.status !== 'cancelled').slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Good to see you, ${user?.displayName.split(' ')[0] ?? 'there'}`}
        meta={<span>Your projects, quotes and site activity in one place.</span>}
        actions={
          <ButtonLink to="/owner/projects/new" icon={<Plus aria-hidden className="size-4" />}>
            Post a project
          </ButtonLink>
        }
      />

      <dl className="mb-8 grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {counts.map((c, i) => (
          <div key={c.value} className={cn('px-1 py-3 sm:px-4', i > 0 && 'sm:border-l sm:border-line', i % 2 === 1 && 'border-l border-line sm:border-l')}>
            <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{c.label}</dt>
            <dd className="mt-0.5 font-condensed text-3xl font-semibold tabular">
              <Link to={`/owner/projects?group=${c.value}`} className="hover:underline hover:underline-offset-2" aria-label={`${c.count} ${c.label}: view list`}>
                {c.count}
              </Link>
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <section aria-labelledby="next-actions">
            <SectionHeading id="next-actions" title="Needs your attention" description="Things only you can move forward." />
            {actions.length ? (
              <ol className="mt-3 divide-y divide-line border-y border-line">
                {actions.map((a) => (
                  <li key={a.id}>
                    <Link to={a.to} className="group flex items-start gap-3 px-1 py-3 hover:bg-surface sm:px-3">
                      <span
                        aria-hidden
                        className={cn('mt-1 size-2.5 shrink-0 rounded-full', a.tone === 'warn' ? 'bg-warn' : a.tone === 'accent' ? 'bg-brick' : 'bg-info')}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold group-hover:underline group-hover:underline-offset-2">{a.title}</span>
                        <span className="block truncate text-sm text-ink-2">{a.detail}</span>
                      </span>
                      <ArrowRight aria-hidden className="mt-1 size-4 shrink-0 text-ink-3" />
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState className="mt-3" title="Nothing waiting on you">
                New quotes, milestones to approve and change requests will appear here.
              </EmptyState>
            )}
          </section>

          <section aria-labelledby="my-active-projects">
            <SectionHeading
              id="my-active-projects"
              title="Current projects"
              action={
                <Link to="/owner/projects" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2">
                  All projects
                </Link>
              }
            />
            {active.length ? (
              <div className="mt-3 divide-y divide-line border-y border-line">
                {active.map((p) => (
                  <ProjectRow key={p.id} project={p} state={data} />
                ))}
              </div>
            ) : (
              <EmptyState className="mt-3" title="No current projects" action={<ButtonLink to="/owner/projects/new">Post a project</ButtonLink>}>
                Post a brief to start receiving quotes from matching contractors.
              </EmptyState>
            )}
          </section>
        </div>

        <aside className="space-y-10" aria-label="Recent activity">
          <section aria-labelledby="quote-activity">
            <SectionHeading id="quote-activity" title="Quote activity" />
            {quoteActivity.length ? (
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {quoteActivity.map(({ q, p }) => {
                  const total = quoteTotal(q.content);
                  return (
                    <li key={q.id}>
                      <Link to={`/owner/projects/${p.id}/quotes/${q.id}`} className="block px-1 py-2.5 hover:bg-surface sm:px-2">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">{partyName(data, q.contractorId)}</span>
                          <StatusBadge kind="quote" status={effectiveQuoteStatus(q, today)} />
                        </span>
                        <span className="mt-0.5 flex justify-between gap-2 text-sm text-ink-2">
                          <span className="truncate">{p.title}</span>
                          <span className="shrink-0 font-mono tabular">{total !== null ? formatMoney(total) : '—'}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-3">No quotes yet. They appear here when contractors respond to your published projects.</p>
            )}
          </section>

          <section aria-labelledby="latest-messages">
            <SectionHeading
              id="latest-messages"
              title="Latest messages"
              action={
                <Link to="/messages" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2">
                  All messages
                </Link>
              }
            />
            {conversations.length ? (
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {conversations.map(({ conversation: c, last, unread }) => (
                  <li key={c.id}>
                    <Link to={`/messages/${c.id}`} className="block px-1 py-2.5 hover:bg-surface sm:px-2">
                      <span className="flex items-center justify-between gap-2 text-sm">
                        <span className={cn('truncate', unread ? 'font-semibold' : 'font-medium')}>{partyName(data, c.contractorId)}</span>
                        <span className="shrink-0 text-xs text-ink-3">{last ? formatRelative(last.sentAt) : ''}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-sm text-ink-2">
                        {unread ? (
                          <span className="shrink-0 rounded-full bg-brick px-1.5 font-mono text-xs leading-5 text-white">
                            {unread}
                            <span className="sr-only"> unread</span>
                          </span>
                        ) : null}
                        <span className="truncate">{last?.body ?? 'No messages yet'}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-3">No conversations yet.</p>
            )}
          </section>

          <section aria-labelledby="site-updates">
            <SectionHeading id="site-updates" title="Recent site updates" />
            {updates.length ? (
              <ul className="mt-3 space-y-4">
                {updates.map((u) => (
                  <li key={u.id} className="border-l-2 border-line-strong pl-3">
                    <p className="flex items-center gap-1.5 text-xs text-ink-3">
                      <Clock aria-hidden className="size-3.5" />
                      {formatShortDate(u.date)} · {partyName(data, u.authorId)} · {u.progressPercent}% reported
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm">{u.notes}</p>
                    <Link to={`/workspace/${u.workspaceId}/updates`} className="mt-1 inline-flex min-h-9 items-center text-sm font-semibold underline underline-offset-2">
                      Open workspace
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex gap-2 text-sm text-ink-3">
                <CircleAlert aria-hidden className="size-4 shrink-0" />
                Site updates appear once a contractor is working on one of your projects.
              </p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
