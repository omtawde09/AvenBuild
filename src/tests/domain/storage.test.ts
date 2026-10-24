import { buildSeed } from '@/data/seed';
import { CONTRACTOR_PERSONA_ID, OWNER_PERSONA_ID } from '@/data/personas';
import { P } from '@/data/seed/ids';
import { sequentialIdFactory } from '@/domain/ids';
import { updateDraft } from '@/domain/projects/commands';
import { initDemoStore, useDemoStore } from '@/app/store/demoStore';
import { CORRUPT_BACKUP_KEY, LEGACY_STORAGE_KEY, STORAGE_KEY, unwrap, wrap } from '@/lib/storage/envelope';
import { createLocalStorageAdapter } from '@/lib/storage/localStorageAdapter';
import { createMemoryAdapter } from '@/lib/storage/memoryAdapter';
import { demoStateSchema } from '@/lib/validation/demoState';
import { TEST_ANCHOR, TEST_NOW } from '../helpers';

const clock = () => TEST_NOW;

describe('seed', () => {
  it('is deterministic and valid against the persisted-state schema', () => {
    const a = buildSeed(TEST_ANCHOR);
    const b = buildSeed(TEST_ANCHOR);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(demoStateSchema.safeParse(a).success).toBe(true);
    expect(unwrap(wrap(a, 'now')).kind).toBe('ok');
  });

  it('fills every main view and contains no real-looking contact data', () => {
    const s = buildSeed(TEST_ANCHOR);
    expect(Object.keys(s.projects).length).toBeGreaterThanOrEqual(10);
    expect(Object.keys(s.contractorProfiles).length).toBeGreaterThanOrEqual(8);
    const strings: string[] = [];
    const walk = (v: unknown): void => {
      if (typeof v === 'string') strings.push(v);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(s);
    for (const text of strings) {
      expect(text).not.toMatch(/\+91|@[a-z]+\.(com|in)\b|\b[6-9]\d{9}\b/);
      expect(text.toLowerCase()).not.toBe('verified');
    }
    for (const p of Object.values(s.contractorProfiles)) {
      expect(['sample_demo', 'not_submitted']).toContain(p.qualifications.gstStatus);
      if (p.qualifications.gstNumber) expect(p.qualifications.gstNumber).toMatch(/DEMO/);
    }
  });
});

describe('storage envelope recovery', () => {
  it('recovers from malformed JSON, invalid shape, invalid data and unknown versions', () => {
    expect(unwrap(null).kind).toBe('empty');
    expect(unwrap('{not json')).toMatchObject({ kind: 'recovered', reason: 'malformed' });
    expect(unwrap('[1,2]')).toMatchObject({ kind: 'recovered', reason: 'invalid' });
    expect(unwrap(JSON.stringify({ schemaVersion: 99, data: {} }))).toMatchObject({ kind: 'recovered', reason: 'unknown_version' });
    expect(unwrap(JSON.stringify({ schemaVersion: 0, data: {} }))).toMatchObject({ kind: 'recovered', reason: 'unknown_version' });
    const seed = buildSeed(TEST_ANCHOR);
    const broken = { ...seed, projects: { ...seed.projects, [P.terrace]: { ...seed.projects[P.terrace], status: 'teleported' } } };
    expect(unwrap(JSON.stringify({ schemaVersion: 1, savedAt: '', data: broken }))).toMatchObject({ kind: 'recovered', reason: 'invalid' });
    const orphan = { ...seed, quotes: { ...seed.quotes, qt_x: { ...Object.values(seed.quotes)[0], id: 'qt_x', projectId: 'prj_missing' } } };
    expect(unwrap(JSON.stringify({ schemaVersion: 1, savedAt: '', data: orphan }))).toMatchObject({ kind: 'recovered', reason: 'invalid' });
  });

  it('carries demo data over from the pre-rename storage key, then retires it', () => {
    window.localStorage.setItem(LEGACY_STORAGE_KEY, wrap(buildSeed(TEST_ANCHOR), 'before rename'));
    const adapter = createLocalStorageAdapter();
    const loaded = adapter.load();
    expect(loaded.kind).toBe('ok');
    // Moved on load, before any save.
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it('localStorage adapter backs up corrupt data and reports quota failures without throwing', () => {
    window.localStorage.setItem(STORAGE_KEY, '{oops');
    const adapter = createLocalStorageAdapter();
    expect(adapter.load()).toMatchObject({ kind: 'recovered', reason: 'malformed' });
    expect(window.localStorage.getItem(CORRUPT_BACKUP_KEY)).toBe('{oops');

    const full = createLocalStorageAdapter(() => ({
      ...window.localStorage,
      getItem: () => null,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
      removeItem: () => undefined,
    }) as unknown as Storage);
    expect(full.save(buildSeed(TEST_ANCHOR))).toEqual({ kind: 'failed', reason: 'quota' });

    const blocked = createLocalStorageAdapter(() => {
      throw new Error('denied');
    });
    expect(blocked.load()).toMatchObject({ kind: 'recovered', reason: 'unavailable' });
    expect(blocked.save(buildSeed(TEST_ANCHOR))).toEqual({ kind: 'failed', reason: 'unavailable' });
  });
});

describe('store persistence', () => {
  it('loads the seed on first run, persists changes and survives a reload', () => {
    const adapter = createMemoryAdapter();
    initDemoStore({ adapter, clock, newId: sequentialIdFactory() });
    expect(useDemoStore.getState().notices).toEqual([]);
    useDemoStore.getState().setPersona(OWNER_PERSONA_ID);
    const r = useDemoStore.getState().run((s, c) => updateDraft(s, P.compound, { title: 'Compound wall, 5 ft, with gate' }, 3, c));
    expect(r.ok).toBe(true);
    // "Refresh": a new store instance reading the same storage.
    initDemoStore({ adapter, clock });
    expect(useDemoStore.getState().data.projects[P.compound]!.title).toBe('Compound wall, 5 ft, with gate');
    expect(useDemoStore.getState().data.meta.activePersonaId).toBe(OWNER_PERSONA_ID);
  });

  it('recovers to the seed with a notice when stored data is malformed', () => {
    const adapter = createMemoryAdapter({ raw: '{"schemaVersion":1,"data":{"meta":' });
    initDemoStore({ adapter, clock });
    const { data, notices } = useDemoStore.getState();
    expect(data.projects[P.terrace]).toBeDefined();
    expect(notices[0]?.id).toBe('recovered');
    expect(adapter.load().kind).toBe('ok'); // seed was written back
  });

  it('keeps working in memory and warns when saving fails', () => {
    const adapter = createMemoryAdapter({ failSaves: 'quota' });
    initDemoStore({ adapter, clock });
    useDemoStore.getState().setPersona(OWNER_PERSONA_ID);
    const r = useDemoStore.getState().run((s, c) => updateDraft(s, P.compound, { title: 'Still editable in memory' }, 1, c));
    expect(r.ok).toBe(true);
    expect(useDemoStore.getState().data.projects[P.compound]!.title).toBe('Still editable in memory');
    expect(useDemoStore.getState().notices.some((n) => n.id === 'save_failed')).toBe(true);
  });

  it('reset restores the exact seed and clears the persona', () => {
    const adapter = createMemoryAdapter();
    initDemoStore({ adapter, clock });
    useDemoStore.getState().setPersona(OWNER_PERSONA_ID);
    useDemoStore.getState().run((s, c) => updateDraft(s, P.compound, { title: 'Changed before reset' }, 1, c));
    useDemoStore.getState().resetDemo();
    const { data } = useDemoStore.getState();
    expect(data).toEqual(buildSeed(TEST_ANCHOR));
    expect(data.meta.activePersonaId).toBeNull();
  });

  it('refreshes from other tabs but keeps this tab’s persona', () => {
    const adapter = createMemoryAdapter();
    initDemoStore({ adapter, clock });
    useDemoStore.getState().setPersona(OWNER_PERSONA_ID);
    const other = { ...buildSeed(TEST_ANCHOR), meta: { schemaVersion: 1 as const, seedAnchor: TEST_ANCHOR, activePersonaId: CONTRACTOR_PERSONA_ID } };
    other.projects[P.compound] = { ...other.projects[P.compound]!, title: 'Edited in another tab' };
    adapter.setRaw(wrap(other, 'now'));
    expect(useDemoStore.getState().data.projects[P.compound]!.title).toBe('Edited in another tab');
    expect(useDemoStore.getState().data.meta.activePersonaId).toBe(OWNER_PERSONA_ID);
  });

  it('rejects commands when no persona is selected', () => {
    initDemoStore({ adapter: createMemoryAdapter(), clock });
    const r = useDemoStore.getState().run((s, c) => updateDraft(s, P.compound, { title: 'x' }, 1, c));
    expect(r.ok).toBe(false);
  });
});
