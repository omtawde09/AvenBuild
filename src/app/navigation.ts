import { roleHome, type Role } from '@/domain/roles';

/** Routes shared by both personas (data is scoped to participation). */
export const SHARED_PREFIXES = ['/workspace', '/messages', '/notifications', '/help'] as const;

function isShared(path: string): boolean {
  return SHARED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Where to land after switching persona: stay on shared routes, otherwise go to the new role's home. */
export function landingAfterSwitch(pathname: string, role: Role): string {
  return isShared(pathname) ? pathname : roleHome[role];
}

/** Only follow ?next= to internal paths that belong to the chosen role or are shared. */
export function safeNext(next: string | null, role: Role): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  const path = next.split(/[?#]/)[0] ?? '';
  if (path === `/${role}` || path.startsWith(`/${role}/`) || isShared(path)) return next;
  return null;
}
