import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { HardHat, MessageSquare, Pencil, Undo2 } from 'lucide-react';
import { useActorId, useData, todayISO } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import type { QuoteId, UserId } from '@/domain/ids';
import { withdrawQuote } from '@/domain/quotes/commands';
import { canQuote } from '@/domain/quotes/machine';
import { effectiveQuoteStatus } from '@/domain/quotes/status';
import { quoteTotal } from '@/domain/quotes/math';
import { isOpenForQuotes } from '@/domain/matching/match';
import { ensureConversation } from '@/domain/messages/commands';
import { workspaceForProject } from '@/domain/workspace/selectors';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Notice, SectionHeading } from '@/components/ui/Feedback';
import { QuoteBreakdown } from '@/components/domain/QuoteBreakdown';
import { RecordNotFound } from '@/features/public/NotFoundPage';
import { formatDate, formatDateTime, formatMoney, formatMoneyExact } from '@/lib/format';

export function ContractorQuotePage() {
  const { quoteId = '' } = useParams();
  const data = useData();
  const me = useActorId();
  const today = todayISO();
  const command = useCommand();
  const navigate = useNavigate();
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const quote = data.quotes[quoteId];
  const project = quote ? data.projects[quote.projectId] : undefined;
  if (!quote || !project || quote.contractorId !== me) return <RecordNotFound what="quote" backTo="/contractor/quotes" backLabel="Back to pipeline" />;

  const qid = quote.id as QuoteId;
  const status = effectiveQuoteStatus(quote, today);
  const total = quoteTotal(quote.content);
  const ws = workspaceForProject(data, project.id);
  const canWithdraw = canQuote(quote, 'withdraw');
  const canRevise = canQuote(quote, 'revise').ok && isOpenForQuotes(project);

  const events: Array<[string, string | null]> = [
    ['Draft started', quote.createdAt],
    [`Submitted (revision ${quote.revision})`, quote.submittedAt],
    ['Viewed by owner', quote.viewedAt],
    ['Revision requested', quote.revisionRequest?.at ?? null],
    ['Withdrawn', quote.withdrawnAt],
    [quote.status === 'accepted' ? 'Accepted' : quote.status === 'declined' ? 'Declined' : 'Decided', quote.decidedAt],
  ];
  const timeline = events.filter((e): e is [string, string] => Boolean(e[1])).sort((a, b) => a[1].localeCompare(b[1]));

  const message = () => {
    const r = command((s, c) => ensureConversation(s, project.id, me as UserId, c));
    if (r.ok) navigate(`/messages/${r.value}`);
  };

  return (
    <>
      <PageHeader
        title={project.title}
        crumbs={[{ label: 'Quotes', to: '/contractor/quotes' }, { label: project.title }]}
        meta={
          <>
            <StatusBadge kind="quote" status={status} />
            <span>Revision {quote.revision}</span>
            <span className="font-mono font-semibold text-ink tabular">{total !== null ? formatMoneyExact(total) : '—'}</span>
          </>
        }
        actions={
          <>
            {ws && quote.status === 'accepted' ? (
              <ButtonLink to={`/workspace/${ws.id}`} icon={<HardHat aria-hidden className="size-4" />}>
                Open workspace
              </ButtonLink>
            ) : null}
            <Button variant="secondary" icon={<MessageSquare aria-hidden className="size-4" />} onClick={message}>
              Message owner
            </Button>
            {canRevise ? (
              <ButtonLink to={`/contractor/leads/${project.id}/quote`} icon={<Pencil aria-hidden className="size-4" />}>
                {quote.status === 'withdrawn' ? 'Revise and resubmit' : 'Revise quote'}
              </ButtonLink>
            ) : null}
            {canWithdraw.ok ? (
              <Button variant="danger" icon={<Undo2 aria-hidden className="size-4" />} onClick={() => setConfirmWithdraw(true)}>
                Withdraw
              </Button>
            ) : null}
          </>
        }
      />
      {quote.status === 'revision_requested' && quote.revisionRequest ? (
        <Notice tone="warn" className="mb-6" title="The owner asked for a revision">
          “{quote.revisionRequest.message}”
        </Notice>
      ) : null}
      {quote.pendingContent ? (
        <Notice tone="info" className="mb-6" title="You have unsent changes">
          The owner still sees the version below until you send your revision.
        </Notice>
      ) : null}
      {quote.status === 'declined' ? (
        <Notice tone="info" className="mb-6" title={quote.declineReason === 'owner' ? 'The owner declined this quote' : 'This project is no longer open'}>
          {quote.declineReason === 'owner' ? (quote.declineNote ? `Their note: “${quote.declineNote}”` : 'No note was added.') : quote.declineReason === 'awarded_elsewhere' ? 'The owner accepted another contractor’s quote.' : 'The owner closed or cancelled the project.'}
        </Notice>
      ) : null}
      {status === 'expired' ? (
        <Notice tone="warn" className="mb-6" title="Your price has expired">
          It was valid until {formatDate(quote.content.validUntil)}. The owner can’t accept it unless they ask for a revision. You can also withdraw and resubmit with a new date.
        </Notice>
      ) : null}
      <div className="grid gap-10 lg:grid-cols-[1fr_16rem]">
        <QuoteBreakdown content={quote.content} />
        <aside aria-labelledby="timeline">
          <SectionHeading id="timeline" title="Timeline" as="h3" />
          <ol className="mt-3 space-y-3 border-l border-line-strong pl-4">
            {timeline.map(([label, at]) => (
              <li key={label} className="text-sm">
                <p className="font-medium">{label}</p>
                <p className="text-xs text-ink-3">{formatDateTime(at)}</p>
              </li>
            ))}
          </ol>
          {quote.history.length ? (
            <>
              <h3 className="mt-6 text-sm font-semibold">Earlier versions</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {quote.history.map((h) => {
                  const t = quoteTotal(h.content);
                  return (
                    <li key={h.revision} className="flex justify-between gap-2">
                      <span>
                        Rev {h.revision} · {formatDate(h.submittedAt)}
                      </span>
                      <span className="font-mono tabular">{t !== null ? formatMoney(t) : '—'}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </aside>
      </div>
      <ConfirmDialog
        open={confirmWithdraw}
        title="Withdraw this quote?"
        body="The owner will be notified and won’t be able to accept it. You can revise and resubmit later while the project stays open."
        confirmLabel="Withdraw quote"
        tone="danger"
        onCancel={() => setConfirmWithdraw(false)}
        onConfirm={() => {
          setConfirmWithdraw(false);
          command((s, c) => withdrawQuote(s, qid, c), { success: 'Quote withdrawn. The owner has been notified.' });
        }}
      />
    </>
  );
}
