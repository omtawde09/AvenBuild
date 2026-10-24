import { divRoundHalfUp, hasAtMostTwoDecimals, toHundredths } from '../money';
import type { Discount, LineItem, Paise, QuoteContent } from '../types';

export interface QuoteTotals {
  lines: Array<{ id: string; amountPaise: Paise }>;
  subtotalPaise: Paise;
  discountPaise: Paise;
  taxablePaise: Paise;
  taxPaise: Paise;
  totalPaise: Paise;
}

export interface QuoteMathIssue {
  path: string;
  message: string;
}

export const MAX_TAX_PERCENT = 28;
/** Limits keep every intermediate product within Number.MAX_SAFE_INTEGER. */
export const MAX_QUANTITY = 100_000;
export const MAX_RATE_PAISE = 10_00_000_00; // ₹10,00,000 per unit
export const MAX_SUBTOTAL_PAISE = 100_00_00_000_00; // ₹100 crore

/** line amount = round_half_up(quantity × rate), computed in integer hundredths. */
export function lineAmount(item: Pick<LineItem, 'quantity' | 'ratePaise'>): Paise {
  return divRoundHalfUp(toHundredths(item.quantity) * item.ratePaise, 100);
}

function discountAmount(subtotal: Paise, discount: Discount): Paise {
  switch (discount.kind) {
    case 'none':
      return 0;
    case 'flat':
      return discount.paise;
    case 'percent':
      return divRoundHalfUp(subtotal * toHundredths(discount.percent), 100 * 100);
  }
}

/** Validate the numeric inputs that totals depend on. Returns an empty list when the quote can be totalled. */
export function validateQuoteNumbers(content: Pick<QuoteContent, 'lineItems' | 'discount' | 'taxPercent'>): QuoteMathIssue[] {
  const issues: QuoteMathIssue[] = [];
  if (content.lineItems.length === 0) issues.push({ path: 'lineItems', message: 'Add at least one line item.' });
  content.lineItems.forEach((li, i) => {
    if (!Number.isFinite(li.quantity) || li.quantity <= 0) issues.push({ path: `lineItems.${i}.quantity`, message: 'Quantity must be greater than 0.' });
    else if (!hasAtMostTwoDecimals(li.quantity)) issues.push({ path: `lineItems.${i}.quantity`, message: 'Use at most 2 decimal places.' });
    else if (li.quantity > MAX_QUANTITY) issues.push({ path: `lineItems.${i}.quantity`, message: 'Quantity is too large.' });
    if (!Number.isSafeInteger(li.ratePaise) || li.ratePaise < 0) issues.push({ path: `lineItems.${i}.ratePaise`, message: 'Rate must be 0 or more, in rupees and paise.' });
    else if (li.ratePaise > MAX_RATE_PAISE) issues.push({ path: `lineItems.${i}.ratePaise`, message: 'Rate is too large.' });
  });
  if (!Number.isFinite(content.taxPercent) || content.taxPercent < 0 || content.taxPercent > MAX_TAX_PERCENT || !hasAtMostTwoDecimals(content.taxPercent)) {
    issues.push({ path: 'taxPercent', message: `Tax must be between 0 and ${MAX_TAX_PERCENT}% with at most 2 decimals.` });
  }
  const d = content.discount;
  if (d.kind === 'percent' && (!Number.isFinite(d.percent) || d.percent < 0 || d.percent > 100 || !hasAtMostTwoDecimals(d.percent))) {
    issues.push({ path: 'discount', message: 'Discount must be between 0 and 100% with at most 2 decimals.' });
  }
  if (d.kind === 'flat' && (!Number.isSafeInteger(d.paise) || d.paise < 0)) {
    issues.push({ path: 'discount', message: 'Discount must be 0 or more.' });
  }
  if (issues.length === 0) {
    const subtotal = content.lineItems.reduce((sum, li) => sum + lineAmount(li), 0);
    if (subtotal > MAX_SUBTOTAL_PAISE) issues.push({ path: 'lineItems', message: 'Quote subtotal is larger than this demo supports (₹100 crore).' });
    else if (discountAmount(subtotal, d) > subtotal) issues.push({ path: 'discount', message: 'Discount can’t be more than the subtotal.' });
  }
  return issues;
}

/**
 * Compute quote totals. Order: line amounts → subtotal → discount → taxable → tax → total.
 * Throws if the inputs are invalid — call validateQuoteNumbers first (or use safeQuoteTotals).
 */
export function computeQuoteTotals(content: Pick<QuoteContent, 'lineItems' | 'discount' | 'taxPercent'>): QuoteTotals {
  const issues = validateQuoteNumbers(content);
  if (issues.length) throw new RangeError(issues.map((i) => `${i.path}: ${i.message}`).join('; '));
  const lines = content.lineItems.map((li) => ({ id: li.id, amountPaise: lineAmount(li) }));
  const subtotalPaise = lines.reduce((s, l) => s + l.amountPaise, 0);
  const discountPaise = discountAmount(subtotalPaise, content.discount);
  const taxablePaise = subtotalPaise - discountPaise;
  const taxPaise = divRoundHalfUp(taxablePaise * toHundredths(content.taxPercent), 100 * 100);
  return { lines, subtotalPaise, discountPaise, taxablePaise, taxPaise, totalPaise: taxablePaise + taxPaise };
}

/** Totals for display; returns null instead of throwing when inputs are incomplete or invalid. */
export function safeQuoteTotals(content: Pick<QuoteContent, 'lineItems' | 'discount' | 'taxPercent'>): QuoteTotals | null {
  return validateQuoteNumbers(content).length ? null : computeQuoteTotals(content);
}

/** Total in paise, or null when the quote can't be totalled yet. */
export function quoteTotal(content: Pick<QuoteContent, 'lineItems' | 'discount' | 'taxPercent'>): Paise | null {
  return safeQuoteTotals(content)?.totalPaise ?? null;
}
