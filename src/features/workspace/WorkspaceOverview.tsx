import { Link } from 'react-router';
import { currentAgreement, projectActivity, workspaceMilestones, workspaceSiteUpdates } from '@/domain/workspace/selectors';
import { partyName } from '@/domain/messages/selectors';
import { StatusBadge } from '@/components/ui/Badge';
import { Facts, Notice, SectionHeading } from '@/components/ui/Feedback';
import { QuoteBreakdown } from '@/components/domain/QuoteBreakdown';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { useWorkspace } from './context';
import { CompleteProjectPanel } from './CompleteProjectPanel';

export function WorkspaceOverview() {
  const { ws, project, data, role } = useWorkspace();
  const agreement = currentAgreement(ws);
  const milestones = workspaceMilestones(data, ws.id);
  const latest = workspaceSiteUpdates(data, ws.id)[0];
  const activity = projectActivity(data, project.id).slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-10 *:min-w-0 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-10">
        {ws.status === 'cancelled' ? (
          <Notice tone="warn" title="This project was cancelled">
            {project.closedReason ?? ''} The workspace is read-only.
          </Notice>
        ) : null}
        {ws.status === 'completed' ? (
          <Notice tone="info" title={`Completed on ${ws.completedAt ? formatDate(ws.completedAt) : ''}`}>
            The workspace is now a read-only record.{' '}
            {role === 'owner' ? (
              <Link to={`/workspace/${ws.id}/review`} className="font-semibold underline underline-offset-2">
                Review the contractor
              </Link>
            ) : null}
          </Notice>
        ) : null}
        {ws.status === 'active' ? <CompleteProjectPanel /> : null}

        <section aria-labelledby="plan">
          <SectionHeading
            id="plan"
            title="Milestone plan"
            action={
              <Link to={`/workspace/${ws.id}/milestones`} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2">
                Manage milestones
              </Link>
            }
          />
          <ol className="mt-3 divide-y divide-line border-y border-line">
            {milestones.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                <span className="min-w-0">
                  <span className="block font-medium">
                    {m.order}. {m.title}
                  </span>
                  <span className="block text-sm text-ink-3">
                    Target {formatDate(m.targetDate)} · {m.sharePercent}% · {formatMoney(Math.round((agreement.totalPaise * m.sharePercent) / 100))} agreed value
                  </span>
                </span>
                <StatusBadge kind="milestone" status={m.status} />
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="agreed">
          <SectionHeading id="agreed" title={`Agreed quote (revision ${ws.acceptedQuoteRevision})`} />
          <div className="mt-4">
            <QuoteBreakdown content={ws.acceptedContent} />
          </div>
        </section>
      </div>

      <aside className="space-y-8" aria-label="Agreement and recent activity">
        <section aria-labelledby="agreement" className="border border-line bg-surface p-4">
          <h2 id="agreement" className="font-semibold">
            Agreement
          </h2>
          <Facts
            columns={1}
            className="mt-3"
            items={[
              { label: 'Owner', value: partyName(data, ws.ownerId) },
              { label: 'Contractor', value: partyName(data, ws.contractorId) },
              { label: 'Agreed total', value: <span className="font-mono tabular">{formatMoney(agreement.totalPaise)}</span> },
              { label: 'Schedule', value: `${formatDate(agreement.startDate)} – ${formatDate(agreement.endDate)}` },
              { label: 'Agreement revision', value: `${agreement.revision} · ${agreement.note}` },
            ]}
          />
          {ws.agreement.length > 1 ? (
            <details className="mt-3 text-sm">
              <summary className="min-h-11 cursor-pointer py-2 font-semibold">Agreement history ({ws.agreement.length})</summary>
              <ol className="space-y-2">
                {ws.agreement.map((a) => (
                  <li key={a.revision} className="border-l-2 border-line-strong pl-3">
                    <p>
                      Rev {a.revision}: {formatMoney(a.totalPaise)}, ends {formatDate(a.endDate)}
                    </p>
                    <p className="text-xs text-ink-3">
                      {a.note} · {formatDateTime(a.at)}
                    </p>
                  </li>
                ))}
              </ol>
            </details>
          ) : null}
        </section>

        <section aria-labelledby="latest-update">
          <SectionHeading id="latest-update" title="Latest site update" />
          {latest ? (
            <div className="mt-3 border-l-2 border-line-strong pl-3 text-sm">
              <p className="text-xs text-ink-3">
                {formatDate(latest.date)} · {partyName(data, latest.authorId)} · {latest.progressPercent}% contractor-reported
              </p>
              <p className="mt-1">{latest.notes}</p>
              <Link to={`/workspace/${ws.id}/updates`} className="mt-1 inline-flex min-h-9 items-center font-semibold underline underline-offset-2">
                All updates
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-3">No site updates yet.</p>
          )}
        </section>

        <section aria-labelledby="recent-activity">
          <SectionHeading id="recent-activity" title="Recent activity" />
          <ol className="mt-3 space-y-3 border-l border-line-strong pl-4">
            {activity.map((a) => (
              <li key={a.id} className="text-sm">
                <p>{a.summary}</p>
                <p className="text-xs text-ink-3">
                  {partyName(data, a.actorId)} · {formatDateTime(a.at)}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
