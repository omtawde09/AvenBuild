import { buildSeed } from '@/data/seed';
import { sequentialIdFactory, type UserId } from '@/domain/ids';
import type { CommandContext, CommandResult } from '@/domain/tx';
import type { DemoState } from '@/domain/types';

export const TEST_ANCHOR = '2026-10-20';
/** Fixed "now": 10:00 local on the anchor day. */
export const TEST_NOW = new Date(2026, 9, 20, 10, 0, 0);

export function seed(): DemoState {
  return buildSeed(TEST_ANCHOR);
}

let ids = sequentialIdFactory();
export function resetIds() {
  ids = sequentialIdFactory();
}

export function ctx(actorId: UserId, now: Date = TEST_NOW): CommandContext {
  const pad = (n: number) => String(n).padStart(2, '0');
  return { actorId, now: now.toISOString(), today: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, newId: (p) => ids(p) };
}

/** Unwrap a successful command result or fail the test with the domain error. */
export function expectOk<V>(r: CommandResult<V>): { state: DemoState; value: V } {
  if (!r.ok) throw new Error(`Expected success, got ${r.error.code}: ${r.error.message} ${JSON.stringify(r.error.fieldErrors ?? {})}`);
  return r.value;
}

export function expectFail<V>(r: CommandResult<V>, code?: string) {
  if (r.ok) throw new Error('Expected failure, got success');
  if (code) expect(r.error.code).toBe(code);
  return r.error;
}
