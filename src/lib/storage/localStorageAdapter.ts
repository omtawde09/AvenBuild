import type { DemoState } from '@/domain/types';
import type { LoadResult, SaveResult, StorageAdapter } from './adapter';
import { CORRUPT_BACKUP_KEY, LEGACY_STORAGE_KEY, STORAGE_KEY, unwrap, wrap } from './envelope';

function isQuotaError(e: unknown): boolean {
  return e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22);
}

/** Versioned localStorage persistence. The only module in the app that touches localStorage. */
export function createLocalStorageAdapter(getStorage: () => Storage | null = () => (typeof window === 'undefined' ? null : window.localStorage)): StorageAdapter {
  const storage = (): Storage | null => {
    try {
      return getStorage();
    } catch {
      return null; // e.g. access denied by browser privacy settings
    }
  };

  return {
    load(): LoadResult {
      const s = storage();
      if (!s) return { kind: 'recovered', reason: 'unavailable', detail: 'This browser is blocking local storage.' };
      let raw: string | null;
      let fromLegacy = false;
      try {
        raw = s.getItem(STORAGE_KEY);
        if (raw === null) {
          raw = s.getItem(LEGACY_STORAGE_KEY);
          fromLegacy = raw !== null;
        }
      } catch {
        return { kind: 'recovered', reason: 'unavailable', detail: 'Local storage could not be read.' };
      }
      const result = unwrap(raw);
      if (fromLegacy && result.kind === 'ok' && raw !== null) {
        // Move data saved under the pre-rename key to the current key (best effort).
        try {
          s.setItem(STORAGE_KEY, raw);
          s.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          // The next successful save completes the move.
        }
      }
      if (result.kind === 'recovered' && raw !== null) {
        try {
          s.setItem(CORRUPT_BACKUP_KEY, raw);
        } catch {
          // Best effort only: the backup is a debugging aid.
        }
      }
      return result;
    },

    save(state: DemoState): SaveResult {
      const s = storage();
      if (!s) return { kind: 'failed', reason: 'unavailable' };
      try {
        s.setItem(STORAGE_KEY, wrap(state, new Date().toISOString()));
        s.removeItem(LEGACY_STORAGE_KEY);
        return { kind: 'ok' };
      } catch (e) {
        return { kind: 'failed', reason: isQuotaError(e) ? 'quota' : 'unavailable' };
      }
    },

    clear(): void {
      const s = storage();
      try {
        s?.removeItem(STORAGE_KEY);
        s?.removeItem(LEGACY_STORAGE_KEY);
        s?.removeItem(CORRUPT_BACKUP_KEY);
      } catch {
        // Nothing else to do; the next save overwrites the key.
      }
    },

    subscribe(onExternalChange) {
      if (typeof window === 'undefined') return () => undefined;
      const handler = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY || e.key === null) onExternalChange();
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}
