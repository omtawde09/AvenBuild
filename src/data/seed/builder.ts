import { addDays, parseISODate } from '@/domain/time';
import type { AttachmentId, LineItemId } from '@/domain/ids';
import { rupees } from '@/domain/money';
import type { AttachmentMeta, Discount, ISODate, ISODateTime, LineItem, NotificationPrefs, ProposedMilestone, QuoteContent, Unit } from '@/domain/types';

/** Deterministic time helpers relative to the seed anchor (local midnight of the reset day). */
export interface SeedClock {
  anchor: ISODate;
  /** Calendar date `offset` days from the anchor. */
  day: (offset: number) => ISODate;
  /** Timestamp at local `hh:mm` on the day `offset` days from the anchor. */
  at: (offset: number, hhmm: string) => ISODateTime;
}

export function seedClock(anchor: ISODate): SeedClock {
  return {
    anchor,
    day: (offset) => addDays(anchor, offset),
    at: (offset, hhmm) => {
      const d = parseISODate(addDays(anchor, offset));
      const [h, m] = hhmm.split(':').map(Number);
      d.setHours(h ?? 0, m ?? 0, 0, 0);
      return d.toISOString();
    },
  };
}

export const allNotifications: NotificationPrefs = { project: true, quote: true, message: true, milestone: true, change: true, review: true, system: true };

export function seedImage(id: string, name: string, art: string, addedAt: ISODateTime, sizeBytes = 1_240_000): AttachmentMeta {
  return { id: id as AttachmentId, name, mimeType: 'image/jpeg', sizeBytes, addedAt, previewKind: 'seed', seedArt: art };
}

export function seedFile(id: string, name: string, mimeType: string, sizeBytes: number, addedAt: ISODateTime): AttachmentMeta {
  return { id: id as AttachmentId, name, mimeType, sizeBytes, addedAt, previewKind: 'none' };
}

type LineSpec = readonly [description: string, quantity: number, unit: Unit, rateRupees: number];

export function lines(prefix: string, specs: ReadonlyArray<LineSpec>): LineItem[] {
  return specs.map(([description, quantity, unit, rate], i) => ({ id: `li_${prefix}_${i + 1}` as LineItemId, description, quantity, unit, ratePaise: rupees(rate) }));
}

export function quoteContent(c: {
  prefix: string;
  lines: ReadonlyArray<LineSpec>;
  tax?: number;
  discount?: Discount;
  start: [ISODate, ISODate];
  durationDays: number;
  milestones?: ProposedMilestone[];
  inclusions: string[];
  exclusions: string[];
  assumptions?: string[];
  validUntil: ISODate;
  note?: string;
}): QuoteContent {
  return {
    lineItems: lines(c.prefix, c.lines),
    discount: c.discount ?? { kind: 'none' },
    taxPercent: c.tax ?? 18,
    startWindow: { earliest: c.start[0], latest: c.start[1] },
    durationDays: c.durationDays,
    proposedMilestones: c.milestones ?? [],
    inclusions: c.inclusions,
    exclusions: c.exclusions,
    assumptions: c.assumptions ?? [],
    validUntil: c.validUntil,
    note: c.note ?? '',
  };
}
