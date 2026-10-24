import { z } from 'zod';
import { SERVICE_CATEGORY_IDS } from '@/data/categories';
import { MATERIAL_RESPONSIBILITY, PROPERTY_TYPES, START_PREFERENCES, WEEKDAYS, type AttachmentMeta, type Project } from '@/domain/types';
import type { ProjectDraftInput } from '@/domain/projects/commands';
import { paiseToRupeeInput, parseRupeesToPaise } from '@/domain/money';
import { isISODate } from '@/domain/time';
import { PROJECT_LIMITS } from '@/lib/validation/project';

/** Form values are strings (as typed); they are converted to domain values on save. */
export interface WizardValues {
  category: string;
  title: string;
  propertyType: string;
  scope: string;
  scopeItems: Array<{ value: string }>;
  city: string;
  locality: string;
  landmark: string;
  budgetKind: 'range' | 'undisclosed';
  budgetMin: string;
  budgetMax: string;
  startPreference: string;
  targetStartDate: string;
  durationValue: string;
  durationUnit: 'days' | 'weeks';
  siteDays: string[];
  siteWindow: string;
  material: string;
  accessNotes: string;
  attachments: AttachmentMeta[];
}

export const STEPS = ['Basics', 'Scope', 'Location', 'Budget & timing', 'Site & materials', 'Photos & files', 'Review'] as const;

export const STEP_FIELDS: ReadonlyArray<ReadonlyArray<keyof WizardValues>> = [
  ['category', 'title', 'propertyType'],
  ['scope', 'scopeItems'],
  ['city', 'locality', 'landmark'],
  ['budgetKind', 'budgetMin', 'budgetMax', 'startPreference', 'targetStartDate', 'durationValue', 'durationUnit'],
  ['siteDays', 'siteWindow', 'material', 'accessNotes'],
  ['attachments'],
  [],
];

const L = PROJECT_LIMITS;
const required = (label: string) => z.string().trim().min(1, `${label} is required.`);

export function wizardSchema(today: string) {
  return z
    .object({
      category: z.string().refine((v) => (SERVICE_CATEGORY_IDS as ReadonlyArray<string>).includes(v), 'Choose a service category.'),
      title: z.string().trim().min(L.titleMin, `Title needs at least ${L.titleMin} characters.`).max(L.titleMax, `Title can be at most ${L.titleMax} characters.`),
      propertyType: z.string().refine((v) => (PROPERTY_TYPES as ReadonlyArray<string>).includes(v), 'Choose a property type.'),
      scope: z.string().trim().min(L.scopeMin, `Describe the work in at least ${L.scopeMin} characters so contractors can quote accurately.`).max(L.scopeMax, `At most ${L.scopeMax} characters.`),
      scopeItems: z.array(z.object({ value: z.string().trim().min(1, 'Remove empty items or fill them in.').max(L.scopeItemMax, `At most ${L.scopeItemMax} characters.`) })).max(L.scopeItemsMax, `At most ${L.scopeItemsMax} items.`),
      city: required('City'),
      locality: z.string().trim().min(2, 'Locality is required.').max(L.localityMax, `At most ${L.localityMax} characters.`),
      landmark: z.string().trim().max(80, 'At most 80 characters.'),
      budgetKind: z.enum(['range', 'undisclosed']),
      budgetMin: z.string(),
      budgetMax: z.string(),
      startPreference: z.string().refine((v) => (START_PREFERENCES as ReadonlyArray<string>).includes(v), 'Choose when you’d like work to start.'),
      targetStartDate: z.string(),
      durationValue: z.string().refine((v) => v.trim() === '' || (/^\d{1,3}$/.test(v.trim()) && Number(v) >= 1), 'Enter a whole number, or leave blank.'),
      durationUnit: z.enum(['days', 'weeks']),
      siteDays: z.array(z.string().refine((d) => (WEEKDAYS as ReadonlyArray<string>).includes(d), 'Unknown day.')).min(1, 'Pick at least one day when the site can be visited.'),
      siteWindow: z.string().trim().min(3, 'Add visiting hours, e.g. “10 am – 1 pm”.').max(80, 'At most 80 characters.'),
      material: z.string().refine((v) => (MATERIAL_RESPONSIBILITY as ReadonlyArray<string>).includes(v), 'Say who supplies materials.'),
      accessNotes: z.string().trim().max(L.notesMax, `At most ${L.notesMax} characters.`),
      attachments: z.array(z.custom<AttachmentMeta>()).max(L.attachmentsMax, `At most ${L.attachmentsMax} files.`),
    })
    .superRefine((v, ctx) => {
      if (v.budgetKind === 'range') {
        const min = parseRupeesToPaise(v.budgetMin);
        const max = parseRupeesToPaise(v.budgetMax);
        if (min === null || min <= 0) ctx.addIssue({ code: 'custom', path: ['budgetMin'], message: 'Enter a minimum in rupees, e.g. 120000.' });
        if (max === null || max <= 0) ctx.addIssue({ code: 'custom', path: ['budgetMax'], message: 'Enter a maximum in rupees, e.g. 180000.' });
        else if (max > L.budgetMaxPaise) ctx.addIssue({ code: 'custom', path: ['budgetMax'], message: 'That’s above the ₹100 crore limit.' });
        else if (min !== null && max < min) ctx.addIssue({ code: 'custom', path: ['budgetMax'], message: 'Maximum must be at least the minimum.' });
      }
      if (v.startPreference === 'specific_date') {
        if (!isISODate(v.targetStartDate)) ctx.addIssue({ code: 'custom', path: ['targetStartDate'], message: 'Choose a target start date.' });
        else if (v.targetStartDate < today) ctx.addIssue({ code: 'custom', path: ['targetStartDate'], message: 'Target start date can’t be in the past.' });
      }
    });
}

export function valuesFromProject(p: Project): WizardValues {
  return {
    category: p.category ?? '',
    title: p.title,
    propertyType: p.propertyType ?? '',
    scope: p.scope,
    scopeItems: p.scopeItems.map((value) => ({ value })),
    city: p.location.city,
    locality: p.location.locality,
    landmark: p.location.landmark,
    // A draft saved before the budget step stores "undisclosed" as a placeholder; keep the range default until the owner chooses.
    budgetKind: p.budget.kind === 'undisclosed' && p.status === 'draft' && p.draftStep <= 3 ? 'range' : p.budget.kind,
    budgetMin: p.budget.kind === 'range' ? paiseToRupeeInput(p.budget.minPaise) : '',
    budgetMax: p.budget.kind === 'range' ? paiseToRupeeInput(p.budget.maxPaise) : '',
    startPreference: p.startPreference ?? '',
    targetStartDate: p.targetStartDate ?? '',
    durationValue: p.durationEstimate ? String(p.durationEstimate.value) : '',
    durationUnit: p.durationEstimate?.unit ?? 'days',
    siteDays: [...p.siteVisit.days],
    siteWindow: p.siteVisit.window,
    material: p.materialResponsibility ?? '',
    accessNotes: p.accessNotes,
    attachments: p.attachments,
  };
}

export const emptyValues: WizardValues = {
  category: '',
  title: '',
  propertyType: '',
  scope: '',
  scopeItems: [],
  city: '',
  locality: '',
  landmark: '',
  budgetKind: 'range',
  budgetMin: '',
  budgetMax: '',
  startPreference: '',
  targetStartDate: '',
  durationValue: '',
  durationUnit: 'days',
  siteDays: [],
  siteWindow: '',
  material: '',
  accessNotes: '',
  attachments: [],
};

const oneOf = <T extends string>(v: string, allowed: ReadonlyArray<T>): T | null => ((allowed as ReadonlyArray<string>).includes(v) ? (v as T) : null);

/** Lenient conversion for drafts: anything incomplete is stored as empty/null and validated at publish. */
export function draftInputFromValues(v: WizardValues): ProjectDraftInput {
  const min = parseRupeesToPaise(v.budgetMin);
  const max = parseRupeesToPaise(v.budgetMax);
  const duration = /^\d{1,3}$/.test(v.durationValue.trim()) && Number(v.durationValue) >= 1 ? { value: Number(v.durationValue), unit: v.durationUnit } : null;
  return {
    category: oneOf(v.category, SERVICE_CATEGORY_IDS),
    title: v.title.trim().slice(0, L.titleMax),
    propertyType: oneOf(v.propertyType, PROPERTY_TYPES),
    scope: v.scope.slice(0, L.scopeMax),
    scopeItems: v.scopeItems.map((i) => i.value.trim()).filter(Boolean).slice(0, L.scopeItemsMax),
    location: { city: v.city.trim(), locality: v.locality.trim(), landmark: v.landmark.trim() },
    budget: v.budgetKind === 'range' && min && max ? { kind: 'range', minPaise: min, maxPaise: max } : { kind: 'undisclosed' },
    startPreference: oneOf(v.startPreference, START_PREFERENCES),
    targetStartDate: v.startPreference === 'specific_date' && isISODate(v.targetStartDate) ? v.targetStartDate : null,
    durationEstimate: duration,
    siteVisit: { days: v.siteDays.filter((d): d is (typeof WEEKDAYS)[number] => (WEEKDAYS as ReadonlyArray<string>).includes(d)), window: v.siteWindow.trim() },
    materialResponsibility: oneOf(v.material, MATERIAL_RESPONSIBILITY),
    accessNotes: v.accessNotes.slice(0, L.notesMax),
    attachments: v.attachments,
  };
}

/** Map domain publish errors (Project field paths) back to wizard fields and their step. */
export function wizardFieldFor(domainPath: string): keyof WizardValues | null {
  const map: Record<string, keyof WizardValues> = {
    category: 'category',
    title: 'title',
    propertyType: 'propertyType',
    scope: 'scope',
    'location.city': 'city',
    'location.locality': 'locality',
    'location.landmark': 'landmark',
    'budget.minPaise': 'budgetMin',
    'budget.maxPaise': 'budgetMax',
    startPreference: 'startPreference',
    targetStartDate: 'targetStartDate',
    'siteVisit.days': 'siteDays',
    'siteVisit.window': 'siteWindow',
    materialResponsibility: 'material',
    accessNotes: 'accessNotes',
  };
  return map[domainPath] ?? (domainPath.startsWith('durationEstimate') ? 'durationValue' : null);
}

export function stepOf(field: keyof WizardValues): number {
  return Math.max(0, STEP_FIELDS.findIndex((fields) => fields.includes(field)));
}
