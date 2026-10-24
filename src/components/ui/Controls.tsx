import { useId, type ReactNode } from 'react';
import { NavLink } from 'react-router';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
}

/** Single-choice segmented control implemented as a native radio group. */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  hideLabel = true,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<SegmentOption<T>>;
  onChange: (value: T) => void;
  className?: string;
  hideLabel?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className={cn('mb-1.5 text-sm font-semibold', hideLabel && 'sr-only')}>{label}</legend>
      <div className="inline-flex max-w-full flex-wrap gap-px overflow-hidden rounded-sm border border-line-strong bg-line-strong">
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                'relative flex min-h-10 cursor-pointer items-center gap-1.5 px-3 text-sm font-medium has-focus-visible:outline-2 has-focus-visible:outline-brick',
                checked ? 'bg-ink text-paper' : 'bg-surface text-ink hover:bg-sunken',
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
              {o.count !== undefined ? (
                <span className={cn('font-mono text-xs tabular', checked ? 'text-paper/80' : 'text-ink-3')}>{o.count}</span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Toggleable filter chip (aria-pressed button). */
export function Chip({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-sm border px-3 text-sm font-medium transition-colors',
        selected ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-surface text-ink hover:bg-sunken',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Removable chip used to show an active filter. */
export function FilterTag({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-1 rounded-sm border border-line-strong bg-surface pl-2.5 text-sm">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex size-8 items-center justify-center rounded-sm text-ink-3 hover:bg-sunken hover:text-ink"
        aria-label={`Remove filter: ${typeof children === 'string' ? children : 'filter'}`}
      >
        <X aria-hidden className="size-4" />
      </button>
    </span>
  );
}

export interface TabNavItem {
  to: string;
  label: string;
  count?: number | undefined;
  end?: boolean;
}

/** Route-based tab navigation. Scrolls horizontally inside its own bar on narrow screens. */
export function TabNav({ items, label, className }: { items: ReadonlyArray<TabNavItem>; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn('-mx-4 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0', className)}>
      <ul className="flex min-w-max gap-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end ?? true}
              className={({ isActive }) =>
                cn(
                  '-mb-px flex min-h-11 items-center gap-1.5 border-b-2 px-3 text-sm font-semibold whitespace-nowrap',
                  isActive ? 'border-brick text-ink' : 'border-transparent text-ink-3 hover:text-ink',
                )
              }
            >
              {item.label}
              {item.count ? <span className="font-mono text-xs text-ink-3 tabular">{item.count}</span> : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** In-page tab strip (for switching views inside a page without routing). */
export function TabStrip<T extends string>({
  label,
  value,
  items,
  onChange,
  className,
}: {
  label: string;
  value: T;
  items: ReadonlyArray<{ value: T; label: string; count?: number }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn('-mx-4 flex overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0', className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => {
              const idx = items.findIndex((i) => i.value === value);
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const next = items[(idx + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length];
                if (next) onChange(next.value);
              }
            }}
            tabIndex={active ? 0 : -1}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-semibold whitespace-nowrap',
              active ? 'border-brick text-ink' : 'border-transparent text-ink-3 hover:text-ink',
            )}
          >
            {item.label}
            {item.count !== undefined ? <span className="font-mono text-xs text-ink-3 tabular">{item.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
