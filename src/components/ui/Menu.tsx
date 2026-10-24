import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

export type MenuItem =
  | { kind: 'link'; label: string; to: string; icon?: ReactNode }
  | { kind: 'action'; label: string; onSelect: () => void; icon?: ReactNode; tone?: 'danger'; disabled?: boolean }
  | { kind: 'separator' }
  | { kind: 'heading'; label: ReactNode };

/**
 * Disclosure-style dropdown menu. Opens on click (never hover), closes on Escape,
 * outside click or selection, and returns focus to the trigger.
 */
export function Menu({
  trigger,
  triggerLabel,
  items,
  align = 'right',
  className,
}: {
  trigger: (props: { 'aria-expanded': boolean; 'aria-controls': string; onClick: () => void; ref: React.Ref<HTMLButtonElement> }) => ReactNode;
  triggerLabel?: string;
  items: ReadonlyArray<MenuItem>;
  align?: 'left' | 'right';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    panelRef.current?.querySelector<HTMLElement>('a,button:not([disabled])')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onPanelKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const focusables = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('a,button:not([disabled])') ?? []);
    const idx = focusables.indexOf(document.activeElement as HTMLElement);
    const next = focusables[(idx + (e.key === 'ArrowDown' ? 1 : focusables.length - 1)) % focusables.length];
    next?.focus();
  };

  const itemClass = 'flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-sm hover:bg-sunken focus-visible:bg-sunken disabled:opacity-50';

  return (
    <div className={cn('relative', className)}>
      {trigger({ 'aria-expanded': open, 'aria-controls': id, onClick: () => setOpen((o) => !o), ref: triggerRef })}
      {open ? (
        <div
          ref={panelRef}
          id={id}
          aria-label={triggerLabel}
          onKeyDown={onPanelKey}
          className={cn(
            'absolute top-full z-40 mt-1 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-line bg-surface py-1 shadow-overlay',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <ul>
            {items.map((item, i) => {
              switch (item.kind) {
                case 'separator':
                  return <li key={`sep-${i}`} aria-hidden className="my-1 border-t border-line" />;
                case 'heading':
                  return (
                    <li key={`h-${i}`} className="px-3 pt-2 pb-1.5 text-sm">
                      {item.label}
                    </li>
                  );
                case 'link':
                  return (
                    <li key={item.label}>
                      <Link to={item.to} className={itemClass} onClick={() => setOpen(false)}>
                        {item.icon}
                        {item.label}
                      </Link>
                    </li>
                  );
                case 'action':
                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        disabled={item.disabled}
                        className={cn(itemClass, item.tone === 'danger' && 'text-bad')}
                        onClick={() => {
                          close();
                          item.onSelect();
                        }}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    </li>
                  );
              }
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
