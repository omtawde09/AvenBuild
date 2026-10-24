import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface Crumb {
  label: string;
  to?: string;
}

/** Breadcrumb → H1 → context line → actions. Breadcrumbs collapse to a single "back" link on mobile. */
export function PageHeader({
  title,
  crumbs,
  meta,
  actions,
  className,
  children,
}: {
  title: ReactNode;
  crumbs?: ReadonlyArray<Crumb>;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const parent = crumbs?.filter((c) => c.to).at(-1);
  return (
    <header className={cn('mb-6 flex flex-col gap-3 border-b border-line pb-5', className)}>
      {crumbs?.length ? (
        <>
          <nav aria-label="Breadcrumb" className="hidden md:block">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-3">
              {crumbs.map((c, i) => (
                <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                  {i > 0 ? <ChevronRight aria-hidden className="size-3.5" /> : null}
                  {c.to ? (
                    <Link to={c.to} className="underline-offset-2 hover:text-ink hover:underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-ink-2">
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          {parent?.to ? (
            <Link to={parent.to} className="-my-2 inline-flex min-h-11 items-center gap-1 self-start text-sm text-ink-2 md:hidden">
              <ChevronRight aria-hidden className="size-4 rotate-180" />
              {parent.label}
            </Link>
          ) : null}
        </>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight font-semibold sm:text-3xl">{title}</h1>
          {meta ? <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}

/** Bottom-docked action bar on mobile; inline on larger screens. */
export function StickyActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-paper/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm',
        'md:static md:mx-0 md:border-t md:bg-transparent md:px-0 md:pb-0 md:backdrop-blur-none',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  );
}
