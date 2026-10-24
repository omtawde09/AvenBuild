import { CalendarCheck, CircleAlert, MailOpen, MapPin, Tag, Wallet, type LucideIcon } from 'lucide-react';
import type { MatchReason, MatchReasonKind } from '@/domain/matching/match';
import { cn } from '@/lib/cn';

const icons: Record<MatchReasonKind, LucideIcon> = {
  service: Tag,
  area: MapPin,
  locality: MapPin,
  budget: Wallet,
  timing: CalendarCheck,
  invited: MailOpen,
};

/** Short chip text; the full sentence stays available as a tooltip and to screen readers. */
function short(r: MatchReason, miss: boolean): string {
  if (miss) return r.kind === 'budget' ? 'Budget outside your range' : r.kind === 'timing' ? 'Starts before you’re free' : r.label;
  switch (r.kind) {
    case 'service':
      return r.label.replace(/^Service match:\s*/, '');
    case 'area':
    case 'locality':
      return r.label.replace(/^Service area:\s*/, '');
    case 'budget':
      return 'Budget fits';
    case 'timing':
      return r.label === 'You’re available now' ? 'Available now' : 'Dates fit';
    case 'invited':
      return 'Invited';
  }
}

/** Why a lead matches, as compact icon chips (green = fit, amber = worth checking). */
export function MatchChips({ reasons, misses = [], className }: { reasons: ReadonlyArray<MatchReason>; misses?: ReadonlyArray<MatchReason>; className?: string }) {
  const shownMisses = misses.filter((m) => m.kind === 'budget' || m.kind === 'timing');
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)} aria-label="Why this lead matches">
      {reasons.map((r) => {
        const Icon = icons[r.kind];
        return (
          <li key={r.label} title={r.label} className="inline-flex items-center gap-1 rounded-xs bg-ok-tint px-1.5 py-0.5 text-xs font-medium text-ok">
            <Icon aria-hidden className="size-3.5" />
            <span className="sr-only">{r.label}</span>
            <span aria-hidden>{short(r, false)}</span>
          </li>
        );
      })}
      {shownMisses.map((m) => (
        <li key={m.label} title={m.label} className="inline-flex items-center gap-1 rounded-xs bg-warn-tint px-1.5 py-0.5 text-xs font-medium text-warn">
          <CircleAlert aria-hidden className="size-3.5" />
          <span className="sr-only">{m.label}</span>
          <span aria-hidden>{short(m, true)}</span>
        </li>
      ))}
    </ul>
  );
}
