import { useState } from 'react';
import { Check, FilePlus2, Undo2, X } from 'lucide-react';
import { useCommand } from '@/app/store/useCommand';
import type { ChangeRequestId, WorkspaceId } from '@/domain/ids';
import type { ChangeRequest } from '@/domain/types';
import { parseRupeesToPaise } from '@/domain/money';
import { proposeChange, resolveChange } from '@/domain/workspace/commands';
import { currentAgreement, workspaceChangeRequests } from '@/domain/workspace/selectors';
import { partyName } from '@/domain/messages/selectors';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog';
import { FieldError, TextArea, TextField } from '@/components/ui/Field';
import { EmptyState, Notice, SectionHeading } from '@/components/ui/Feedback';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { useWorkspace } from './context';

const empty = { reason: '', scopeNote: '', newTotal: '', newEndDate: '' };

/** Scope, date and price changes go through an explicit proposal; nothing silently edits the agreement. */
export function ChangesTab() {
  const { ws, data, me } = useWorkspace();
  const command = useCommand();
  const requests = workspaceChangeRequests(data, ws.id);
  const agreement = currentAgreement(ws);
  const open = requests.find((r) => r.status === 'proposed');
  const active = ws.status === 'active';
  const [proposing, setProposing] = useState(false);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deciding, setDeciding] = useState<{ cr: ChangeRequest; decision: 'accept' | 'reject' | 'withdraw' } | null>(null);
  const [note, setNote] = useState('');

  const submit = () => {
    const total = form.newTotal.trim() ? parseRupeesToPaise(form.newTotal) : null;
    if (form.newTotal.trim() && total === null) {
      setErrors({ newTotalPaise: 'Enter the new total in rupees, e.g. 104500.' });
      return;
    }
    const r = command(
      (s, c) => proposeChange(s, ws.id as WorkspaceId, { reason: form.reason, scopeNote: form.scopeNote, newTotalPaise: total, newEndDate: form.newEndDate || null }, c),
      { success: 'Change request sent.', quietValidation: true },
    );
    if (r.ok) {
      setProposing(false);
      setForm(empty);
      setErrors({});
    } else if (r.error.fieldErrors) setErrors(r.error.fieldErrors);
  };

  const decide = () => {
    if (!deciding) return;
    const { cr, decision } = deciding;
    const r = command((s, c) => resolveChange(s, cr.id as ChangeRequestId, decision, note, c), {
      success: decision === 'accept' ? 'Change accepted. The agreement has a new revision.' : decision === 'reject' ? 'Change rejected.' : 'Change request withdrawn.',
      quietValidation: true,
    });
    if (r.ok) {
      setDeciding(null);
      setNote('');
      setErrors({});
    } else if (r.error.fieldErrors) setErrors(r.error.fieldErrors);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-xl text-sm text-ink-2">
          The accepted quote is never edited. Agreed changes to scope, end date or price create a new agreement revision, visible to both parties in the activity log. Current agreement: revision {agreement.revision}, {formatMoney(agreement.totalPaise)}, ends {formatDate(agreement.endDate)}.
        </p>
        {active ? (
          <Button icon={<FilePlus2 aria-hidden className="size-4" />} disabled={Boolean(open)} onClick={() => setProposing(true)} aria-describedby={open ? 'cr-open' : undefined}>
            Propose a change
          </Button>
        ) : null}
      </div>
      {open && active ? (
        <p id="cr-open" className="text-sm text-ink-3">
          Only one change request can be open at a time, so the agreement is never ambiguous.
        </p>
      ) : null}

      <section aria-labelledby="cr-list">
        <SectionHeading id="cr-list" title={`Change requests (${requests.length})`} />
        {requests.length ? (
          <ul className="mt-3 space-y-3">
            {requests.map((cr) => {
              const mine = cr.proposedBy === me;
              return (
                <li key={cr.id} className="border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{cr.reason}</p>
                      <p className="text-xs text-ink-3">
                        Proposed by {mine ? 'you' : partyName(data, cr.proposedBy)} · {formatDateTime(cr.createdAt)} · {cr.kinds.join(', ')}
                      </p>
                    </div>
                    <StatusBadge kind="change" status={cr.status} />
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    {cr.scopeNote ? (
                      <div className="sm:col-span-3">
                        <dt className="text-xs font-semibold text-ink-3 uppercase">Scope</dt>
                        <dd>{cr.scopeNote}</dd>
                      </div>
                    ) : null}
                    {cr.newTotalPaise !== null ? (
                      <div>
                        <dt className="text-xs font-semibold text-ink-3 uppercase">New total</dt>
                        <dd className="font-mono tabular">{formatMoney(cr.newTotalPaise)}</dd>
                      </div>
                    ) : null}
                    {cr.newEndDate ? (
                      <div>
                        <dt className="text-xs font-semibold text-ink-3 uppercase">New end date</dt>
                        <dd>{formatDate(cr.newEndDate)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {cr.responseNote ? <p className="mt-2 border-l-2 border-line-strong pl-3 text-sm">Response: {cr.responseNote}</p> : null}
                  {cr.status === 'proposed' && active ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {mine ? (
                        <>
                          <p className="mr-auto text-sm text-ink-3">Waiting for the other party.</p>
                          <Button size="sm" variant="ghost" icon={<Undo2 aria-hidden className="size-4" />} onClick={() => setDeciding({ cr, decision: 'withdraw' })}>
                            Withdraw
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="accent" icon={<Check aria-hidden className="size-4" />} onClick={() => setDeciding({ cr, decision: 'accept' })}>
                            Accept change
                          </Button>
                          <Button size="sm" variant="secondary" icon={<X aria-hidden className="size-4" />} onClick={() => setDeciding({ cr, decision: 'reject' })}>
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState className="mt-3" title="No change requests">
            If the scope, end date or price needs to change, propose it here so both sides agree in writing.
          </EmptyState>
        )}
      </section>

      <Dialog
        open={proposing}
        onClose={() => setProposing(false)}
        title="Propose a change"
        description="Fill in only what changes. The other party must accept before the agreement updates."
        footer={
          <>
            <Button variant="secondary" onClick={() => setProposing(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Send proposal</Button>
          </>
        }
      >
        <div className="grid gap-4">
          {errors._form ? <FieldError>{errors._form}</FieldError> : null}
          <TextArea label="Reason" required rows={3} value={form.reason} error={errors.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <TextArea label="Scope change" optional rows={3} value={form.scopeNote} error={errors.scopeNote} onChange={(e) => setForm({ ...form, scopeNote: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="New agreed total (₹)" optional prefix="₹" inputMode="decimal" description={`Currently ${formatMoney(agreement.totalPaise)}`} value={form.newTotal} error={errors.newTotalPaise} onChange={(e) => setForm({ ...form, newTotal: e.target.value })} />
            <TextField type="date" label="New end date" optional description={`Currently ${formatDate(agreement.endDate)}`} value={form.newEndDate} error={errors.newEndDate} onChange={(e) => setForm({ ...form, newEndDate: e.target.value })} />
          </div>
          <Notice tone="info">Price changes are recorded for planning only. No payment is processed in this demo.</Notice>
        </div>
      </Dialog>
      <ConfirmDialog
        open={Boolean(deciding)}
        title={deciding?.decision === 'accept' ? 'Accept this change?' : deciding?.decision === 'reject' ? 'Reject this change?' : 'Withdraw your change request?'}
        body={deciding?.decision === 'accept' ? 'The agreement will move to a new revision with these terms. The original quote stays on record.' : deciding?.decision === 'reject' ? 'The current agreement stays as it is.' : 'The request will be marked as withdrawn.'}
        confirmLabel={deciding?.decision === 'accept' ? 'Accept change' : deciding?.decision === 'reject' ? 'Reject change' : 'Withdraw request'}
        tone={deciding?.decision === 'accept' ? 'accent' : 'danger'}
        onCancel={() => {
          setDeciding(null);
          setNote('');
          setErrors({});
        }}
        onConfirm={decide}
      >
        {deciding?.decision !== 'withdraw' ? (
          <TextArea label={deciding?.decision === 'reject' ? 'Reason' : 'Note'} required={deciding?.decision === 'reject'} optional={deciding?.decision === 'accept'} rows={3} value={note} error={errors.note} onChange={(e) => setNote(e.target.value)} />
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
