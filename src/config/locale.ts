/**
 * Centralised locale configuration. Change these values to deploy to another market;
 * all money/number/date formatting reads from here (see src/lib/format).
 */
export const localeConfig = {
  locale: 'en-IN',
  currency: 'INR',
  currencyMinorUnitsPerMajor: 100,
  timeZone: 'Asia/Kolkata',
  defaultTaxPercent: 18,
  taxLabel: 'GST',
} as const;
