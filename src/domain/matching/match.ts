import { categoryLabel } from '@/data/categories';
import type { ContractorProfile, ISODate, Project } from '../types';

export type MatchReasonKind = 'service' | 'area' | 'locality' | 'budget' | 'timing' | 'invited';

export interface MatchReason {
  kind: MatchReasonKind;
  label: string;
}

export interface MatchResult {
  /** True when the project should appear in this contractor's lead feed. */
  eligible: boolean;
  reasons: MatchReason[];
  misses: MatchReason[];
}

/** Projects accept contractor responses only in these states. */
export function isOpenForQuotes(project: Pick<Project, 'status'>): boolean {
  return project.status === 'open' || project.status === 'reviewing';
}

const norm = (s: string) => s.trim().toLowerCase();

export function servesCity(profile: ContractorProfile, city: string): boolean {
  return profile.serviceAreas.some((a) => norm(a.city) === norm(city));
}

/**
 * Explainable, deterministic matching. Required: project open for quotes, category in the contractor's
 * services, city in their service areas, and a listed profile. Budget and timing fit are informational.
 */
export function matchProject(profile: ContractorProfile, project: Project, opts: { invited?: boolean; today?: ISODate } = {}): MatchResult {
  const reasons: MatchReason[] = [];
  const misses: MatchReason[] = [];
  const open = isOpenForQuotes(project);

  const serviceOk = project.category !== null && profile.services.includes(project.category);
  if (project.category) {
    (serviceOk ? reasons : misses).push({
      kind: 'service',
      label: serviceOk ? `Service match: ${categoryLabel(project.category)}` : `You don’t list ${categoryLabel(project.category)}`,
    });
  }

  const area = profile.serviceAreas.find((a) => norm(a.city) === norm(project.location.city));
  if (area) {
    const localityHit = area.localities.some((l) => norm(l) === norm(project.location.locality));
    reasons.push({
      kind: localityHit ? 'locality' : 'area',
      label: localityHit ? `Service area: ${area.city} · ${project.location.locality}` : `Service area: ${area.city}`,
    });
  } else if (project.location.city) {
    misses.push({ kind: 'area', label: `Outside your service areas (${project.location.city})` });
  }

  if (project.budget.kind === 'range') {
    const fits = project.budget.maxPaise >= profile.typicalProjectRange.minPaise && project.budget.minPaise <= profile.typicalProjectRange.maxPaise;
    (fits ? reasons : misses).push({ kind: 'budget', label: fits ? 'Budget fits your typical range' : 'Budget outside your typical range' });
  }

  const start = project.startPreference === 'specific_date' ? project.targetStartDate : null;
  if (start) {
    const fits = profile.availability.status !== 'unavailable' && profile.availability.availableFrom <= start;
    (fits ? reasons : misses).push({ kind: 'timing', label: fits ? 'Start date fits your availability' : 'Starts before you’re available' });
  } else if (opts.today && profile.availability.status !== 'unavailable' && profile.availability.availableFrom <= opts.today) {
    reasons.push({ kind: 'timing', label: 'You’re available now' });
  }

  if (opts.invited) reasons.push({ kind: 'invited', label: 'The owner invited you to quote' });

  const eligible = open && serviceOk && Boolean(area) && profile.visibility === 'listed';
  return { eligible, reasons, misses };
}
