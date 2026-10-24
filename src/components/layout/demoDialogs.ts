import { create } from 'zustand';

export type DemoDialog = 'persona' | 'reset' | null;

/** Opens the shared persona-switch and reset dialogs from anywhere in the UI. */
export const useDemoDialogs = create<{ open: DemoDialog; show: (d: DemoDialog) => void }>((set) => ({
  open: null,
  show: (d) => set({ open: d }),
}))
