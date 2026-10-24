import { computeQuoteTotals, lineAmount, safeQuoteTotals, validateQuoteNumbers } from '@/domain/quotes/math';
import { divRoundHalfUp, parseRupeesToPaise, paiseToRupeeInput } from '@/domain/money';
import type { LineItemId } from '@/domain/ids';
import type { LineItem, QuoteContent } from '@/domain/types';

const li = (quantity: number, ratePaise: number, n = 1): LineItem => ({ id: `li_${n}` as LineItemId, description: 'Item', quantity, unit: 'sq_ft', ratePaise });
const content = (lineItems: LineItem[], extra: Partial<Pick<QuoteContent, 'discount' | 'taxPercent'>> = {}) => ({
  lineItems,
  discount: { kind: 'none' } as QuoteContent['discount'],
  taxPercent: 18,
  ...extra,
});

describe('money helpers', () => {
  it('rounds half up with integer arithmetic', () => {
    expect(divRoundHalfUp(5, 10)).toBe(1);
    expect(divRoundHalfUp(4, 10)).toBe(0);
    expect(divRoundHalfUp(15, 10)).toBe(2);
    expect(() => divRoundHalfUp(-1, 10)).toThrow();
  });

  it('parses rupee input strictly to paise', () => {
    expect(parseRupeesToPaise('1250')).toBe(125000);
    expect(parseRupeesToPaise('1,250.5')).toBe(125050);
    expect(parseRupeesToPaise('₹ 0.05')).toBe(5);
    expect(parseRupeesToPaise('12.345')).toBeNull();
    expect(parseRupeesToPaise('-5')).toBeNull();
    expect(parseRupeesToPaise('abc')).toBeNull();
    expect(parseRupeesToPaise('')).toBeNull();
    expect(paiseToRupeeInput(125050)).toBe('1250.50');
    expect(paiseToRupeeInput(120000)).toBe('1200');
  });
});

describe('quote totals', () => {
  it('matches the landing-page sample quote exactly', () => {
    const t = computeQuoteTotals(content([li(1150, 1800, 1), li(1150, 6200, 2), li(1150, 2400, 3), li(1, 350000, 4)]));
    expect(t.subtotalPaise).toBe(12310000);
    expect(t.taxPaise).toBe(2215800);
    expect(t.totalPaise).toBe(14525800);
  });

  it('avoids floating point drift on fractional quantities', () => {
    // 0.1 × ₹0.03 three times would drift with floats; integer hundredths keep it exact.
    expect(lineAmount({ quantity: 0.1, ratePaise: 3 })).toBe(0);
    expect(lineAmount({ quantity: 12.35, ratePaise: 1999 })).toBe(24688); // 246.8765 → 24688 paise
    expect(lineAmount({ quantity: 2.5, ratePaise: 1 })).toBe(3); // 2.5 → rounds half up
  });

  it('applies percent and flat discounts before tax', () => {
    const pct = computeQuoteTotals(content([li(100, 10000)], { discount: { kind: 'percent', percent: 7.5 }, taxPercent: 18 }));
    expect(pct.subtotalPaise).toBe(1000000);
    expect(pct.discountPaise).toBe(75000);
    expect(pct.taxablePaise).toBe(925000);
    expect(pct.taxPaise).toBe(166500);
    expect(pct.totalPaise).toBe(1091500);

    const flat = computeQuoteTotals(content([li(1, 50000)], { discount: { kind: 'flat', paise: 20000 }, taxPercent: 0 }));
    expect(flat.totalPaise).toBe(30000);
  });

  it('rejects invalid numbers instead of rounding silently', () => {
    const paths = (c: ReturnType<typeof content>) => validateQuoteNumbers(c).map((i) => i.path);
    expect(paths(content([]))).toContain('lineItems');
    expect(paths(content([li(0, 100)]))).toContain('lineItems.0.quantity');
    expect(paths(content([li(-2, 100)]))).toContain('lineItems.0.quantity');
    expect(paths(content([li(1.234, 100)]))).toContain('lineItems.0.quantity');
    expect(paths(content([li(1, -1)]))).toContain('lineItems.0.ratePaise');
    expect(paths(content([li(1, 1.5)]))).toContain('lineItems.0.ratePaise');
    expect(paths(content([li(1, 100)], { taxPercent: 40 }))).toContain('taxPercent');
    expect(paths(content([li(1, 100)], { discount: { kind: 'flat', paise: 101 } }))).toContain('discount');
    expect(paths(content([li(1, 100)], { discount: { kind: 'percent', percent: 120 } }))).toContain('discount');
    expect(safeQuoteTotals(content([li(0, 100)]))).toBeNull();
    expect(() => computeQuoteTotals(content([]))).toThrow();
  });
});
