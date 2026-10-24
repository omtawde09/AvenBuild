import { P, U } from '@/data/seed/ids';
import { buildContractorRows, buildLeadRows, defaultDiscoveryFilters, defaultLeadFilters, filterContractors, filterLeads } from '@/domain/matching/filters';
import { matchProject } from '@/domain/matching/match';
import { contractorPipeline } from '@/domain/leads/pipeline';
import { aggregateReviews } from '@/domain/reviews/aggregate';
import { updateContractorProfile, type ContractorProfileInput } from '@/domain/profile/commands';
import { ctx, expectOk, resetIds, seed, TEST_ANCHOR } from '../helpers';

beforeEach(() => resetIds());

describe('matching', () => {
  it('requires service, service area and an open project, with written reasons', () => {
    const s = seed();
    const sahyadri = s.contractorProfiles[U.sahyadri]!;
    const terrace = matchProject(sahyadri, s.projects[P.terrace]!, { today: TEST_ANCHOR });
    expect(terrace.eligible).toBe(true);
    expect(terrace.reasons.map((r) => r.label)).toEqual(expect.arrayContaining(['Service match: Waterproofing', 'Service area: Pune · Kothrud']));
    expect(matchProject(sahyadri, s.projects[P.peb]!).eligible).toBe(false); // wrong trade and city
    expect(matchProject(sahyadri, s.projects[P.compound]!).eligible).toBe(false); // draft
    expect(matchProject(sahyadri, s.projects[P.paver]!).eligible).toBe(false); // paused
    expect(matchProject(sahyadri, s.projects[P.leak]!).eligible).toBe(false); // closed
    expect(matchProject({ ...sahyadri, visibility: 'hidden' }, s.projects[P.terrace]!).eligible).toBe(false);
  });

  it('builds the lead feed from real project data and applies view, filters and sort', () => {
    const s = seed();
    const rows = buildLeadRows(s, U.sahyadri, TEST_ANCHOR);
    const ids = (r: typeof rows) => r.map((x) => x.project.id);
    expect(ids(rows)).not.toContain(P.compound);
    expect(ids(rows)).not.toContain(P.peb);

    const matched = filterLeads(rows, defaultLeadFilters, TEST_ANCHOR);
    expect(ids(matched)).not.toContain(P.watertank); // ignored
    expect(ids(matched)[0]).toBe(P.garden); // newest first
    expect(ids(filterLeads(rows, { ...defaultLeadFilters, view: 'ignored' }, TEST_ANCHOR))).toEqual([P.watertank]);
    expect(ids(filterLeads(rows, { ...defaultLeadFilters, view: 'saved' }, TEST_ANCHOR))).toEqual([P.basement]);
    expect(ids(filterLeads(rows, { ...defaultLeadFilters, city: 'Pimpri-Chinchwad' }, TEST_ANCHOR))).toEqual(expect.arrayContaining([P.basement, P.officeTiles]));
    expect(filterLeads(rows, { ...defaultLeadFilters, category: 'rcc' }, TEST_ANCHOR).every((r) => r.project.category === 'rcc')).toBe(true);
    expect(filterLeads(rows, { ...defaultLeadFilters, query: 'garden' }, TEST_ANCHOR)).toHaveLength(1);
    expect(filterLeads(rows, { ...defaultLeadFilters, query: 'no such thing' }, TEST_ANCHOR)).toHaveLength(0);
    const byBudget = filterLeads(rows, { ...defaultLeadFilters, sort: 'budget_high' }, TEST_ANCHOR);
    expect(byBudget[0]!.project.id).toBe(P.staircase);
  });

  it('derives pipeline stages for every seeded engagement', () => {
    const s = seed();
    const stages = Object.fromEntries(contractorPipeline(s, U.sahyadri, TEST_ANCHOR).map((e) => [e.project.id, e.stage]));
    expect(stages).toMatchObject({
      [P.terrace]: 'submitted',
      [P.bathroom]: 'accepted',
      [P.basement]: 'quote_draft',
      [P.staircase]: 'declined',
      [P.leak]: 'closed',
      [P.officeTiles]: 'withdrawn',
      [P.garden]: 'invited',
      [P.watertank]: 'ignored',
    });
  });
});

describe('contractor discovery', () => {
  it('filters and sorts on computed aggregates', () => {
    const s = seed();
    const rows = buildContractorRows(s);
    const names = (r: typeof rows) => r.map((x) => x.profile.userId);
    const pune = filterContractors(rows, { ...defaultDiscoveryFilters, city: 'Pune' }, TEST_ANCHOR);
    expect(names(pune)).not.toContain(U.kaveri);
    const wp = filterContractors(rows, { ...defaultDiscoveryFilters, category: 'waterproofing' }, TEST_ANCHOR);
    expect(names(wp).sort()).toEqual([U.deccan, U.sahyadri, U.ganesh, U.tilecraft].sort());
    const rated = filterContractors(rows, { ...defaultDiscoveryFilters, minRating: 4.5 }, TEST_ANCHOR);
    expect(rated.every((r) => r.rating.average >= 4.5)).toBe(true);
    expect(names(rated)).not.toContain(U.voltline); // no reviews
    const available = filterContractors(rows, { ...defaultDiscoveryFilters, availableOnly: true }, TEST_ANCHOR);
    expect(names(available)).not.toContain(U.kaveri);
    expect(filterContractors(rows, { ...defaultDiscoveryFilters, query: 'zzz' }, TEST_ANCHOR)).toHaveLength(0);
  });

  it('reflects profile edits immediately (adding a city makes the contractor discoverable there)', () => {
    let s = seed();
    const before = filterContractors(buildContractorRows(s), { ...defaultDiscoveryFilters, city: 'Nashik', category: 'waterproofing' }, TEST_ANCHOR);
    expect(before.map((r) => r.profile.userId)).not.toContain(U.sahyadri);
    const p = s.contractorProfiles[U.sahyadri]!;
    const input: ContractorProfileInput = { ...p, serviceAreas: [...p.serviceAreas, { city: 'Nashik', localities: [] }], qualifications: { licenceNumber: p.qualifications.licenceNumber, gstNumber: p.qualifications.gstNumber } };
    s = expectOk(updateContractorProfile(s, input, ctx(U.sahyadri))).state;
    const after = filterContractors(buildContractorRows(s), { ...defaultDiscoveryFilters, city: 'Nashik', category: 'waterproofing' }, TEST_ANCHOR);
    expect(after.map((r) => r.profile.userId)).toContain(U.sahyadri);
    expect(s.contractorProfiles[U.sahyadri]!.qualifications.gstStatus).toBe('sample_demo');
    // Editing the GST number makes it "pending (demo)", never verified.
    s = expectOk(updateContractorProfile(s, { ...input, qualifications: { licenceNumber: '', gstNumber: '27ABCDE1234F1Z5' } }, ctx(U.sahyadri))).state;
    expect(s.contractorProfiles[U.sahyadri]!.qualifications).toMatchObject({ gstStatus: 'pending_demo', licenceStatus: 'not_submitted' });
  });

  it('computes rating aggregates from review records', () => {
    const s = seed();
    const agg = aggregateReviews(Object.values(s.reviews).filter((r) => r.contractorId === U.sahyadri));
    expect(agg.count).toBe(4);
    expect(agg.average).toBe(4.5);
    expect(agg.breakdown).toEqual([0, 0, 0, 2, 2]);
    expect(aggregateReviews([]).average).toBe(0);
  });
});
