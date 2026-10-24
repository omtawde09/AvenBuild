import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { FileStack } from 'lucide-react';
import { useActorId, useData, todayISO } from '@/app/store/demoStore';
import { ownerVisibleQuotes } from '@/domain/projects/selectors';
import { effectiveQuoteStatus } from '@/domain/quotes/status';
import { quoteTotal } from '@/domain/quotes/math';
import { partyName } from '@/domain/messages/selectors';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { RecordNotFound } from '@/features/public/NotFoundPage';
import { formatDate, formatMoney } from '@/lib/format';
import { ContractorEvidence } from './ContractorEvidence';

export function ReceivedQuotesPage() {
  const { projectId = '' } = useParams();
  const data = useData();
  const me = useActorId();
  const navigate = useNavigate();
  const today = todayISO();
  const project = data.projects[projectId];
  const quotes = useMemo(() => (project ? ownerVisibleQuotes(data, project.id) : []), [data, project]);
  const [selected, setSelected] = useState<string[]>(() => quotes.filter((q) => q.status !== 'withdrawn').slice(0, 3).map((q) => q.id));

  if (!project || project.ownerId !== me) return <RecordNotFound what="project" backTo="/owner/projects" backLabel="Back to my projects" />;

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id]));

  return (
    <>
      <PageHeader
        title="Received quotes"
        crumbs={[{ label: 'Projects', to: '/owner/projects' }, { label: project.title, to: `/owner/projects/${project.id}` }, { label: 'Quotes' }]}
        meta={<span>{project.title}</span>}
        actions={
          quotes.length >= 2 ? (
            <Button
              icon={<FileStack aria-hidden className="size-4" />}
              disabled={selected.length < 2}
              onClick={() => navigate(`/owner/projects/${project.id}/compare?ids=${selected.join(',')}`)}
              aria-describedby="compare-help"
            >
              Compare selected ({selected.length})
            </Button>
          ) : null
        }
      />
      {quotes.length >= 2 ? (
        <p id="compare-help" className="-mt-3 mb-4 text-sm text-ink-3">
          Select 2–4 quotes to compare them side by side.
        </p>
      ) : null}
      {quotes.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {quotes.map((q) => {
            const total = quoteTotal(q.content);
            const status = effectiveQuoteStatus(q, today);
            return (
              <li key={q.id} className="grid gap-4 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-start">
                {quotes.length >= 2 ? (
                  <label className="flex min-h-11 items-center gap-2 text-sm sm:min-h-0 sm:pt-1">
                    <input type="checkbox" className="size-5 accent-brick" checked={selected.includes(q.id)} onChange={() => toggle(q.id)} disabled={!selected.includes(q.id) && selected.length >= 4} />
                    <span className="sm:sr-only">Compare quote from {partyName(data, q.contractorId)}</span>
                  </label>
                ) : (
                  <span className="hidden sm:block" />
                )}
                <div className="min-w-0 space-y-2">
                  <ContractorEvidence state={data} contractorId={q.contractorId} compact />
                  <p className="text-sm text-ink-3">
                    Revision {q.revision} · sent {q.submittedAt ? formatDate(q.submittedAt) : '—'} · {q.content.durationDays} days · valid to {formatDate(q.content.validUntil)}
                  </p>
                </div>
                <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <span className="font-mono text-lg font-semibold tabular">{total !== null ? formatMoney(total) : '—'}</span>
                  <StatusBadge kind="quote" status={status} />
                  <Link to={`/owner/projects/${project.id}/quotes/${q.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2">
                    View quote
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title="No quotes yet" action={<ButtonLink to={`/owner/projects/${project.id}`} variant="secondary">Back to project</ButtonLink>}>
          {project.status === 'draft' ? 'Publish the project so contractors can quote.' : 'Quotes appear here as contractors respond. You’ll get a notification for each one.'}
        </EmptyState>
      )}
    </>
  );
}
