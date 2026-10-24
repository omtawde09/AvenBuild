import {
  Bell,
  Bookmark,
  FileText,
  FolderKanban,
  HardHat,
  Images,
  Inbox,
  LayoutDashboard,
  MessagesSquare,
  Search,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/domain/roles';

export type NavBadge = 'messages' | 'notifications';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: NavBadge;
  /** Shown in the mobile bottom bar (max 4 + "More"). */
  primaryMobile?: boolean;
}

export const navByRole: Record<Role, ReadonlyArray<NavItem>> = {
  owner: [
    { to: '/owner', label: 'Home', icon: LayoutDashboard, end: true, primaryMobile: true },
    { to: '/owner/projects', label: 'Projects', icon: FolderKanban, primaryMobile: true },
    { to: '/owner/contractors', label: 'Find contractors', icon: Search, primaryMobile: true },
    { to: '/owner/shortlist', label: 'Shortlist', icon: Bookmark },
    { to: '/workspace', label: 'Workspaces', icon: HardHat },
    { to: '/messages', label: 'Messages', icon: MessagesSquare, badge: 'messages', primaryMobile: true },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'notifications' },
    { to: '/owner/settings', label: 'Settings', icon: Settings },
  ],
  contractor: [
    { to: '/contractor', label: 'Home', icon: LayoutDashboard, end: true, primaryMobile: true },
    { to: '/contractor/leads', label: 'Leads', icon: Inbox, primaryMobile: true },
    { to: '/contractor/quotes', label: 'Quotes', icon: FileText, primaryMobile: true },
    { to: '/workspace', label: 'Workspaces', icon: HardHat },
    { to: '/messages', label: 'Messages', icon: MessagesSquare, badge: 'messages', primaryMobile: true },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'notifications' },
    { to: '/contractor/profile', label: 'Profile', icon: UserRound },
    { to: '/contractor/portfolio', label: 'Portfolio', icon: Images },
    { to: '/contractor/settings', label: 'Settings', icon: Settings },
  ],
};

/** Short labels for the mobile bottom bar. */
export const mobileLabel: Record<string, string> = {
  'Find contractors': 'Find pros',
};
