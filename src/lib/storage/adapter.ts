import type { DemoState } from '@/domain/types';

export type RecoveryReason = 'malformed' | 'invalid' | 'unknown_version' | 'unavailable';

export type LoadResult =
  | { kind: 'ok'; state: DemoState }
  | { kind: 'empty' }
  | { kind: 'recovered'; reason: RecoveryReason; detail: string };

export type SaveResult = { kind: 'ok' } | { kind: 'failed'; reason: 'quota' | 'unavailable' };

/**
 * Persistence seam. The demo uses localStorage; a future API-backed repository implements the same
 * contract (or replaces it with server commands) without touching domain rules or UI.
 * Implementations never throw.
 */
export interface StorageAdapter {
  load(): LoadResult;
  save(state: DemoState): SaveResult;
  clear(): void;
  /** Called when another tab of the same browser profile changes the stored state. */
  subscribe(onExternalChange: () => void): () => void;
}
