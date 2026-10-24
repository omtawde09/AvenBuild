import type { LineItemId } from '@/domain/ids';
import { paiseToRupeeInput, parseRupeesToPaise } from '@/domain/money';
import type { Discount, QuoteContent, Unit } from '@/domain/types';

export interface ComposerValues {
  lineItems: Array<{ lineId: string; description: string; quantity: string; unit: Unit; rate: string }>;
  discountKind: Discount['kind'];
  discountValue: string;
  taxPercent: string;
  earliest: string;
  latest: string;
  durationDays: string;
  milestones: Array<{ title: string; share: string }>;
  inclusions: Array<{ value: string }>;
  exclusions: Array<{ value: string }>;
  assumptions: Array<{ value: string }>;
  validUntil: string;
  note: string;
}

const strictNumber = (v: string) => (/^\d{1,9}(\.\d+)?$/.test(v.trim()) ? Number(v.trim()) : NaN);

export function valuesFromContent(c: QuoteContent): ComposerValues {
  return {
    lineItems: c.lineItems.map((li) => ({ lineId: li.id, description: li.description, quantity: li.quantity ? String(li.quantity) : '', unit: li.unit, rate: li.ratePaise ? paiseToRupeeInput(li.ratePaise) : '' })),
    discountKind: c.discount.kind,
    discountValue: c.discount.kind === 'percent' ? String(c.discount.percent) : c.discount.kind === 'flat' ? paiseToRupeeInput(c.discount.paise) : '',
    taxPercent: String(c.taxPercent),
    earliest: c.startWindow.earliest,
    latest: c.startWindow.latest,
    durationDays: String(c.durationDays),
    milestones: c.proposedMilestones.map((m) => ({ title: m.title, share: String(m.sharePercent) })),
    inclusions: c.inclusions.map((value) => ({ value })),
    exclusions: c.exclusions.map((value) => ({ value })),
    assumptions: c.assumptions.map((value) => ({ value })),
    validUntil: c.validUntil,
    note: c.note,
  };
}

/**
 * Convert form strings to domain content.
 * - strict: unparseable numbers become NaN so validation reports them (used for totals and submit).
 * - lenient: unparseable numbers become 0 so a draft can always be saved (and never stores NaN).
 */
export function contentFromValues(v: ComposerValues, mode: 'strict' | 'lenient'): QuoteContent {
  const num = (s: string) => {
    const n = strictNumber(s);
    return mode === 'lenient' && !Number.isFinite(n) ? 0 : n;
  };
  const money = (s: string) => {
    const p = parseRupeesToPaise(s);
    return p === null ? (mode === 'lenient' ? 0 : NaN) : p;
  };
  const list = (items: Array<{ value: string }>) => items.map((i) => i.value.trim()).filter((x) => mode === 'strict' || x.length > 0);
  const discount: Discount =
    v.discountKind === 'percent' ? { kind: 'percent', percent: num(v.discountValue) } : v.discountKind === 'flat' ? { kind: 'flat', paise: money(v.discountValue) } : { kind: 'none' };
  const duration = num(v.durationDays);
  return {
    lineItems: v.lineItems.map((li) => ({ id: li.lineId as LineItemId, description: li.description.trim(), quantity: num(li.quantity), unit: li.unit, ratePaise: money(li.rate) })),
    discount,
    taxPercent: num(v.taxPercent),
    startWindow: { earliest: v.earliest, latest: v.latest },
    durationDays: mode === 'lenient' ? Math.round(duration) : duration,
    proposedMilestones: v.milestones.map((m) => ({ title: m.title.trim(), sharePercent: num(m.share) })),
    inclusions: list(v.inclusions),
    exclusions: list(v.exclusions),
    assumptions: list(v.assumptions),
    validUntil: v.validUntil,
    note: v.note,
  };
}

/** Map domain error paths (QuoteContent) onto composer field names. */
export function formPath(domainPath: string): string {
  return domainPath
    .replace(/^lineItems\.(\d+)\.ratePaise$/, 'lineItems.$1.rate')
    .replace(/^startWindow\.earliest$/, 'earliest')
    .replace(/^startWindow\.latest$/, 'latest')
    .replace(/^proposedMilestones(\..*)?$/, 'milestones')
    .replace(/^(inclusions|exclusions|assumptions)\.\d+$/, '$1')
    .replace(/^discount$/, 'discountValue');
}
