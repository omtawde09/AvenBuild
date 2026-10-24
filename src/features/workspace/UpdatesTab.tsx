import { useState } from 'react';
import { Send } from 'lucide-react';
import { useCommand } from '@/app/store/useCommand';
import { todayISO } from '@/app/store/demoStore';
import type { WorkspaceId } from '@/domain/ids';
import type { AttachmentMeta } from '@/domain/types';
import { postSiteUpdate } from '@/domain/workspace/commands';
import { latestReportedProgress, workspaceMilestones, workspaceProgress, workspaceSiteUpdates } from '@/domain/workspace/selectors';
import { partyName } from '@/domain/messages/selectors';
import { Button } from '@/components/ui/Button';
import { TextArea, TextField } from '@/components/ui/Field';
import { EmptyState, Notice, ProgressBar, SectionHeading } from '@/components/ui/Feedback';
import { AttachmentList, AttachmentThumb, FilePicker } from '@/components/domain/Attachments';
import { formatDate, formatDateTime } from '@/lib/format';
import { useWorkspace } from './context';

export function UpdatesTab() {
  const { ws, data, role } = useWorkspace();
  const command = useCommand();
  const today = todayISO();
  const updates = workspaceSiteUpdates(data, ws.id);
  const reported = latestReportedProgress(updates);
  const agreed = workspaceProgress(workspaceMilestones(data, ws.id));
  const [form, setForm] = useState({ date: today, notes: '', progress: String(reported ?? 0) });
  const [files, setFiles] = useState<AttachmentMeta[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const canPost = role === 'contractor' && ws.status === 'active';

  const post = () => {
    const progress = /^\d{1,3}$/.test(form.progress.trim()) ? Number(form.progress) : NaN;
    const r = command((s, c) => postSiteUpdate(s, ws.id as WorkspaceId, { date: form.date, notes: form.notes, progressPercent: progress, attachments: files }, c), {
      success: 'Site update posted. The owner has been notified.',
      quietValidation: true,
    });
    if (r.ok) {
      setForm({ date: today, notes: '', progress: form.progress });
      setFiles([]);
      setErrors({});
    } else if (r.error.fieldErrors) setErrors(r.error.fieldErrors);
  };

  return (
    <div className="grid grid-cols-1 gap-10 *:min-w-0 lg:grid-cols-[1.3fr_1fr]">
      <section aria-labelledby="updates-list">
        <SectionHeading id="updates-list" title="Site updates" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-ink-3 uppercase">Agreed progress (from milestones)</p>
            <ProgressBar value={agreed} label="Agreed progress" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-3 uppercase">Contractor-reported (latest update)</p>
            {reported !== null ? <ProgressBar value={reported} label="Contractor-reported progress" /> : <p className="text-sm text-ink-3">No updates yet</p>}
          </div>
        </div>
        {updates.length ? (
          <ol className="mt-6 space-y-6 border-l border-line-strong pl-5">
            {updates.map((u) => (
              <li key={u.id} className="relative">
                <span aria-hidden className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full bg-ink" />
                <p className="text-sm font-semibold">{formatDate(u.date)}</p>
                <p className="text-xs text-ink-3">
                  {partyName(data, u.authorId)} · {u.progressPercent}% reported · posted {formatDateTime(u.createdAt)}
                </p>
                <p className="mt-1.5 whitespace-pre-line">{u.notes}</p>
                {u.attachments.length ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {u.attachments.map((a) => (
                      <li key={a.id}>
                        <AttachmentThumb file={a} className="size-24" />
                        <span className="sr-only">{a.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState className="mt-6" title="No site updates yet">
            {role === 'contractor' ? 'Post a short dated note whenever work moves forward.' : 'The contractor’s dated progress notes will appear here.'}
          </EmptyState>
        )}
      </section>

      {canPost ? (
        <section aria-labelledby="post-update" className="h-fit border border-line bg-surface p-4">
          <h2 id="post-update" className="font-semibold">
            Post a site update
          </h2>
          <form
            noValidate
            className="mt-3 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              post();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField type="date" label="Date" required max={today} value={form.date} error={errors.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <TextField label="Your progress estimate (%)" required inputMode="numeric" suffix="%" value={form.progress} error={errors.progressPercent} onChange={(e) => setForm({ ...form, progress: e.target.value })} />
            </div>
            <TextArea label="What happened on site?" required rows={4} value={form.notes} error={errors.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxChars={1500} currentLength={form.notes.length} />
            <div>
              <FilePicker label="Add photos" imagesOnly max={6} current={files.length} onAdd={(added) => setFiles([...files, ...added])} />
              <AttachmentList className="mt-2" files={files} empty="" onRemove={(f) => setFiles(files.filter((x) => x.id !== f.id))} />
            </div>
            <Button type="submit" icon={<Send aria-hidden className="size-4" />}>
              Post update
            </Button>
          </form>
        </section>
      ) : role === 'owner' && ws.status === 'active' ? (
        <aside>
          <Notice tone="info" title="Updates come from the contractor">
            Your “agreed progress” moves only when you approve milestones. The contractor’s own estimate is shown separately so the two are never confused.
          </Notice>
        </aside>
      ) : null}
    </div>
  );
}
