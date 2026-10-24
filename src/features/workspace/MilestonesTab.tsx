import { useState } from 'react';
import { Check, Pencil, Play, RotateCcw, Send, Undo2 } from 'lucide-react';
import { useCommand } from '@/app/store/useCommand';
import { todayISO } from '@/app/store/demoStore';
import type { MilestoneId } from '@/domain/ids';
import type { Milestone } from '@/domain/types';
import { canMilestone, editMilestone, transitionMilestone } from '@/domain/workspace/commands';
import { currentAgreement, workspaceMilestones } from '@/domain/workspace/selectors';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog';
import { TextArea, TextField } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Feedback';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useWorkspace } from './context';

type Action = { kind: 'submit' | 'request_changes' | 'approve' | 'edit'; milestone: Milestone } | null;

export function MilestonesTab() {
  const { ws, data, role } = useWorkspace();
  const command = useCommand();
  const today = todayISO();
  const milestones = workspaceMilestones(data, ws.id);
  const agreement = currentAgreement(ws);
  const active = ws.status === 'active';
  const [action, setAction] = useState<Action>(null);
  const [note, setNote] = useState('');
  const [edit, setEdit] = useState({ title: '', description: '', targetDate: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const close = () => {
    setAction(null);
    setNote('');
    setErrors({});
  };
  const run = (m: Milestone, a: 'start' | 'submit' | 'approve' | 'request_changes' | 'resume', text: string, success: string) => {
    const r = command((s, c) => transitionMilestone(s, m.id as MilestoneId, a, text, c), { success, quietValidation: true });
    if (r.ok) close();
    else if (r.error.fieldErrors) setErrors(r.error.fieldErrors);
    return r.ok;
  };

  return (
    <div className="max-w-3xl space-y-4">
      {!active ? <Notice tone="info">This workspace is read-only.</Notice> : null}
      <ol className="space-y-3">
        {milestones.map((m) => {
          const overdue = active && m.status !== 'approved' && m.targetDate < today;
          const can = (a: Parameters<typeof canMilestone>[1]) => active && canMilestone(m, a, role).ok;
          return (
            <li key={m.id} className={cn('border bg-surface p-4', m.status === 'submitted' && role === 'owner' ? 'border-brick' : 'border-line')}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold">
                    {m.order}. {m.title}
                  </h3>
                  <p className={cn('text-sm', overdue ? 'text-bad' : 'text-ink-3')}>
                    {overdue ? 'Overdue — target was ' : 'Target '}
                    {formatDate(m.targetDate)} · {m.sharePercent}% · {formatMoney(Math.round((agreement.totalPaise * m.sharePercent) / 100))}
                  </p>
                </div>
                <StatusBadge kind="milestone" status={m.status} />
              </div>
              {m.description ? <p className="mt-2 text-sm">{m.description}</p> : null}
              {m.evidenceNote && (m.status === 'submitted' || m.status === 'approved' || m.status === 'changes_requested') ? (
                <div className="mt-3 border-l-2 border-line-strong pl-3 text-sm">
                  <p className="text-xs font-semibold text-ink-3 uppercase">Contractor’s note{m.submittedAt ? ` · ${formatDateTime(m.submittedAt)}` : ''}</p>
                  <p>{m.evidenceNote}</p>
                </div>
              ) : null}
              {m.status === 'changes_requested' && m.changeRequestNote ? (
                <div className="mt-3 border-l-2 border-warn pl-3 text-sm">
                  <p className="text-xs font-semibold text-warn uppercase">Owner asked for changes</p>
                  <p>{m.changeRequestNote}</p>
                </div>
              ) : null}
              {m.approvedAt ? <p className="mt-2 text-xs text-ok">Approved {formatDateTime(m.approvedAt)}</p> : null}

              {active ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {role === 'contractor' ? (
                    <>
                      {can('start') ? (
                        <Button size="sm" icon={<Play aria-hidden className="size-4" />} onClick={() => run(m, 'start', '', `Started “${m.title}”.`)}>
                          Start milestone
                        </Button>
                      ) : null}
                      {can('edit') ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Pencil aria-hidden className="size-4" />}
                          onClick={() => {
                            setEdit({ title: m.title, description: m.description, targetDate: m.targetDate });
                            setAction({ kind: 'edit', milestone: m });
                          }}
                        >
                          Edit
                        </Button>
                      ) : null}
                      {can('submit') ? (
                        <Button size="sm" variant="accent" icon={<Send aria-hidden className="size-4" />} onClick={() => setAction({ kind: 'submit', milestone: m })}>
                          Submit for approval
                        </Button>
                      ) : null}
                      {can('resume') ? (
                        <Button size="sm" icon={<RotateCcw aria-hidden className="size-4" />} onClick={() => run(m, 'resume', '', `Back to work on “${m.title}”.`)}>
                          Resume work
                        </Button>
                      ) : null}
                      {m.status === 'submitted' ? <p className="text-sm text-ink-3">Waiting for the owner to review.</p> : null}
                    </>
                  ) : (
                    <>
                      {can('approve') ? (
                        <Button size="sm" variant="accent" icon={<Check aria-hidden className="size-4" />} onClick={() => setAction({ kind: 'approve', milestone: m })}>
                          Approve
                        </Button>
                      ) : null}
                      {can('request_changes') ? (
                        <Button size="sm" variant="secondary" icon={<Undo2 aria-hidden className="size-4" />} onClick={() => setAction({ kind: 'request_changes', milestone: m })}>
                          Request changes
                        </Button>
                      ) : null}
                      {m.status === 'pending' || m.status === 'in_progress' || m.status === 'changes_requested' ? (
                        <p className="text-sm text-ink-3">{m.status === 'pending' ? 'Not started yet.' : 'The contractor is working on this.'} You’ll be notified when it’s submitted.</p>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <ConfirmDialog
        open={action?.kind === 'submit'}
        title={`Submit “${action?.milestone.title ?? ''}” for approval?`}
        body="Describe what was completed so the owner knows what to check."
        confirmLabel="Submit milestone"
        tone="accent"
        onCancel={close}
        onConfirm={() => action && run(action.milestone, 'submit', note, 'Milestone submitted. The owner has been notified.')}
      >
        <TextArea label="What was done?" required rows={4} value={note} error={errors.note} onChange={(e) => setNote(e.target.value)} maxChars={1000} currentLength={note.length} />
      </ConfirmDialog>
      <ConfirmDialog
        open={action?.kind === 'request_changes'}
        title="Request changes"
        body="The milestone goes back to the contractor with your note."
        confirmLabel="Send request"
        onCancel={close}
        onConfirm={() => action && run(action.milestone, 'request_changes', note, 'Changes requested. The contractor has been notified.')}
      >
        <TextArea label="What needs to change?" required rows={4} value={note} error={errors.note} onChange={(e) => setNote(e.target.value)} maxChars={1000} currentLength={note.length} />
      </ConfirmDialog>
      <ConfirmDialog
        open={action?.kind === 'approve'}
        title={`Approve “${action?.milestone.title ?? ''}”?`}
        body="Approving confirms you’re satisfied with this stage. It can’t be undone."
        confirmLabel="Approve milestone"
        tone="accent"
        onCancel={close}
        onConfirm={() => action && run(action.milestone, 'approve', '', 'Milestone approved.')}
      />
      <Dialog
        open={action?.kind === 'edit'}
        onClose={close}
        title="Edit milestone"
        
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!action) return;
                const r = command((s, c) => editMilestone(s, action.milestone.id as MilestoneId, edit, c), { success: 'Milestone updated.', quietValidation: true });
                if (r.ok) close();
                else if (r.error.fieldErrors) setErrors(r.error.fieldErrors);
              }}
            >
              Save milestone
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <TextField label="Title" required value={edit.title} error={errors.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
          <TextArea label="Description" optional rows={3} value={edit.description} error={errors.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
          <TextField type="date" label="Target date" required min={today} value={edit.targetDate} error={errors.targetDate} onChange={(e) => setEdit({ ...edit, targetDate: e.target.value })} />
        </div>
      </Dialog>
    </div>
  );
}
