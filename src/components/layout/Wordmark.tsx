import { brand } from '@/config/brand';
import { cn } from '@/lib/cn';

/** Typographic wordmark; edit text in src/config/brand.ts. */
export function Wordmark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn('inline-flex items-baseline gap-1 leading-none', className)}>
      <span className="sr-only">{brand.name}</span>
      <span aria-hidden className="relative top-px inline-block size-2.5 bg-brick" />
      <span aria-hidden className={cn('font-wide text-lg font-extrabold tracking-tight', inverted ? 'text-paper' : 'text-ink')}>
        {brand.wordmark.primary}
      </span>
      <span aria-hidden className={cn('font-condensed text-lg font-medium tracking-tight', inverted ? 'text-paper/80' : 'text-ink-2')}>
        {brand.wordmark.secondary}
      </span>
    </span>
  );
}
