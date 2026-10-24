import { useEffect, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToastStore, type Toast } from './toast';

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.durationMs);
  const startedAt = useRef(0);

  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const timer = window.setTimeout(() => dismiss(toast.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, dismiss, toast.id]);

  const Icon = toast.tone === 'success' ? CircleCheck : toast.tone === 'error' ? CircleAlert : Info;
  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-md border bg-ink px-3 py-2.5 text-paper shadow-overlay motion-safe:animate-[toast-in_160ms_ease-out]',
        toast.tone === 'error' ? 'border-bad' : 'border-ink',
      )}
    >
      <Icon
        aria-hidden
        className={cn('mt-0.5 size-5 shrink-0', toast.tone === 'error' ? 'text-[#f3a79d]' : toast.tone === 'success' ? 'text-[#9fd3a8]' : 'text-paper')}
      />
      <p className="min-w-0 flex-1 py-0.5 text-sm">{toast.message}</p>
      {toast.action ? (
        <button
          type="button"
          className="min-h-9 shrink-0 rounded-sm px-2 text-sm font-semibold text-[#f2c3a8] underline underline-offset-2 hover:bg-white/10"
          onClick={() => {
            toast.action?.run();
            dismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Dismiss notification"
        className="-mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-sm hover:bg-white/10"
        onClick={() => dismiss(toast.id)}
      >
        <X aria-hidden className="size-4" />
      </button>
    </li>
  );
}

/** Live region for transient feedback. Sits above the mobile bottom navigation. */
export function ToastRegion() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-6 md:justify-end md:px-6"
    >
      <ol className="flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </ol>
    </div>
  );
}
