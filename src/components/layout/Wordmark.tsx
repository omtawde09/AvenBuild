import { brand } from '@/config/brand';
import { cn } from '@/lib/cn';

/** Typographic wordmark; edit text in src/config/brand.ts. */
export function Wordmark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn('inline-flex items-baseline gap-1.5 leading-none', className)}>
      <span className="sr-only">{brand.name}</span>
      <span aria-hidden className="relative top-px inline-block size-2.5 bg-brick" />
      {/* One word, two weights: the parts sit flush so it reads as a single name. */}
      <span aria-hidden className="text-lg tracking-tight">
        <span className={cn('font-wide font-extrabold', inverted ? 'text-paper' : 'text-ink')}>{brand.wordmark.primary}</span>
        <span className={cn('font-condensed font-medium', inverted ? 'text-paper/80' : 'text-ink-2')}>{brand.wordmark.secondary}</span>
      </span>
    </span>
  );
}
