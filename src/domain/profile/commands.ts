import { SERVICE_CATEGORY_IDS } from '@/data/categories';
import type { PortfolioItemId } from '../ids';
import { fail } from '../result';
import { isISODate } from '../time';
import { forbidden, notFound, Tx, type CommandContext, type CommandResult } from '../tx';
import type { ContractorProfile, DemoState, OwnerSettings, PortfolioItem, User, VerificationStatus } from '../types';

export type ContractorProfileInput = Omit<ContractorProfile, 'userId' | 'isSeed' | 'updatedAt' | 'responseTimeSampleHours' | 'qualifications'> & {
  qualifications: { licenceNumber: string; gstNumber: string };
};

/** A user-entered licence/GST value is never "verified": it is pending (demo) or not submitted. */
function statusFor(previousValue: string, previousStatus: VerificationStatus, nextValue: string): VerificationStatus {
  const v = nextValue.trim();
  if (!v) return 'not_submitted';
  if (v === previousValue.trim() && previousStatus === 'sample_demo') return 'sample_demo';
  return 'pending_demo';
}

export function validateContractorProfile(p: ContractorProfileInput, today: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (p.businessName.trim().length < 3 || p.businessName.trim().length > 80) e.businessName = 'Business name must be 3–80 characters.';
  if (p.contactName.trim().length < 2 || p.contactName.trim().length > 60) e.contactName = 'Contact name must be 2–60 characters.';
  if (p.bio.trim().length < 30 || p.bio.trim().length > 1200) e.bio = 'Write 30–1200 characters about your business.';
  if (!p.services.length) e.services = 'Choose at least one service.';
  if (p.services.some((s) => !SERVICE_CATEGORY_IDS.includes(s))) e.services = 'Unknown service.';
  if (!p.serviceAreas.length) e.serviceAreas = 'Add at least one city you serve.';
  if (p.serviceAreas.some((a) => !a.city.trim())) e.serviceAreas = 'Every service area needs a city.';
  if (new Set(p.serviceAreas.map((a) => a.city.trim().toLowerCase())).size !== p.serviceAreas.length) e.serviceAreas = 'Each city should appear only once.';
  if (!Number.isInteger(p.yearsExperience) || p.yearsExperience < 0 || p.yearsExperience > 70) e.yearsExperience = 'Enter whole years from 0 to 70.';
  if (!Number.isInteger(p.teamSize) || p.teamSize < 1 || p.teamSize > 5000) e.teamSize = 'Team size must be a whole number from 1.';
  if (!isISODate(p.availability.availableFrom)) e['availability.availableFrom'] = 'Choose a valid date.';
  if (p.typicalProjectRange.minPaise <= 0) e['typicalProjectRange.minPaise'] = 'Enter a minimum above ₹0.';
  if (p.typicalProjectRange.maxPaise < p.typicalProjectRange.minPaise) e['typicalProjectRange.maxPaise'] = 'Maximum must be at least the minimum.';
  if (p.contactPreferences.preferredHours.trim().length > 60) e['contactPreferences.preferredHours'] = 'At most 60 characters.';
  if (p.qualifications.licenceNumber.trim().length > 40) e['qualifications.licenceNumber'] = 'At most 40 characters.';
  const gst = p.qualifications.gstNumber.trim().toUpperCase();
  if (gst && !/^[0-9A-Z]{15}$/.test(gst)) e['qualifications.gstNumber'] = 'A GSTIN has 15 letters and digits (sample format only — it won’t be checked).';
  const d = p.quoteDefaults;
  if (!Number.isInteger(d.validityDays) || d.validityDays < 1 || d.validityDays > 180) e['quoteDefaults.validityDays'] = 'Validity must be 1–180 days.';
  if (!Number.isFinite(d.taxPercent) || d.taxPercent < 0 || d.taxPercent > 28) e['quoteDefaults.taxPercent'] = 'Tax must be 0–28%.';
  void today;
  return e;
}

export function updateContractorProfile(state: DemoState, input: ContractorProfileInput, ctx: CommandContext): CommandResult {
  const current = state.contractorProfiles[ctx.actorId];
  if (!current) return forbidden('Only contractors have a business profile.');
  const errors = validateContractorProfile(input, ctx.today);
  if (Object.keys(errors).length) return fail('VALIDATION', 'Some profile details need attention.', errors);
  const q = current.qualifications;
  const next: ContractorProfile = {
    ...current,
    ...input,
    businessName: input.businessName.trim(),
    contactName: input.contactName.trim(),
    bio: input.bio.trim(),
    serviceAreas: input.serviceAreas.map((a) => ({ city: a.city.trim(), localities: a.localities.map((l) => l.trim()).filter(Boolean) })),
    qualifications: {
      licenceNumber: input.qualifications.licenceNumber.trim(),
      licenceStatus: statusFor(q.licenceNumber, q.licenceStatus, input.qualifications.licenceNumber),
      gstNumber: input.qualifications.gstNumber.trim().toUpperCase(),
      gstStatus: statusFor(q.gstNumber, q.gstStatus, input.qualifications.gstNumber),
    },
    updatedAt: ctx.now,
  };
  const tx = new Tx(state, ctx);
  tx.put('contractorProfiles', ctx.actorId, next);
  return tx.done(undefined);
}

export type OwnerSettingsInput = Pick<User, 'displayName' | 'city' | 'locality'> & Omit<OwnerSettings, 'userId'>;

export function updateOwnerSettings(state: DemoState, input: OwnerSettingsInput, ctx: CommandContext): CommandResult {
  const user = state.users[ctx.actorId];
  if (!user || user.role !== 'owner') return forbidden('Only owners have these settings.');
  const e: Record<string, string> = {};
  if (input.displayName.trim().length < 2 || input.displayName.trim().length > 60) e.displayName = 'Name must be 2–60 characters.';
  if (!input.city.trim()) e.city = 'Choose your city.';
  if (input.locality.trim().length > 60) e.locality = 'At most 60 characters.';
  if (Object.keys(e).length) return fail('VALIDATION', 'Some settings need attention.', e);
  const tx = new Tx(state, ctx);
  tx.put('users', user.id, { ...user, displayName: input.displayName.trim(), city: input.city.trim(), locality: input.locality.trim() });
  tx.put('ownerSettings', user.id, { userId: user.id, contactPreference: input.contactPreference, notificationPrefs: input.notificationPrefs });
  return tx.done(undefined);
}

export type PortfolioInput = Pick<PortfolioItem, 'title' | 'category' | 'description' | 'approxValue' | 'completedOn' | 'city' | 'images'>;

export function validatePortfolio(p: PortfolioInput, today: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (p.title.trim().length < 5 || p.title.trim().length > 90) e.title = 'Title must be 5–90 characters.';
  if (p.description.trim().length < 20 || p.description.trim().length > 800) e.description = 'Describe the work in 20–800 characters.';
  if (!SERVICE_CATEGORY_IDS.includes(p.category)) e.category = 'Choose a category.';
  if (!p.city.trim()) e.city = 'Enter the city.';
  if (!isISODate(p.completedOn)) e.completedOn = 'Choose the completion date.';
  else if (p.completedOn > today) e.completedOn = 'Completion date can’t be in the future.';
  if (p.approxValue && (p.approxValue.minPaise <= 0 || p.approxValue.maxPaise < p.approxValue.minPaise)) e.approxValue = 'Enter a valid value range.';
  if (p.images.length > 6) e.images = 'Add at most 6 images.';
  return e;
}

export function savePortfolioItem(state: DemoState, id: PortfolioItemId | null, input: PortfolioInput, ctx: CommandContext): CommandResult<PortfolioItemId> {
  if (!state.contractorProfiles[ctx.actorId]) return forbidden('Only contractors have a portfolio.');
  const errors = validatePortfolio(input, ctx.today);
  if (Object.keys(errors).length) return fail('VALIDATION', 'Check the portfolio entry.', errors);
  const tx = new Tx(state, ctx);
  if (id) {
    const existing = state.portfolio[id];
    if (!existing) return notFound('portfolio entry');
    if (existing.contractorId !== ctx.actorId) return forbidden('That entry belongs to someone else.');
    tx.put('portfolio', id, { ...existing, ...input, title: input.title.trim(), description: input.description.trim() });
    return tx.done(id);
  }
  const newId = tx.id<PortfolioItemId>('pf');
  tx.put('portfolio', newId, { id: newId, contractorId: ctx.actorId, ...input, title: input.title.trim(), description: input.description.trim(), isSeed: false });
  return tx.done(newId);
}

export function removePortfolioItem(state: DemoState, id: PortfolioItemId, ctx: CommandContext): CommandResult<PortfolioItem> {
  const existing = state.portfolio[id];
  if (!existing) return notFound('portfolio entry');
  if (existing.contractorId !== ctx.actorId) return forbidden('That entry belongs to someone else.');
  const tx = new Tx(state, ctx);
  tx.remove('portfolio', id);
  return tx.done(existing);
}

export function restorePortfolioItem(state: DemoState, item: PortfolioItem, ctx: CommandContext): CommandResult {
  if (item.contractorId !== ctx.actorId) return forbidden('That entry belongs to someone else.');
  const tx = new Tx(state, ctx);
  tx.put('portfolio', item.id, item);
  return tx.done(undefined);
}

/** Share of profile parts filled in (definition shown in the UI). */
export function portfolioCompleteness(state: DemoState, profile: ContractorProfile): { percent: number; missing: string[] } {
  const items = Object.values(state.portfolio).filter((p) => p.contractorId === profile.userId);
  const checks: Array<[boolean, string]> = [
    [profile.bio.trim().length >= 30, 'A business description'],
    [profile.services.length > 0, 'At least one service'],
    [profile.serviceAreas.length > 0, 'At least one service area'],
    [items.length >= 3, 'Three or more portfolio entries'],
    [items.some((i) => i.images.length > 0), 'A portfolio entry with photos'],
  ];
  const done = checks.filter(([ok]) => ok).length;
  return { percent: Math.round((done / checks.length) * 100), missing: checks.filter(([ok]) => !ok).map(([, label]) => label) };
}
