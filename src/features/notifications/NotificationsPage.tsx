import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Bell, BellOff, CheckCheck, FileText, FolderKanban, ListChecks, MessagesSquare, Scale, Star, type LucideIcon } from 'lucide-react';
import { useActorId, useActiveRole, useData } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import type { NotificationId } from '@/domain/ids';
import { markAllNotificationsRead, setNotificationRead } from '@/domain/messages/commands';
import { notificationsFor } from '@/domain/messages/selectors';
import { NOTIFICATION_CATEGORIES, type NotificationCategory } from '@/domain/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { InlineSelect } from '@/components/ui/Field';
import { SegmentedControl } from '@/components/ui/Controls';
import { formatDateTime, formatRelative } from '@/lib/format';
import { pickEnum, useUrlState } from '@/lib/useUrlState';
import { cn } from '@/lib/cn';

const categoryIcon: Record<NotificationCategory, LucideIcon> = {
  project: FolderKanban,
  quote: FileText,
  message: MessagesSquare,
  milestone: ListChecks,
  change: Scale,
  review: Star,
  system: Bell,
};

const categoryLabel: Record<NotificationCategory, string> = {
  project: 'Project',
  quote: 'Quote',
  message: 'Message',
  milestone: 'Milestone',
  change: 'Change request',
  review: 'Review',
  system: 'System',
};

export function NotificationsPage() {
  const data = useData();
  const me = useActorId();
  const role = useActiveRole();
  const command = useCommand();
  const navigate = useNavigate();
  const [f, update] = useUrlState({ show: 'all' as 'all' | 'unread', category: '' }, (raw) => ({
    ...(pickEnum(raw.show, ['all', 'unread'] as const) ? { show: pickEnum(raw.show, ['all', 'unread'] as const) } : {}),
    ...(pickEnum(raw.category, NOTIFICATION_CATEGORIES) ? { category: raw.category } : {}),
  }));
  const all = useMemo(() => notificationsFor(data, me), [data, me]);
  const unread = all.filter((n) => !n.readAt).length;
  const visible = all.filter((n) => (f.show === 'unread' ? !n.readAt : true) && (f.category ? n.category === f.category : true));
  const settingsLink = role === 'owner' ? '/owner/settings' : '/contractor/settings';

  return (
    <>
      <PageHeader
        title="Notifications"
        crumbs={[{ label: 'Home', to: role === 'owner' ? '/owner' : '/contractor' }, { label: 'Notifications' }]}
        actions={
          <Button variant="secondary" icon={<CheckCheck aria-hidden className="size-4" />} disabled={!unread} onClick={() => command((s, c) => markAllNotificationsRead(s, c), { success: 'All notifications marked as read.' })}>
            Mark all read
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="Show"
          value={f.show}
          onChange={(show) => update({ show })}
          options={[
            { value: 'all', label: 'All', count: all.length },
            { value: 'unread', label: 'Unread', count: unread },
          ]}
        />
        <InlineSelect aria-label="Category" value={f.category} onChange={(e) => update({ category: e.target.value })} options={[{ value: '', label: 'All categories' }, ...NOTIFICATION_CATEGORIES.map((c) => ({ value: c, label: categoryLabel[c] }))]} />
      </div>
      {visible.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {visible.map((n) => (
            <li key={n.id} className={cn('flex items-start gap-3 py-3 pr-1 pl-1 sm:pl-3', !n.readAt && 'bg-surface')}>
              <span className="relative mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-sunken text-ink-2" aria-hidden>
                {(() => {
                  const Icon = categoryIcon[n.category];
                  return <Icon className="size-[1.125rem]" />;
                })()}
                {!n.readAt ? <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface bg-brick" /> : null}
              </span>
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  if (!n.readAt) command((s, c) => setNotificationRead(s, n.id as NotificationId, true, c));
                  navigate(n.link);
                }}
              >
                <span className="flex flex-wrap items-baseline gap-x-2 text-xs text-ink-3">
                  <span className="font-semibold tracking-wide uppercase">{categoryLabel[n.category]}</span>
                  <time dateTime={n.createdAt} title={formatDateTime(n.createdAt)}>
                    {formatRelative(n.createdAt)}
                  </time>
                  {!n.readAt ? <span className="font-semibold text-brick-strong">Unread</span> : null}
                  {n.muted ? (
                    <span className="inline-flex items-center gap-1">
                      <BellOff aria-hidden className="size-3" /> Muted category
                    </span>
                  ) : null}
                </span>
                <span className={cn('mt-0.5 block', n.readAt ? 'font-medium' : 'font-semibold')}>{n.title}</span>
                <span className="block text-sm text-ink-2">{n.body}</span>
              </button>
              <Button size="sm" variant="ghost" onClick={() => command((s, c) => setNotificationRead(s, n.id as NotificationId, !n.readAt, c))} aria-label={n.readAt ? `Mark unread: ${n.title}` : `Mark read: ${n.title}`}>
                {n.readAt ? 'Mark unread' : 'Mark read'}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<Bell />} title={f.show === 'unread' ? 'You’re all caught up' : 'No notifications'} action={f.show === 'unread' || f.category ? <Button variant="secondary" onClick={() => update({ show: 'all', category: '' })}>Show all</Button> : null}>
          Notifications appear when the other side does something on one of your projects. You can mute categories in{' '}
          <button type="button" className="font-semibold underline underline-offset-2" onClick={() => navigate(settingsLink)}>
            settings
          </button>
          .
        </EmptyState>
      )}
    </>
  );
}
