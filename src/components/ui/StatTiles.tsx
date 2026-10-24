import { Link } from 'react-router';
import type { LucideIcon } from 'lucide-react';

export interface StatTile {
  label: string;
  value: number;
  to: string;
  icon: LucideIcon;
}

/** Compact, tappable counters: icon, number, label. Each tile links to the matching list. */
export function StatTiles({ items }: { items: ReadonlyArray<StatTile> }) {
  return (
    <ul className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {items.map(({ label, value, to, icon: Icon }) => (
        <li key={label}>
          <Link to={to} className="group flex h-full items-center gap-3 rounded-md border border-line bg-surface p-3 hover:border-ink">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-sunken text-ink-2 group-hover:bg-ink group-hover:text-paper">
              <Icon aria-hidden className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-condensed text-2xl leading-none font-semibold tabular">{value}</span>
              <span className="mt-1 block text-xs leading-tight text-ink-2">{label}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
