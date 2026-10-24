import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Bell, ChevronDown, CircleHelp, Ellipsis, FlaskConical, MessagesSquare, Repeat2, RotateCcw, Settings } from 'lucide-react';
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

export function DemoBanner() {
  const show = useDemoDialogs((s) => s.show);
  return (
    <div className="border-b border-warn/30 bg-warn-tint text-ink">
      <div className="mx-auto flex max-w-[90rem] items-center gap-2 px-4 py-1 text-[0.8125rem]">
        <FlaskConical aria-hidden className="size-4 shrink-0 text-warn" />
        <p className="min-w-0 flex-1 truncate">
          <strong className="font-semibold">Demo mode</strong>
          <span className="hidden sm:inline"> — data is stored only in this browser and doesn’t sync to other devices or people.</span>
          <span className="sm:hidden"> · data stays in this browser</span>
        </p>
        <Link to="/help" className="hidden min-h-9 items-center px-2 font-semibold underline underline-offset-2 sm:inline-flex">
          About this demo
        </Link>
        <button type="button" onClick={() => show('reset')} className="inline-flex min-h-9 items-center gap-1 px-2 font-semibold underline underline-offset-2">
          <RotateCcw aria-hidden className="size-3.5" />
          Reset<span className="hidden sm:inline">&nbsp;demo data</span>
        </button>
      </div>
    </div>
  );
}

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
              Help &amp; about this demo
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
              Switch demo persona
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                onClose();
                show('reset');
              }}
              className="flex min-h-12 w-full items-center gap-3 rounded-sm px-2 text-left text-base text-bad hover:bg-bad-tint"
            >
              <RotateCcw aria-hidden className="size-5" />
              Reset demo data
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
          aria-label={`Persona menu: ${name}, ${roleLabel[role]}`}
        >
          <Avatar name={name} size="sm" />
          <span className="hidden max-w-44 text-left leading-tight lg:block">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <span className="block text-xs text-ink-3">{roleLabel[role]} · demo</span>
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
              <span className="block text-xs text-ink-3">{roleLabel[role]} · demo persona, not a real account</span>
            </>
          ),
        },
        { kind: 'separator' },
        { kind: 'link', label: 'Settings', to: role === 'owner' ? '/owner/settings' : '/contractor/settings', icon: <Settings aria-hidden className="size-4" /> },
        { kind: 'link', label: 'Help & about this demo', to: '/help', icon: <CircleHelp aria-hidden className="size-4" /> },
        { kind: 'action', label: 'Switch demo persona', onSelect: () => show('persona'), icon: <Repeat2 aria-hidden className="size-4" /> },
        { kind: 'separator' },
        { kind: 'action', label: 'Reset demo data', onSelect: () => show('reset'), tone: 'danger', icon: <RotateCcw aria-hidden className="size-4" /> },
      ]}
    />
  );
}

/** Signed-in application shell: demo banner, top bar, desktop sidebar, mobile bottom navigation. */
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
      <DemoBanner />
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-2 px-2 sm:px-4">
          <Link to={roleHome[role]} className="flex min-h-11 items-center px-2" aria-label={`${brand.name} — ${roleLabel[role]} home`}>
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
            Switch persona
          </button>
          <Link
            to="/messages"
            className="relative hidden size-11 items-center justify-center rounded-sm hover:bg-sunken md:inline-flex"
            aria-label={counts.unreadMessages ? `Messages (${counts.unreadMessages} unread)` : 'Messages'}
          >
            <MessagesSquare aria-hidden className="size-5" />
            {counts.unreadMessages ? <CountBadge count={counts.unreadMessages} /> : null}
          </Link>
          <Link
            to="/notifications"
            className="relative inline-flex size-11 items-center justify-center rounded-sm hover:bg-sunken"
            aria-label={counts.unreadNotifications ? `Notifications (${counts.unreadNotifications} unread)` : 'Notifications'}
          >
            <Bell aria-hidden className="size-5" />
            {counts.unreadNotifications ? <CountBadge count={counts.unreadNotifications} /> : null}
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
          <div className="mt-auto border-t border-line pt-4 text-sm text-ink-3">
            <p>Local demo. Nothing you do here is sent anywhere.</p>
            <Link to="/help" className="mt-1 inline-flex min-h-9 items-center font-semibold text-ink-2 underline underline-offset-2">
              What this demo can’t do
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

