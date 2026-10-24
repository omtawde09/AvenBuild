import { z } from 'zod';
import { UNITS, type QuoteContent } from '@/domain/types';
import { isISODate } from '@/domain/time';
import { validateQuoteNumbers } from '@/domain/quotes/math';
import { fieldErrorsFrom } from './zodErrors';

export const QUOTE_LIMITS = {
  lineItemsMax: 40,
  descriptionMax: 140,
  listItemMax: 160,
  listItemsMax: 12,
  noteMax: 1000,
  durationMax: 730,
  milestonesMax: 8,
} as const;

const listOf = (label: string, min = 0) =>
  z
    .array(z.string().trim().min(1, `${label} entries can’t be empty.`).max(QUOTE_LIMITS.listItemMax, `${label} entries can be at most ${QUOTE_LIMITS.listItemMax} characters.`))
    .min(min, `Add at least ${min} ${label.toLowerCase()} entr${min === 1 ? 'y' : 'ies'}.`)
    .max(QUOTE_LIMITS.listItemsMax, `At most ${QUOTE_LIMITS.listItemsMax} ${label.toLowerCase()} entries.`);

/** Structural rules for a quote that is being submitted (numeric rules are in validateQuoteNumbers). */
export const quoteSubmitSchema = z
  .object({
    lineItems: z
      .array(
        z.object({
          description: z.string().trim().min(3, 'Describe the item (at least 3 characters).').max(QUOTE_LIMITS.descriptionMax, `At most ${QUOTE_LIMITS.descriptionMax} characters.`),
          unit: z.enum(UNITS),
        }),
      )
      .min(1, 'Add at least one line item.')
      .max(QUOTE_LIMITS.lineItemsMax, `At most ${QUOTE_LIMITS.lineItemsMax} line items.`),
    startWindow: z.object({ earliest: z.string(), latest: z.string() }),
    durationDays: z.number().int('Duration must be whole days.').min(1, 'Duration must be at least 1 day.').max(QUOTE_LIMITS.durationMax, 'Duration is too long.'),
    proposedMilestones: z
      .array(
        z.object({
          title: z.string().trim().min(3, 'Milestone title needs at least 3 characters.').max(80, 'At most 80 characters.'),
          sharePercent: z.number().int('Use whole percentages.').min(1, 'Each milestone needs at least 1%.').max(100),
        }),
      )
      .max(QUOTE_LIMITS.milestonesMax),
    inclusions: listOf('Inclusions', 1),
    exclusions: listOf('Exclusions', 1),
    assumptions: listOf('Assumptions'),
    validUntil: z.string(),
    note: z.string().trim().max(QUOTE_LIMITS.noteMax, `Note can be at most ${QUOTE_LIMITS.noteMax} characters.`),
  })
  .superRefine((q, ctx) => {
    if (!isISODate(q.startWindow.earliest)) ctx.addIssue({ code: 'custom', path: ['startWindow', 'earliest'], message: 'Choose the earliest start date.' });
    if (!isISODate(q.startWindow.latest)) ctx.addIssue({ code: 'custom', path: ['startWindow', 'latest'], message: 'Choose the latest start date.' });
    else if (isISODate(q.startWindow.earliest) && q.startWindow.latest < q.startWindow.earliest) {
      ctx.addIssue({ code: 'custom', path: ['startWindow', 'latest'], message: 'Latest start must be on or after the earliest start.' });
    }
    if (!isISODate(q.validUntil)) ctx.addIssue({ code: 'custom', path: ['validUntil'], message: 'Choose how long this price is valid.' });
    if (q.proposedMilestones.length > 0) {
      const sum = q.proposedMilestones.reduce((s, m) => s + m.sharePercent, 0);
      if (sum !== 100) ctx.addIssue({ code: 'custom', path: ['proposedMilestones'], message: `Milestone shares must add up to 100% (currently ${sum}%).` });
    }
  });

/** Full submit-time validation: structure, numbers and dates relative to today. */
export function validateQuoteForSubmit(content: QuoteContent, today: string): Record<string, string> {
  const parsed = quoteSubmitSchema.safeParse(content);
  const errors = parsed.success ? {} : fieldErrorsFrom(parsed.error);
  for (const issue of validateQuoteNumbers(content)) if (!(issue.path in errors)) errors[issue.path] = issue.message;
  if (isISODate(content.validUntil) && content.validUntil <= today && !errors.validUntil) errors.validUntil = 'Validity date must be after today.';
  if (isISODate(content.startWindow.earliest) && content.startWindow.earliest < today && !errors['startWindow.earliest']) {
    errors['startWindow.earliest'] = 'Earliest start can’t be in the past.';
  }
  return errors;
}
