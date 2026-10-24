import { projectActivity } from '@/domain/workspace/selectors';
import { partyName } from '@/domain/messages/selectors';
import { dateOf } from '@/domain/time';
import { EmptyState } from '@/components/ui/Feedback';
import { formatDate, formatTime } from '@/lib/format';
import { useWorkspace } from './context';

/** Append-only event history for the project, grouped by day (newest first). */
export function ActivityTab() {
  const { project, data } = useWorkspace();
  const events = projectActivity(data, project.id);
  if (!events.length) return <EmptyState title="No activity yet" />;
  const groups = new Map<string, typeof events>();
  for (const e of events) {
    const d = dateOf(e.at);
    groups.set(d, [...(groups.get(d) ?? []), e]);
  }
  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-ink-2">Every published brief, quote, acceptance, milestone, update, document and change is logged here with who did it and when.</p>
      {[...groups.entries()].map(([day, list]) => (
        <section key={day} aria-label={formatDate(day)}>
          <h2 className="sticky top-14 z-10 bg-paper py-1 text-xs font-semibold tracking-wide text-ink-3 uppercase">{formatDate(day)}</h2>
          <ol className="mt-2 space-y-3 border-l border-line-strong pl-4">
            {list.map((e) => (
              <li key={e.id} className="text-sm">
                <p>{e.summary}</p>
                <p className="text-xs text-ink-3">
                  {partyName(data, e.actorId)} · {formatTime(e.at)}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
