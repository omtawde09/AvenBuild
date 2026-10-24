import type { ReactNode } from 'react';
import { CircleAlert, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-sm bg-sunken', className)} />;
}

/** Explains why a list is empty and what action creates content. */
export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-start gap-3 border border-dashed border-line-strong px-5 py-8 sm:items-center sm:text-center', className)}>
      {icon ? <div className="text-ink-3 [&_svg]:size-7">{icon}</div> : null}
      <div className="max-w-md">
        <h3 className="text-base font-semibold">{title}</h3>
        {children ? <div className="mt-1 text-sm text-ink-2">{children}</div> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

/** Inline notice/callout. Tone is always reinforced with an icon and text. */
export function Notice({
  tone = 'info',
  title,
  children,
  action,
  className,
  id,
}: {
  id?: string;
  tone?: 'info' | 'warn' | 'error';
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const Icon = tone === 'error' ? CircleAlert : tone === 'warn' ? TriangleAlert : Info;
  const tones = {
    info: 'border-info/30 bg-info-tint text-info',
    warn: 'border-warn/30 bg-warn-tint text-warn',
    error: 'border-bad/30 bg-bad-tint text-bad',
  } as const;
  return (
    <div id={id} role={tone === 'error' ? 'alert' : undefined} className={cn('flex gap-3 rounded-sm border px-3 py-3', tones[tone], className)}>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1 text-sm text-ink">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title ? 'mt-0.5' : '', 'text-ink-2')}>{children}</div> : null}
        {action ? <div className="mt-2 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  );
}

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w[0] ?? ''))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' } as const;
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center rounded-sm bg-ink font-mono font-medium text-paper', sizes[size], className)}
    >
      {initials || '?'}
    </span>
  );
}

/** Determinate progress bar with an accessible value. */
export function ProgressBar({ value, label, showValue = true, className }: { value: number; label: string; showValue?: boolean; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        className="h-2 min-w-0 flex-1 overflow-hidden rounded-xs bg-sunken"
      >
        <div className="h-full bg-ok transition-[width] duration-300" style={{ width: `${v}%` }} />
      </div>
      {showValue ? <span className="w-10 shrink-0 text-right font-mono text-sm tabular">{v}%</span> : null}
    </div>
  );
}

/** Step indicator for multi-step forms. */
export function Stepper({ steps, current, className }: { steps: ReadonlyArray<string>; current: number; className?: string }) {
  return (
    <div className={className}>
      <p className="eyebrow" aria-live="polite">
        Step {current + 1} of {steps.length} · <span className="text-ink">{steps[current]}</span>
      </p>
      <ol className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Form progress">
        {steps.map((s, i) => (
          <li key={s} className={cn('h-1.5 rounded-xs', i <= current ? 'bg-brick' : 'bg-sunken')}>
            <span className="sr-only">
              {s}: {i < current ? 'complete' : i === current ? 'current step' : 'not started'}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Key/value fact list used across detail screens. */
export function Facts({ items, className, columns = 2 }: { items: ReadonlyArray<{ label: string; value: ReactNode }>; className?: string; columns?: 1 | 2 | 3 }) {
  const cols = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' } as const;
  return (
    <dl className={cn('grid gap-x-6 gap-y-3', cols[columns], className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0 border-t border-line pt-2">
          <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{item.label}</dt>
          <dd className="mt-0.5 text-[0.9375rem] break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionHeading({ title, action, description, as: As = 'h2', id }: { title: string; action?: ReactNode; description?: ReactNode; as?: 'h2' | 'h3'; id?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <As id={id} className={As === 'h2' ? 'text-lg font-semibold' : 'text-base font-semibold'}>
          {title}
        </As>
        {description ? <p className="mt-0.5 text-sm text-ink-3">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
