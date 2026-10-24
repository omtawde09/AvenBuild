import { useId, useState, type ReactNode } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { FilterTag } from './Controls';
import { controlClasses } from './Field';
import { cn } from '@/lib/cn';

export interface ActiveFilter {
  key: string;
  label: string;
  clear: () => void;
}

/**
 * Search + filters + sort for list pages. Filters render inline on desktop and in a bottom sheet on
 * phones; active filters always show as removable tags with "Clear all".
 */
export function ListToolbar({
  query,
  onQuery,
  searchLabel,
  placeholder,
  filters,
  sort,
  active,
  onClearAll,
  resultLabel,
}: {
  query: string;
  onQuery: (q: string) => void;
  searchLabel: string;
  placeholder?: string;
  filters: ReactNode;
  sort?: ReactNode;
  active: ReadonlyArray<ActiveFilter>;
  onClearAll: () => void;
  resultLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-0 flex-1 basis-56">
          <label htmlFor={id} className="sr-only">
            {searchLabel}
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
          <input id={id} type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder={placeholder ?? searchLabel} className={cn(controlClasses, 'pl-9')} />
        </div>
        <Button variant="secondary" className="lg:hidden" icon={<SlidersHorizontal aria-hidden className="size-4" />} onClick={() => setOpen(true)} aria-haspopup="dialog">
          Filters{active.length ? ` (${active.length})` : ''}
        </Button>
        {sort ? <div className="shrink-0">{sort}</div> : null}
      </div>
      <div className="hidden flex-wrap items-end gap-3 lg:flex">{filters}</div>
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <p className="mr-2 text-sm text-ink-2">{resultLabel}</p>
        {active.map((f) => (
          <FilterTag key={f.key} onRemove={f.clear}>
            {f.label}
          </FilterTag>
        ))}
        {active.length ? (
          <button type="button" onClick={onClearAll} className="min-h-9 px-2 text-sm font-semibold underline underline-offset-2">
            Clear all
          </button>
        ) : null}
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        variant="sheet"
        footer={
          <>
            <Button variant="secondary" onClick={onClearAll} disabled={!active.length}>
              Clear all
            </Button>
            <Button onClick={() => setOpen(false)}>Show results</Button>
          </>
        }
      >
        <div className="grid gap-4">{filters}</div>
      </Dialog>
    </div>
  );
}
