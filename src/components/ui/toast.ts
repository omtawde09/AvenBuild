import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  action?: { label: string; run: () => void };
  durationMs: number;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id' | 'durationMs'> & { durationMs?: number }) => number;
  dismiss: (id: number) => void;
  clear: () => void;
}

let counter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    counter += 1;
    const id = counter;
    const durationMs = t.durationMs ?? (t.action ? 8000 : 5000);
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id, durationMs }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Imperative toast helpers usable from event handlers. */
export const toast = {
  success: (message: string, action?: Toast['action']) =>
    useToastStore.getState().push(action ? { tone: 'success', message, action } : { tone: 'success', message }),
  error: (message: string) => useToastStore.getState().push({ tone: 'error', message, durationMs: 7000 }),
  info: (message: string, action?: Toast['action']) =>
    useToastStore.getState().push(action ? { tone: 'info', message, action } : { tone: 'info', message }),
};
