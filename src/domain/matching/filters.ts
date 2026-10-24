import { categoryLabel, type ServiceCategoryId } from '@/data/categories';
import type { UserId } from '../ids';
import { addDays } from '../time';
import type { ContractorProfile, DemoState, ISODate, Project, Review } from '../types';
import { aggregateReviews, type ReviewAggregate } from '../reviews/aggregate';
import { isOpenForQuotes, matchProject, servesCity, type MatchResult } from './match';
import { isLiveQuote } from '../quotes/status';
import { invitationKey, leadKey } from '../types';

// ── Lead feed ─────────────────────────────────────────────────────────────────

export const BUDGET_BANDS = [
  { value: 'lt_1l', label: 'Under ₹1 lakh', min: 0, max: 1_00_000_00 },
  { value: '1l_5l', label: '₹1–5 lakh', min: 1_00_000_00, max: 5_00_000_00 },
  { value: '5l_25l', label: '₹5–25 lakh', min: 5_00_000_00, max: 25_00_000_00 },
  { value: 'gt_25l', label: 'Over ₹25 lakh', min: 25_00_000_00, max: Number.MAX_SAFE_INTEGER },
] as const;
export type BudgetBand = (typeof BUDGET_BANDS)[number]['value'];

export type LeadView = 'matched' | 'saved' | 'ignored';
export type LeadSort = 'newest' | 'start_soonest' | 'budget_high' | 'budget_low' | 'fewest_quotes';

export interface LeadFilters {
  view: LeadView;
  query: string;
  category: ServiceCategoryId | '';
  city: string;
  budget: BudgetBand | '';
  startWithinDays: 0 | 30 | 60 | 90;
  sort: LeadSort;
}

export const defaultLeadFilters: LeadFilters = { view: 'matched', query: '', category: '', city: '', budget: '', startWithinDays: 0, sort: 'newest' };

export interface LeadRow {
  project: Project;
  match: MatchResult;
  disposition: 'saved' | 'ignored' | null;
  invited: boolean;
  quoteCount: number;
  /** Earliest date work could start, used for timing filters/sorting. */
  startDate: ISODate | null;
}

export function projectStartDate(p: Project, today: ISODate): ISODate | null {
  switch (p.startPreference) {
    case 'specific_date':
      return p.targetStartDate;
    case 'asap':
      return today;
    case 'within_month':
      return addDays(today, 30);
    default:
      return null;
  }
}

function budgetOverlaps(p: Project, band: BudgetBand): boolean {
  if (p.budget.kind !== 'range') return false;
  const b = BUDGET_BANDS.find((x) => x.value === band);
  if (!b) return true;
  return p.budget.maxPaise >= b.min && p.budget.minPaise < b.max;
}

const includesText = (hay: string, needle: string) => hay.toLowerCase().includes(needle.trim().toLowerCase());

/** All projects relevant to a contractor's feed, before view/filters: eligible matches plus saved/ignored ones. */
export function buildLeadRows(state: DemoState, contractorId: UserId, today: ISODate): LeadRow[] {
  const profile = state.contractorProfiles[contractorId];
  if (!profile) return [];
  const quoteCounts = new Map<string, number>();
  for (const q of Object.values(state.quotes)) if (isLiveQuote(q)) quoteCounts.set(q.projectId, (quoteCounts.get(q.projectId) ?? 0) + 1);

  const rows: LeadRow[] = [];
  for (const project of Object.values(state.projects)) {
    if (!isOpenForQuotes(project)) continue;
    const invited = Boolean(state.invitations[invitationKey(contractorId, project.id)]);
    const match = matchProject(profile, project, { invited, today });
    if (!match.eligible && !invited) continue;
    rows.push({
      project,
      match,
      disposition: state.leadStates[leadKey(contractorId, project.id)]?.disposition ?? null,
      invited,
      quoteCount: quoteCounts.get(project.id) ?? 0,
      startDate: projectStartDate(project, today),
    });
  }
  return rows;
}

export function filterLeads(rows: LeadRow[], f: LeadFilters, today: ISODate): LeadRow[] {
  const out = rows.filter((r) => {
    if (f.view === 'saved' && r.disposition !== 'saved') return false;
    if (f.view === 'ignored' && r.disposition !== 'ignored') return false;
    if (f.view === 'matched' && r.disposition === 'ignored') return false;
    if (f.category && r.project.category !== f.category) return false;
    if (f.city && r.project.location.city !== f.city) return false;
    if (f.budget && !budgetOverlaps(r.project, f.budget)) return false;
    if (f.startWithinDays) {
      if (!r.startDate || r.startDate > addDays(today, f.startWithinDays)) return false;
    }
    if (f.query.trim()) {
      const p = r.project;
      const hay = [p.title, p.scope, p.location.locality, p.location.city, p.category ? categoryLabel(p.category) : ''].join(' ');
      if (!includesText(hay, f.query)) return false;
    }
    return true;
  });
  const budgetMid = (p: Project) => (p.budget.kind === 'range' ? (p.budget.minPaise + p.budget.maxPaise) / 2 : -1);
  const sorters: Record<LeadSort, (a: LeadRow, b: LeadRow) => number> = {
    newest: (a, b) => (b.project.publishedAt ?? '').localeCompare(a.project.publishedAt ?? ''),
    start_soonest: (a, b) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999'),
    budget_high: (a, b) => budgetMid(b.project) - budgetMid(a.project),
    budget_low: (a, b) => {
      const am = budgetMid(a.project);
      const bm = budgetMid(b.project);
      return (am < 0 ? Infinity : am) - (bm < 0 ? Infinity : bm);
    },
    fewest_quotes: (a, b) => a.quoteCount - b.quoteCount,
  };
  // Stable tiebreak on id keeps ordering deterministic.
  return out.sort((a, b) => sorters[f.sort](a, b) || a.project.id.localeCompare(b.project.id));
}

// ── Contractor discovery ──────────────────────────────────────────────────────

export type DiscoverySort = 'rating' | 'reviews' | 'experience' | 'name';

export interface DiscoveryFilters {
  query: string;
  category: ServiceCategoryId | '';
  city: string;
  minRating: 0 | 3 | 4 | 4.5;
  minYears: 0 | 5 | 10;
  availableOnly: boolean;
  withPortfolio: boolean;
  sort: DiscoverySort;
}

export const defaultDiscoveryFilters: DiscoveryFilters = {
  query: '',
  category: '',
  city: '',
  minRating: 0,
  minYears: 0,
  availableOnly: false,
  withPortfolio: false,
  sort: 'rating',
};

export interface ContractorRow {
  profile: ContractorProfile;
  rating: ReviewAggregate;
  portfolioCount: number;
}

export function buildContractorRows(state: DemoState): ContractorRow[] {
  const reviewsBy = new Map<string, Review[]>();
  for (const r of Object.values(state.reviews)) reviewsBy.set(r.contractorId, [...(reviewsBy.get(r.contractorId) ?? []), r]);
  const portfolioBy = new Map<string, number>();
  for (const p of Object.values(state.portfolio)) portfolioBy.set(p.contractorId, (portfolioBy.get(p.contractorId) ?? 0) + 1);
  return Object.values(state.contractorProfiles)
    .filter((p) => p.visibility === 'listed')
    .map((profile) => ({
      profile,
      rating: aggregateReviews(reviewsBy.get(profile.userId) ?? []),
      portfolioCount: portfolioBy.get(profile.userId) ?? 0,
    }));
}

export function filterContractors(rows: ContractorRow[], f: DiscoveryFilters, today: ISODate): ContractorRow[] {
  const out = rows.filter(({ profile, rating, portfolioCount }) => {
    if (f.category && !profile.services.includes(f.category)) return false;
    if (f.city && !servesCity(profile, f.city)) return false;
    if (f.minRating && (rating.count === 0 || rating.average < f.minRating)) return false;
    if (f.minYears && profile.yearsExperience < f.minYears) return false;
    if (f.availableOnly && (profile.availability.status === 'unavailable' || profile.availability.availableFrom > addDays(today, 14))) return false;
    if (f.withPortfolio && portfolioCount === 0) return false;
    if (f.query.trim()) {
      const hay = [profile.businessName, profile.bio, ...profile.services.map(categoryLabel), ...profile.serviceAreas.flatMap((a) => [a.city, ...a.localities])].join(' ');
      if (!includesText(hay, f.query)) return false;
    }
    return true;
  });
  const sorters: Record<DiscoverySort, (a: ContractorRow, b: ContractorRow) => number> = {
    rating: (a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count,
    reviews: (a, b) => b.rating.count - a.rating.count || b.rating.average - a.rating.average,
    experience: (a, b) => b.profile.yearsExperience - a.profile.yearsExperience,
    name: (a, b) => a.profile.businessName.localeCompare(b.profile.businessName),
  };
  return out.sort((a, b) => sorters[f.sort](a, b) || a.profile.userId.localeCompare(b.profile.userId));
}

/** Distinct cities that appear in projects and service areas, sorted. */
export function knownCities(state: DemoState): string[] {
  const set = new Set<string>();
  for (const p of Object.values(state.contractorProfiles)) for (const a of p.serviceAreas) set.add(a.city);
  for (const p of Object.values(state.projects)) if (p.location.city) set.add(p.location.city);
  return [...set].sort();
}
