import { categoryLabel } from '@/data/categories';
import { formatBudgetRange, formatDate } from '@/lib/format';
import type { Budget, ContractorProfile, MaterialResponsibility, Project, PropertyType, StartPreference, VerificationStatus, Weekday } from '@/domain/types';

export const propertyTypeLabel: Record<PropertyType, string> = {
  apartment: 'Apartment',
  independent_house: 'Independent house',
  commercial: 'Commercial space',
  industrial: 'Industrial / warehouse',
  plot: 'Open plot',
  other: 'Other',
};

export const startPreferenceLabel: Record<StartPreference, string> = {
  asap: 'As soon as possible',
  within_month: 'Within a month',
  flexible: 'Flexible',
  specific_date: 'On a specific date',
};

export const materialLabel: Record<MaterialResponsibility, string> = {
  contractor: 'Contractor supplies materials',
  owner: 'Owner supplies materials',
  shared: 'Shared (agreed per item)',
};

export const weekdayLabel: Record<Weekday, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

export const availabilityLabel: Record<ContractorProfile['availability']['status'], string> = {
  available: 'Taking new work',
  limited: 'Limited availability',
  unavailable: 'Not taking new work',
};

export const verificationLabel: Record<VerificationStatus, string> = {
  sample_demo: 'Sample verification · demo data',
  pending_demo: 'Entered by you · not checked (demo)',
  not_submitted: 'Not submitted',
};

export function budgetLabel(b: Budget): string {
  return b.kind === 'range' ? formatBudgetRange(b.minPaise, b.maxPaise) : 'Budget not disclosed';
}

export function startLabel(p: Pick<Project, 'startPreference' | 'targetStartDate'>): string {
  if (!p.startPreference) return 'Not specified';
  if (p.startPreference === 'specific_date' && p.targetStartDate) return `From ${formatDate(p.targetStartDate)}`;
  return startPreferenceLabel[p.startPreference];
}

export function durationLabel(p: Pick<Project, 'durationEstimate'>): string {
  if (!p.durationEstimate) return 'Not specified';
  const { value, unit } = p.durationEstimate;
  return `${value} ${value === 1 ? unit.slice(0, -1) : unit}`;
}

export function siteVisitLabel(p: Pick<Project, 'siteVisit'>): string {
  if (!p.siteVisit.days.length) return 'Not specified';
  return `${p.siteVisit.days.map((d) => weekdayLabel[d]).join(', ')} · ${p.siteVisit.window}`;
}

export function projectCategoryLabel(p: Pick<Project, 'category'>): string {
  return p.category ? categoryLabel(p.category) : 'No category yet';
}

export function locationLabel(p: Pick<Project, 'location'>): string {
  const parts = [p.location.locality, p.location.city].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Location not set';
}
