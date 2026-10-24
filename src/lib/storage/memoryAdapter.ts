import type { DemoState } from '@/domain/types';
import type { StorageAdapter } from './adapter';
import { STORAGE_KEY, unwrap, wrap } from './envelope';

/** In-memory adapter for tests. `raw` can be preset to simulate malformed or old data; `failSaves` simulates a full quota. */
export function createMemoryAdapter(opts: { raw?: string | null; failSaves?: 'quota' | 'unavailable' } = {}) {
  let raw: string | null = opts.raw ?? null;
  const listeners = new Set<() => void>();
  const adapter: StorageAdapter & { raw: () => string | null; setRaw: (v: string | null) => void; key: string } = {
    key: STORAGE_KEY,
    load: () => unwrap(raw),
    save: (state: DemoState) => {
      if (opts.failSaves) return { kind: 'failed', reason: opts.failSaves };
      raw = wrap(state, new Date().toISOString());
      return { kind: 'ok' };
    },
    clear: () => {
      raw = null;
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    raw: () => raw,
    /** Simulate another tab writing. */
    setRaw: (v) => {
      raw = v;
      listeners.forEach((l) => l());
    },
  };
  return adapter;
}
