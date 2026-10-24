import { create } from 'zustand';
import { buildSeed } from '@/data/seed';
import { randomIdFactory, type IdFactory, type UserId } from '@/domain/ids';
import { fail, type Result } from '@/domain/result';
import type { Role } from '@/domain/roles';
import { startOfLocalDay, toISODate } from '@/domain/time';
import type { CommandContext, CommandResult } from '@/domain/tx';
import type { DemoState, User } from '@/domain/types';
import { unreadConversationCount, unreadNotificationCount } from '@/domain/messages/selectors';
import type { LoadResult, StorageAdapter } from '@/lib/storage/adapter';
import { createLocalStorageAdapter } from '@/lib/storage/localStorageAdapter';
import { revokeAllPreviews } from '@/lib/storage/sessionPreviews';

export interface StorageNotice {
  id: 'recovered' | 'save_failed' | 'external_invalid';
  tone: 'warn' | 'error';
  title: string;
  body: string;
}

interface Deps {
  adapter: StorageAdapter;
  clock: () => Date;
  newId: IdFactory;
}

let deps: Deps = { adapter: createLocalStorageAdapter(), clock: () => new Date(), newId: randomIdFactory };
let unsubscribeExternal: (() => void) | null = null;

interface DemoStore {
  data: DemoState;
  notices: StorageNotice[];
  /** Run a pure domain command as the active persona, commit and persist on success. */
  run: <V>(command: (state: DemoState, ctx: CommandContext) => CommandResult<V>) => Result<V>;
  setPersona: (id: UserId | null) => void;
  resetDemo: () => void;
  dismissNotice: (id: StorageNotice['id']) => void;
}

const recoveryText: Record<Exclude<LoadResult, { kind: 'ok' } | { kind: 'empty' }>['reason'], string> = {
  malformed: 'Saved demo data in this browser was damaged',
  invalid: 'Saved demo data in this browser didn’t match the expected format',
  unknown_version: 'Saved demo data came from a different version of this demo',
  unavailable: 'This browser isn’t allowing the demo to read saved data',
};

function freshSeed(): DemoState {
  return buildSeed(toISODate(startOfLocalDay(deps.clock())));
}

function initialState(): { data: DemoState; notices: StorageNotice[] } {
  const loaded = deps.adapter.load();
  if (loaded.kind === 'ok') return { data: loaded.state, notices: [] };
  const data = freshSeed();
  const notices: StorageNotice[] = [];
  if (loaded.kind === 'recovered') {
    notices.push({
      id: 'recovered',
      tone: 'warn',
      title: `${recoveryText[loaded.reason]}, so the original sample data was restored.`,
      body: loaded.detail,
    });
  }
  const saved = deps.adapter.save(data);
  if (saved.kind === 'failed') notices.push(saveFailedNotice(saved.reason));
  return { data, notices };
}

function saveFailedNotice(reason: 'quota' | 'unavailable'): StorageNotice {
  return {
    id: 'save_failed',
    tone: 'error',
    title: 'Changes in this session can’t be saved in this browser.',
    body:
      reason === 'quota'
        ? 'Browser storage is full. The demo keeps working, but your changes will be lost when you refresh. Resetting the demo data may free space.'
        : 'Browser storage is unavailable (for example in some private windows). The demo keeps working, but changes will be lost when you refresh.',
  };
}

const withNotice = (notices: StorageNotice[], n: StorageNotice) => [...notices.filter((x) => x.id !== n.id), n];

export const useDemoStore = create<DemoStore>((set, get) => ({
  ...initialState(),

  run: (command) => {
    const { data } = get();
    const actorId = data.meta.activePersonaId;
    if (!actorId) return fail('FORBIDDEN', 'Choose a demo persona first.');
    const now = deps.clock();
    const ctx: CommandContext = { actorId, now: now.toISOString(), today: toISODate(now), newId: deps.newId };
    let result: CommandResult<unknown>;
    try {
      result = command(data, ctx);
    } catch (e) {
      console.error('Domain command failed unexpectedly', e);
      return fail('CONFLICT', 'Something went wrong while saving that change. Nothing was changed.');
    }
    if (!result.ok) return result;
    const next = result.value.state;
    if (next !== data) {
      set({ data: next });
      const saved = deps.adapter.save(next);
      if (saved.kind === 'failed') set((s) => ({ notices: withNotice(s.notices, saveFailedNotice(saved.reason)) }));
      else if (get().notices.some((n) => n.id === 'save_failed')) set((s) => ({ notices: s.notices.filter((n) => n.id !== 'save_failed') }));
    }
    return { ok: true, value: result.value.value } as Result<never>;
  },

  setPersona: (id) => {
    const { data } = get();
    if (id !== null && !data.users[id]?.isPersona) return;
    const next: DemoState = { ...data, meta: { ...data.meta, activePersonaId: id } };
    set({ data: next });
    const saved = deps.adapter.save(next);
    if (saved.kind === 'failed') set((s) => ({ notices: withNotice(s.notices, saveFailedNotice(saved.reason)) }));
  },

  resetDemo: () => {
    revokeAllPreviews();
    deps.adapter.clear();
    const data = freshSeed();
    const saved = deps.adapter.save(data);
    set({ data, notices: saved.kind === 'failed' ? [saveFailedNotice(saved.reason)] : [] });
  },

  dismissNotice: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),
}));

function listenForOtherTabs(): void {
  unsubscribeExternal?.();
  unsubscribeExternal = deps.adapter.subscribe(() => {
    const loaded = deps.adapter.load();
    const current = useDemoStore.getState().data;
    if (loaded.kind === 'ok') {
      // Keep this tab's persona: switching persona in another tab shouldn't switch this one.
      const persona = current.meta.activePersonaId;
      const keep = persona && loaded.state.users[persona]?.isPersona && loaded.state.meta.seedAnchor === current.meta.seedAnchor ? persona : loaded.state.meta.activePersonaId;
      useDemoStore.setState({ data: { ...loaded.state, meta: { ...loaded.state.meta, activePersonaId: keep } } });
    } else if (loaded.kind === 'recovered') {
      useDemoStore.setState((s) => ({
        notices: withNotice(s.notices, { id: 'external_invalid', tone: 'warn', title: 'Another tab saved data this tab couldn’t read.', body: 'This tab kept its own copy. Refresh to load the saved data.' }),
      }));
    }
  });
}

/** (Re)initialise the store — used at startup and by tests to inject storage, clock and IDs. */
export function initDemoStore(overrides: Partial<Deps> = {}): void {
  deps = { ...deps, ...overrides };
  useDemoStore.setState(initialState());
  listenForOtherTabs();
}

listenForOtherTabs();

export function getClock(): () => Date {
  return deps.clock;
}

/** Today's local date per the injected clock. */
export function todayISO(): string {
  return toISODate(deps.clock());
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export const useData = () => useDemoStore((s) => s.data);
export const useRun = () => useDemoStore((s) => s.run);

export function personaRole(id: UserId | null, data: DemoState = useDemoStore.getState().data): Role | null {
  if (!id) return null;
  const user = data.users[id];
  return user?.isPersona ? user.role : null;
}

export function useActiveRole(): Role | null {
  return useDemoStore((s) => personaRole(s.data.meta.activePersonaId, s.data));
}

export function useActivePersona(): User | null {
  return useDemoStore((s) => (s.data.meta.activePersonaId ? (s.data.users[s.data.meta.activePersonaId] ?? null) : null));
}

/** Persona id; components under role guards can rely on it being set. */
export function useActorId(): UserId {
  const id = useDemoStore((s) => s.data.meta.activePersonaId);
  if (!id) throw new Error('useActorId used outside a persona-guarded route');
  return id;
}

export function useShellCounts(): { unreadMessages: number; unreadNotifications: number } {
  const messages = useDemoStore((s) => (s.data.meta.activePersonaId ? unreadConversationCount(s.data, s.data.meta.activePersonaId) : 0));
  const notifications = useDemoStore((s) => (s.data.meta.activePersonaId ? unreadNotificationCount(s.data, s.data.meta.activePersonaId) : 0));
  return { unreadMessages: messages, unreadNotifications: notifications };
}
