import { z } from 'zod';
import { SERVICE_CATEGORY_IDS } from '@/data/categories';
import { MATERIAL_RESPONSIBILITY, PROPERTY_TYPES, START_PREFERENCES, WEEKDAYS, type Project } from '@/domain/types';
import { isISODate } from '@/domain/time';
import { fieldErrorsFrom } from './zodErrors';

export const PROJECT_LIMITS = {
  titleMin: 8,
  titleMax: 90,
  scopeMin: 40,
  scopeMax: 3000,
  scopeItemMax: 120,
  scopeItemsMax: 12,
  notesMax: 600,
  localityMax: 60,
  attachmentsMax: 8,
  attachmentBytesMax: 15 * 1024 * 1024,
  budgetMaxPaise: 100_00_00_000_00,
} as const;

const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, min === 1 ? `${label} is required.` : `${label} needs at least ${min} characters.`)
    .max(max, `${label} can be at most ${max} characters.`);

/** Rules a brief must satisfy before it can be published (the same rules the wizard enforces per step). */
export const projectPublishSchema = z
  .object({
    category: z.enum(SERVICE_CATEGORY_IDS, { error: 'Choose a service category.' }),
    title: text(PROJECT_LIMITS.titleMin, PROJECT_LIMITS.titleMax, 'Title'),
    scope: text(PROJECT_LIMITS.scopeMin, PROJECT_LIMITS.scopeMax, 'Scope description'),
    scopeItems: z.array(z.string().trim().min(1).max(PROJECT_LIMITS.scopeItemMax)).max(PROJECT_LIMITS.scopeItemsMax),
    propertyType: z.enum(PROPERTY_TYPES, { error: 'Choose a property type.' }),
    location: z.object({
      city: text(1, 40, 'City'),
      locality: text(2, PROJECT_LIMITS.localityMax, 'Locality'),
      landmark: z.string().trim().max(80, 'Landmark can be at most 80 characters.'),
    }),
    budget: z.discriminatedUnion('kind', [
      z
        .object({
          kind: z.literal('range'),
          minPaise: z.number().int().positive('Enter a minimum budget above ₹0.'),
          maxPaise: z.number().int().positive('Enter a maximum budget above ₹0.').max(PROJECT_LIMITS.budgetMaxPaise, 'Budget is larger than this demo supports.'),
        })
        .refine((b) => b.maxPaise >= b.minPaise, { message: 'Maximum must be at least the minimum.', path: ['maxPaise'] }),
      z.object({ kind: z.literal('undisclosed') }),
    ]),
    startPreference: z.enum(START_PREFERENCES, { error: 'Choose when you’d like work to start.' }),
    targetStartDate: z.string().nullable(),
    durationEstimate: z
      .object({ value: z.number().int().min(1, 'Duration must be at least 1.').max(365, 'Duration is too long.'), unit: z.enum(['days', 'weeks']) })
      .nullable(),
    siteVisit: z.object({
      days: z.array(z.enum(WEEKDAYS)).min(1, 'Pick at least one day when the site can be visited.'),
      window: text(3, 80, 'Visiting hours'),
    }),
    materialResponsibility: z.enum(MATERIAL_RESPONSIBILITY, { error: 'Say who supplies materials.' }),
    accessNotes: z.string().trim().max(PROJECT_LIMITS.notesMax, `Notes can be at most ${PROJECT_LIMITS.notesMax} characters.`),
    attachments: z.array(z.object({ sizeBytes: z.number().int().nonnegative() })).max(PROJECT_LIMITS.attachmentsMax),
  })
  .superRefine((p, ctx) => {
    if (p.startPreference === 'specific_date') {
      if (!p.targetStartDate || !isISODate(p.targetStartDate)) {
        ctx.addIssue({ code: 'custom', path: ['targetStartDate'], message: 'Choose a target start date.' });
      }
    }
  });

/** Additional publish-time rule that depends on "today". */
export function validateProjectForPublish(project: Project, today: string): Record<string, string> {
  const parsed = projectPublishSchema.safeParse(project);
  const errors = parsed.success ? {} : fieldErrorsFrom(parsed.error);
  if (project.startPreference === 'specific_date' && project.targetStartDate && project.targetStartDate < today && !errors.targetStartDate) {
    errors.targetStartDate = 'Target start date can’t be in the past.';
  }
  return errors;
}
