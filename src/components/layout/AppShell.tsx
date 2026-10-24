import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Bell, ChevronDown, CircleHelp, Ellipsis, MessagesSquare, Repeat2, Settings } from 'lucide-react';
import { brand } from '@/config/brand';
import { roleHome, roleLabel, type Role } from '@/domain/roles';
import { personaCards } from '@/data/personas';
import { useActiveRole, useDemoStore, useShellCounts } from '@/app/store/demoStore';
import { Avatar } from '@/components/ui/Feedback';
import { CountBadge } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/cn';
import { mobileLabel, navByRole, type NavItem } from './navigation';
import { DemoControlDialogs } from './DemoControls';
import { useDemoDialogs } from './demoDialogs';
import { Wordmark } from './Wordmark';
import { StorageNotices } from './StorageNotices';

/** Paths where the flow owns the bottom of the screen (wizard/composer/thread), so the bottom nav hides. */
const FOCUS_FLOW = [/^\/owner\/projects\/new$/, /^\/owner\/projects\/[^/]+\/edit$/, /^\/contractor\/leads\/[^/]+\/quote$/, /^\/messages\/[^/]+$/];

function useBadge(item: NavItem) {
  const counts = useShellCounts();
  if (item.badge === 'messages') return counts.unreadMessages;
  if (item.badge === 'notifications') return counts.unreadNotifications;
  return 0;
}

function SidebarLink({ item }: { item: NavItem }) {
  const badge = useBadge(item);
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end ?? false}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 items-center gap-3 rounded-sm px-3 text-[0.9375rem] font-medium',
          isActive ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-sunken hover:text-ink',
        )
      }
    >
      <Icon aria-hidden className="size-[1.125rem] shrink-0" />
      <span className="flex-1">{item.label}</span>
      {badge ? (
        <span className="rounded-full bg-brick px-1.5 font-mono text-xs leading-5 text-white tabular">
          {badge}
          <span className="sr-only"> unread</span>
        </span>
      ) : null}
    </NavLink>
  );
}

function BottomNavLink({ item }: { item: NavItem }) {
  const badge = useBadge(item);
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end ?? false}
      className={({ isActive }) =>
        cn(
          'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] font-semibold',
          isActive ? 'text-ink' : 'text-ink-3',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span aria-hidden className={cn('absolute inset-x-3 top-0 h-0.5', isActive ? 'bg-brick' : 'bg-transparent')} />
          <span className="relative">
            <Icon aria-hidden className="size-5" />
            {badge ? <CountBadge count={badge} className="-top-1.5 -right-2.5" /> : null}
          </span>
          <span className="truncate">{mobileLabel[item.label] ?? item.label}</span>
          {badge ? <span className="sr-only">, {badge} unread</span> : null}
        </>
      )}
    </NavLink>
  );
}

function MoreSheet({ role, open, onClose }: { role: Role; open: boolean; onClose: () => void }) {
  const show = useDemoDialogs((s) => s.show);
  const items = navByRole[role].filter((i) => !i.primaryMobile);
  return (
    <Dialog open={open} onClose={onClose} title="More" variant="sheet" size="sm">
      <nav aria-label="More navigation">
        <ul className="-mx-2 grid">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink to={item.to} onClick={onClose} className="flex min-h-12 items-center gap-3 rounded-sm px-2 text-base hover:bg-sunken">
                  <Icon aria-hidden className="size-5 text-ink-2" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
          <li className="my-2 border-t border-line" aria-hidden />
          <li>
            <NavLink to="/help" onClick={onClose} className="flex min-h-12 items-center gap-3 rounded-sm px-2 text-base hover:bg-sunken">
              <CircleHelp aria-hidden className="size-5 text-ink-2" />
              Help
            </NavLink>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                onClose();
                show('persona');
              }}
              className="flex min-h-12 w-full items-center gap-3 rounded-sm px-2 text-left text-base hover:bg-sunken"
            >
              <Repeat2 aria-hidden className="size-5 text-ink-2" />
              Switch account
            </button>
          </li>
        </ul>
      </nav>
    </Dialog>
  );
}

function ProfileMenu({ role }: { role: Role }) {
  const activeId = useDemoStore((s) => s.data.meta.activePersonaId);
  const show = useDemoDialogs((s) => s.show);
  const persona = personaCards.find((p) => p.id === activeId);
  const name = persona?.name ?? roleLabel[role];
  return (
    <Menu
      triggerLabel="Persona menu"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          className="flex min-h-11 items-center gap-2 rounded-sm px-1.5 hover:bg-sunken sm:px-2"
          title={`Persona menu: ${name}, ${roleLabel[role]}`}
        >
          <Avatar name={name} size="sm" />
          <span className="sr-only max-w-44 text-left leading-tight lg:not-sr-only lg:block">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <span className="block text-xs text-ink-3">{roleLabel[role]}</span>
          </span>
          <ChevronDown aria-hidden className="hidden size-4 text-ink-3 sm:block" />
        </button>
      )}
      items={[
        {
          kind: 'heading',
          label: (
            <>
              <span className="block font-semibold">{name}</span>
              <span className="block text-xs text-ink-3">{roleLabel[role]}</span>
            </>
          ),
        },
        { kind: 'separator' },
        { kind: 'link', label: 'Settings', to: role === 'owner' ? '/owner/settings' : '/contractor/settings', icon: <Settings aria-hidden className="size-4" /> },
        { kind: 'link', label: 'Help', to: '/help', icon: <CircleHelp aria-hidden className="size-4" /> },
        { kind: 'action', label: 'Switch account', onSelect: () => show('persona'), icon: <Repeat2 aria-hidden className="size-4" /> },
      ]}
    />
  );
}

function HeaderCount({ count }: { count: number }) {
  // Visible count is part of the accessible name ("Messages 3 unread"), matching what sighted users see.
  return (
    <span className="absolute top-1 right-1 min-w-[1.125rem] rounded-full bg-brick px-1 text-center font-mono text-[0.6875rem] leading-[1.125rem] font-medium text-white tabular">
      {count > 99 ? '99+' : count}
      <span className="sr-only"> unread</span>
    </span>
  );
}

/** Signed-in application shell: top bar, desktop sidebar, mobile bottom navigation. */
export function AppShell() {
  const role = useActiveRole();
  const counts = useShellCounts();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const show = useDemoDialogs((s) => s.show);
  const focusFlow = FOCUS_FLOW.some((r) => r.test(pathname));

  if (!role) return <Outlet />; // guards render their own "choose persona" state

  const items = navByRole[role];
  const mobileItems = items.filter((i) => i.primaryMobile);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 bg-ink px-3 py-2 text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-2 px-2 sm:px-4">
          <Link to={roleHome[role]} className="flex min-h-11 items-center px-2" title={`${brand.name} — ${roleLabel[role]} home`}>
            <Wordmark />
          </Link>
          <span className="hidden rounded-xs border border-line-strong px-1.5 py-0.5 font-mono text-[0.6875rem] tracking-wide text-ink-2 uppercase sm:inline">
            {roleLabel[role]}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => show('persona')}
            className="hidden min-h-11 items-center gap-1.5 rounded-sm px-3 text-sm font-medium text-ink-2 hover:bg-sunken hover:text-ink md:inline-flex"
          >
            <Repeat2 aria-hidden className="size-4" />
            Switch account
          </button>
          <Link
            to="/messages"
            className="relative hidden size-11 items-center justify-center rounded-sm hover:bg-sunken md:inline-flex"
            title="Messages"
          >
            <MessagesSquare aria-hidden className="size-5" />
            <span className="sr-only">Messages</span>
            {counts.unreadMessages ? <HeaderCount count={counts.unreadMessages} /> : null}
          </Link>
          <Link
            to="/notifications"
            className="relative inline-flex size-11 items-center justify-center rounded-sm hover:bg-sunken"
            title="Notifications"
          >
            <Bell aria-hidden className="size-5" />
            <span className="sr-only">Notifications</span>
            {counts.unreadNotifications ? <HeaderCount count={counts.unreadNotifications} /> : null}
          </Link>
          <ProfileMenu role={role} />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[90rem] flex-1">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col border-r border-line px-3 py-5 lg:flex" aria-label="Sidebar">
          <nav aria-label="Primary">
            <ul className="grid gap-0.5">
              {items.map((item) => (
                <li key={item.to}>
                  <SidebarLink item={item} />
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto border-t border-line pt-3">
            <Link to="/help" className="flex min-h-11 items-center gap-3 rounded-sm px-3 text-[0.9375rem] font-medium text-ink-2 hover:bg-sunken hover:text-ink">
              <CircleHelp aria-hidden className="size-[1.125rem]" />
              Help
            </Link>
          </div>
        </aside>
        <main id="main" tabIndex={-1} className={cn('min-w-0 flex-1 outline-none', focusFlow ? 'pb-4' : 'pb-24 lg:pb-10')}>
          <StorageNotices />
          <div className="container-page pt-5 md:pt-8">
            <Outlet />
          </div>
        </main>
      </div>

      {!focusFlow ? (
        <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-safe lg:hidden">
          <ul className="flex">
            {mobileItems.map((item) => (
              <li key={item.to} className="flex flex-1">
                <BottomNavLink item={item} />
              </li>
            ))}
            <li className="flex flex-1">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold text-ink-3"
                aria-haspopup="dialog"
              >
                <Ellipsis aria-hidden className="size-5" />
                More
              </button>
            </li>
          </ul>
        </nav>
      ) : null}
      <MoreSheet role={role} open={moreOpen} onClose={() => setMoreOpen(false)} />
      <DemoControlDialogs />
    </div>
  );
}

