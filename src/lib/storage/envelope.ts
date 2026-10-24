import { SCHEMA_VERSION, type DemoState } from '@/domain/types';
import { demoStateSchema, referentialProblem } from '@/lib/validation/demoState';
import type { LoadResult } from './adapter';
import { migrations } from './migrations';

export const STORAGE_KEY = 'evanbuild.demo';
export const CORRUPT_BACKUP_KEY = 'evanbuild.demo.corrupt-backup';

export interface Envelope {
  schemaVersion: number;
  savedAt: string;
  data: unknown;
}

export function wrap(state: DemoState, savedAt: string): string {
  const envelope: Envelope = { schemaVersion: SCHEMA_VERSION, savedAt, data: state };
  return JSON.stringify(envelope);
}

function isEnvelope(v: unknown): v is Envelope {
  return typeof v === 'object' && v !== null && 'schemaVersion' in v && 'data' in v && typeof (v as Envelope).schemaVersion === 'number';
}

/** Parse → check envelope → migrate → validate schema → referential checks. Never throws. */
export function unwrap(raw: string | null): LoadResult {
  if (raw === null) return { kind: 'empty' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: 'recovered', reason: 'malformed', detail: 'Saved data is not valid JSON.' };
  }
  if (!isEnvelope(parsed)) return { kind: 'recovered', reason: 'invalid', detail: 'Saved data has an unexpected format.' };

  let version = parsed.schemaVersion;
  let data = parsed.data;
  if (version > SCHEMA_VERSION) {
    return { kind: 'recovered', reason: 'unknown_version', detail: `Saved data is from a newer version (${version}) of this demo.` };
  }
  while (version < SCHEMA_VERSION) {
    const step = migrations[version];
    if (!step) return { kind: 'recovered', reason: 'unknown_version', detail: `No migration from version ${version}.` };
    try {
      data = step(data);
    } catch (e) {
      return { kind: 'recovered', reason: 'invalid', detail: `Migration from version ${version} failed: ${e instanceof Error ? e.message : 'unknown error'}` };
    }
    version += 1;
  }

  const result = demoStateSchema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    return { kind: 'recovered', reason: 'invalid', detail: `Saved data failed validation${first ? ` at ${first.path.join('.')}: ${first.message}` : ''}.` };
  }
  const problem = referentialProblem(result.data);
  if (problem) return { kind: 'recovered', reason: 'invalid', detail: `Saved data is inconsistent: ${problem}.` };
  return { kind: 'ok', state: result.data };
}
