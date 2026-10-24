import type { Paise } from './types';

/**
 * Integer money helpers. All amounts are integer paise; fractional inputs (quantities, percentages)
 * are converted to integer hundredths first, so every calculation is exact integer arithmetic with
 * a single, explicit half-up rounding step.
 */

/** Round n/d half-up for non-negative integers n and positive integer d. */
export function divRoundHalfUp(n: number, d: number): number {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d <= 0 || n < 0) {
    throw new RangeError(`divRoundHalfUp requires non-negative safe integers (got ${n}/${d})`);
  }
  return Math.floor((2 * n + d) / (2 * d));
}

/** Convert a number with at most 2 decimals to integer hundredths (e.g. 12.5 → 1250). */
export function toHundredths(value: number): number {
  const h = Math.round(value * 100);
  if (Math.abs(h - value * 100) > 1e-6) throw new RangeError(`More than 2 decimal places: ${value}`);
  return h;
}

export function hasAtMostTwoDecimals(value: number): boolean {
  return Number.isFinite(value) && Math.abs(Math.round(value * 100) - value * 100) < 1e-6;
}

/** Parse a rupee string such as "1250", "1,250.5" or "₹ 1,250.50" to paise. Returns null if invalid. */
export function parseRupeesToPaise(input: string): Paise | null {
  const cleaned = input.replace(/[₹,\s]/g, '');
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole = '0', frac = ''] = cleaned.split('.');
  const paise = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return Number.isSafeInteger(paise) ? paise : null;
}

/** Plain rupee string for form inputs (no grouping), e.g. 125050 → "1250.50", 120000 → "1200". */
export function paiseToRupeeInput(paise: Paise): string {
  const whole = Math.floor(paise / 100);
  const frac = paise % 100;
  return frac === 0 ? String(whole) : `${whole}.${String(frac).padStart(2, '0')}`;
}

export const rupees = (r: number): Paise => Math.round(r * 100);
