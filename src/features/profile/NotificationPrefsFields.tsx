import type { NotificationCategory, NotificationPrefs } from '@/domain/types';
import { Checkbox } from '@/components/ui/Field';

const rows: Array<{ key: Exclude<NotificationCategory, 'system'>; label: string; description: string }> = [
  { key: 'project', label: 'Projects and leads', description: 'New matching leads, invitations, brief changes, cancellations.' },
  { key: 'quote', label: 'Quotes', description: 'Quotes received, revisions, acceptances and declines.' },
  { key: 'message', label: 'Messages', description: 'New messages in your conversations.' },
  { key: 'milestone', label: 'Milestones and site updates', description: 'Submissions, approvals, change requests on milestones, new updates.' },
  { key: 'change', label: 'Change requests', description: 'Proposed, accepted or rejected changes to scope, dates or price.' },
  { key: 'review', label: 'Reviews', description: 'Review prompts and new reviews.' },
];

/** Category toggles. Muted notifications are still recorded but don't raise the badge. */
export function NotificationPrefsFields({ value, onChange }: { value: NotificationPrefs; onChange: (v: NotificationPrefs) => void }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold">In-app notifications</legend>
      <p className="-mt-1 text-sm text-ink-3">Turning a category off keeps it in your notification list but stops it from counting in the badge. Nothing is sent by email, SMS or push.</p>
      {rows.map((r) => (
        <Checkbox key={r.key} label={r.label} description={r.description} checked={value[r.key]} onChange={(e) => onChange({ ...value, [r.key]: e.target.checked })} />
      ))}
    </fieldset>
  );
}
