import { create } from 'zustand';
import type { UserId } from '@/domain/ids';
import type { Role } from '@/domain/roles';
import { CONTRACTOR_PERSONA_ID, OWNER_PERSONA_ID } from '@/data/personas';

/**
 * Phase 1 session store: holds only the active demo persona, in memory.
 * Phase 2 replaces this with the full persisted demo state.
 */
interface DemoStore {
  activePersonaId: UserId | null;
  setPersona: (id: UserId | null) => void;
  resetDemo: () => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  activePersonaId: null,
  setPersona: (id) => set({ activePersonaId: id }),
  resetDemo: () => set({ activePersonaId: null }),
}));

export function personaRole(id: UserId | null): Role | null {
  if (id === OWNER_PERSONA_ID) return 'owner';
  if (id === CONTRACTOR_PERSONA_ID) return 'contractor';
  return null;
}

export function useActiveRole(): Role | null {
  return useDemoStore((s) => personaRole(s.activePersonaId));
}

export function useShellCounts(): { unreadMessages: number; unreadNotifications: number } {
  return { unreadMessages: 0, unreadNotifications: 0 };
}
