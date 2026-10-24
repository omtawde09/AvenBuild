import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Check, MessageSquare, RotateCcw, X } from 'lucide-react';
import { useActorId, useData, todayISO } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import type { QuoteId, UserId } from '@/domain/ids';
import { acceptQuote, declineQuote, markQuoteViewed, requestRevision } from '@/domain/quotes/commands';
import { canQuote } from '@/domain/quotes/machine';
import { canProject } from '@/domain/projects/machine';
import { effectiveQuoteStatus, isExpired } from '@/domain/quotes/status';
import { quoteTotal } from '@/domain/quotes/math';
import { ensureConversation } from '@/domain/messages/commands';
import { partyName } from '@/domain/messages/selectors';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Notice, SectionHeading } from '@/components/ui/Feedback';
import { TextArea } from '@/components/ui/Field';
import { QuoteBreakdown } from '@/components/domain/QuoteBreakdown';
import { RecordNotFound } from '@/features/public/NotFoundPage';
import { formatDate, formatDateTime, formatMoney, formatMoneyExact } from '@/lib/format';
import { ContractorEvidence } from './ContractorEvidence';

type Dialog = 'accept' | 'decline' | 'revision' | null;

export function OwnerQuotePage() {
  const { projectId = '', quoteId = '' } = useParams();
  const data = useData();
  const me = useActorId();
  const command = useCommand();
  const navigate = useNavigate();
  const today = todayISO();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [openRevision, setOpenRevision] = useState<number | null>(null);

  const project = data.projects[projectId];
  const quote = data.quotes[quoteId];
  const visible = project && quote && project.ownerId === me && quote.projectId === project.id && quote.status !== 'draft';

  // Opening a submitted quote marks it as viewed (silent, idempotent).
  useEffect(() => {
    if (visible && quote.status === 'submitted') command((s, c) => markQuoteViewed(s, quote.id as QuoteId, c));
  }, [visible, quote?.status, quote?.id, command]);

  if (!visible) return <RecordNotFound what="quote" backTo={project ? `/owner/projects/${project.id}/quotes` : '/owner/projects'} backLabel="Back to quotes" />;

  const qid = quote.id as QuoteId;
  const status = effectiveQuoteStatus(quote, today);
  const total = quoteTotal(quote.content);
  const name = partyName(data, quote.contractorId);
  const projectOpen = canProject(project, 'accept_quotes');
  const acceptCheck = !projectOpen.ok ? projectOpen : isExpired(quote, today) ? { ok: false as const, reason: 'This quote has expired. Ask for a revision with a new validity date.' } : canQuote(quote, 'accept');
  const revisionCheck = !projectOpen.ok ? projectOpen : canQuote(quote, 'request_revision');
  const declineCheck = canQuote(quote, 'decline');
  const otherLive = Object.values(data.quotes).filter((q) => q.projectId === project.id && q.id !== quote.id && ['submitted', 'viewed', 'revision_requested'].includes(q.status));

  const closeDialog = () => {
    setDialog(null);
    setText('');
    setError(undefined);
  };

  const message = () => {
    const r = command((s, c) => ensureConversation(s, project.id, quote.contractorId as UserId, c));
    if (r.ok) navigate(`/messages/${r.value}`);
  };

  const reasonText = (check: { ok: boolean; reason?: string }) => (!check.ok && 'reason' in check ? check.reason : undefined);

  return (
    <>
      <PageHeader
        title={`Quote from ${name}`}
        crumbs={[{ label: 'Projects', to: '/owner/projects' }, { label: project.title, to: `/owner/projects/${project.id}` }, { label: 'Quotes', to: `/owner/projects/${project.id}/quotes` }, { label: name }]}
        meta={
          <>
            <StatusBadge kind="quote" status={status} />
            <span>Revision {quote.revision}</span>
            {quote.submittedAt ? <span>Sent {formatDateTime(quote.submittedAt)}</span> : null}
            <span className="font-mono font-semibold text-ink tabular">{total !== null ? formatMoneyExact(total) : '—'}</span>
          </>
        }
        actions={
          <Button variant="secondary" icon={<MessageSquare aria-hidden className="size-4" />} onClick={message}>
            Message
          </Button>
        }
      />

      {quote.status === 'revision_requested' && quote.revisionRequest ? (
        <Notice tone="warn" className="mb-6" title={`You asked for a revision on ${formatDate(quote.revisionRequest.at)}`}>
          “{quote.revisionRequest.message}” — waiting for {name} to send a revised quote.
        </Notice>
      ) : null}
      {quote.status === 'declined' ? (
        <Notice tone="info" className="mb-6" title="Declined">
          {quote.declineReason === 'awarded_elsewhere' ? 'You accepted another quote for this project.' : quote.declineReason === 'project_closed' ? 'The project was closed.' : `You declined this quote${quote.declineNote ? `: “${quote.declineNote}”` : '.'}`}
        </Notice>
      ) : null}
      {quote.status === 'withdrawn' ? (
        <Notice tone="info" className="mb-6" title="Withdrawn by the contractor">
          {name} withdrew this quote{quote.withdrawnAt ? ` on ${formatDate(quote.withdrawnAt)}` : ''}. It can’t be accepted unless they resubmit.
        </Notice>
      ) : null}
      {status === 'expired' ? (
        <Notice tone="warn" className="mb-6" title="This quote has expired">
          The price was valid until {formatDate(quote.content.validUntil)}. Ask for a revision to get an updated validity date.
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-10 *:min-w-0 lg:grid-cols-[1fr_18rem]">
        <section aria-labelledby="breakdown" className="min-w-0">
          <h2 id="breakdown" className="sr-only">
            Quote breakdown
          </h2>
          <QuoteBreakdown content={quote.content} />

          {quote.history.length ? (
            <section aria-labelledby="history" className="mt-10">
              <SectionHeading id="history" title="Earlier revisions" description="Previous versions stay on record; the current version is shown above." />
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {[...quote.history].reverse().map((h) => {
                  const t = quoteTotal(h.content);
                  const open = openRevision === h.revision;
                  return (
                    <li key={h.revision} className="py-2">
                      <button type="button" aria-expanded={open} onClick={() => setOpenRevision(open ? null : h.revision)} className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm">
                        <span>
                          Revision {h.revision} · sent {formatDate(h.submittedAt)}
                        </span>
                        <span className="font-mono tabular">{t !== null ? formatMoney(t) : '—'}</span>
                      </button>
                      {open ? (
                        <div className="pt-2 pb-4">
                          <QuoteBreakdown content={h.content} />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </section>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start" aria-label="Decision">
          <div className="border border-line bg-surface p-4">
            <h2 className="font-semibold">Your decision</h2>
            <div className="mt-3 grid gap-2">
              <Button variant="accent" icon={<Check aria-hidden className="size-4" />} disabled={!acceptCheck.ok} aria-describedby={!acceptCheck.ok ? 'accept-why' : undefined} onClick={() => setDialog('accept')}>
                Accept quote
              </Button>
              {!acceptCheck.ok ? (
                <p id="accept-why" className="text-xs text-ink-3">
                  {reasonText(acceptCheck)}
                </p>
              ) : null}
              <Button variant="secondary" icon={<RotateCcw aria-hidden className="size-4" />} disabled={!revisionCheck.ok} onClick={() => setDialog('revision')}>
                Request a revision
              </Button>
              <Button variant="danger" icon={<X aria-hidden className="size-4" />} disabled={!declineCheck.ok} onClick={() => setDialog('decline')}>
                Decline
              </Button>
            </div>
          </div>
          <div className="border-t border-line pt-4">
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">About the contractor</h2>
            <ContractorEvidence state={data} contractorId={quote.contractorId} />
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={dialog === 'accept'}
        title={`Accept ${name}’s quote?`}
        body={
          <>
            <p>
              You’ll agree to {total !== null ? formatMoneyExact(total) : 'this quote'} (revision {quote.revision}). A shared workspace is created for milestones, updates and messages.
            </p>
            {otherLive.length ? (
              <p className="mt-2">
                {otherLive.length} other {otherLive.length === 1 ? 'quote' : 'quotes'} will be declined and those contractors notified.
              </p>
            ) : null}
            <p className="mt-2 text-ink-3">No payment is taken in this demo.</p>
          </>
        }
        confirmLabel="Accept and create workspace"
        tone="accent"
        onCancel={closeDialog}
        onConfirm={() => {
          closeDialog();
          const r = command((s, c) => acceptQuote(s, qid, c), { success: `Quote accepted. ${name} has been notified.` });
          if (r.ok) navigate(`/workspace/${r.value}`);
        }}
      />
      <ConfirmDialog
        open={dialog === 'revision'}
        title="Request a revision"
        body={`${name} will be asked to revise and resubmit. The current version stays on record.`}
        confirmLabel="Send request"
        onCancel={closeDialog}
        onConfirm={() => {
          const r = command((s, c) => requestRevision(s, qid, text, c), { success: 'Revision requested.', quietValidation: true });
          if (r.ok) closeDialog();
          else setError(r.error.fieldErrors?.message ?? r.error.message);
        }}
      >
        <TextArea label="What should change?" required rows={4} value={text} error={error} onChange={(e) => setText(e.target.value)} maxChars={1000} currentLength={text.length} />
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'decline'}
        title="Decline this quote?"
        body={`${name} will be notified. This can’t be undone.`}
        confirmLabel="Decline quote"
        tone="danger"
        onCancel={closeDialog}
        onConfirm={() => {
          const r = command((s, c) => declineQuote(s, qid, text, c), { success: 'Quote declined.' });
          if (r.ok) closeDialog();
        }}
      >
        <TextArea label="Note to the contractor" optional rows={3} value={text} onChange={(e) => setText(e.target.value)} maxChars={500} currentLength={text.length} />
      </ConfirmDialog>
    </>
  );
}
