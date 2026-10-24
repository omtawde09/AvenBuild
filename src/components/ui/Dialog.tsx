import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import type { ButtonVariant } from './buttonStyles';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** "sheet" docks to the bottom on small screens (used for mobile menus and filters). */
  variant?: 'dialog' | 'sheet';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Modal dialog built on the native <dialog> element: showModal() makes the rest of the page inert
 * (focus is contained), Escape closes it, and focus returns to the element that opened it.
 */
export function Dialog({ open, onClose, title, description, children, footer, variant = 'dialog', size = 'md', className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => {
      const target = restoreRef.current;
      restoreRef.current = null;
      if (target && document.contains(target)) target.focus();
    };
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCloseRef.current();
    };
    el.addEventListener('close', handleClose);
    el.addEventListener('cancel', handleCancel);
    return () => {
      el.removeEventListener('close', handleClose);
      el.removeEventListener('cancel', handleCancel);
    };
  }, []);

  useEffect(() => {
    // Ensure the modal is closed (and the page un-inerted) if the component unmounts while open.
    const el = ref.current;
    return () => {
      if (el?.open) el.close();
    };
  }, []);

  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' } as const;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-none overflow-visible bg-transparent p-0 text-ink backdrop:bg-ink/45',
        variant === 'sheet' ? 'mb-0 w-full sm:mb-auto sm:w-[calc(100%-2rem)]' : '',
        widths[size],
      )}
    >
      {open ? (
        <div
          className={cn(
            'flex max-h-[min(85dvh,46rem)] flex-col bg-surface shadow-overlay',
            variant === 'sheet' ? 'rounded-t-lg pb-safe sm:rounded-md' : 'rounded-md',
            className,
          )}
        >
          <div className="flex items-start gap-3 border-b border-line px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1 pt-1.5">
              <h2 id={titleId} className="text-lg leading-tight font-semibold">
                {title}
              </h2>
              {description ? (
                <div id={descId} className="mt-1 text-sm text-ink-2">
                  {description}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-2 hover:bg-sunken"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {children ? <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-5">{children}</div> : null}
          {footer ? (
            <div className="flex flex-col-reverse gap-2 border-t border-line px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ButtonVariant;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
  confirmDisabled?: boolean;
}

/** Confirmation for consequential actions. Cancelling never changes data. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
  children,
  confirmDisabled,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={body}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
