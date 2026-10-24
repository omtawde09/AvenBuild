import { localeConfig } from '@/config/locale';
import type { Paise } from '@/domain/types';

/**
 * Centralised formatting. Everything reads localeConfig so another market only needs a config change.
 */
const { locale, currency, currencyMinorUnitsPerMajor: minor } = localeConfig;

const moneyFmt = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 });
const moneyExactFmt = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numberFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
const plainFmt = new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
const shortDateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
const dateTimeFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const timeFmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
const monthYearFmt = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' });

/** ₹1,23,456 or ₹1,23,456.5 (drops trailing zero paise). */
export function formatMoney(paise: Paise): string {
  return moneyFmt.format(paise / minor);
}

/** ₹1,23,456.00 — always two decimals (quotes and totals). */
export function formatMoneyExact(paise: Paise): string {
  return moneyExactFmt.format(paise / minor);
}

/** 1,23,456 without currency symbol (for summaries that already say ₹). */
export function formatPaisePlain(paise: Paise): string {
  return plainFmt.format(paise / minor);
}

/** Compact range for budgets: "₹1.2–1.8 lakh", "₹25,000–80,000", "₹1.5–2 crore". */
export function formatBudgetRange(minPaise: Paise, maxPaise: Paise): string {
  const lakh = 1_00_000 * minor;
  const crore = 100 * lakh;
  const scale = (v: number, unit: number) => numberFmt.format(Math.round((v / unit) * 10) / 10);
  if (minPaise >= crore) return `₹${scale(minPaise, crore)}–${scale(maxPaise, crore)} crore`;
  if (minPaise >= lakh) return `₹${scale(minPaise, lakh)}–${scale(maxPaise, lakh)} lakh`;
  if (maxPaise >= lakh) return `${formatMoney(minPaise)}–₹${scale(maxPaise, lakh)} lakh`;
  return `${formatMoney(minPaise)}–${formatPaisePlain(maxPaise)}`;
}

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

function parseLocalDate(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  }
  return new Date(iso);
}

/** 24 Oct 2026 */
export function formatDate(iso: string): string {
  return dateFmt.format(parseLocalDate(iso));
}

/** 24 Oct */
export function formatShortDate(iso: string): string {
  return shortDateFmt.format(parseLocalDate(iso));
}

/** 24 Oct, 3:45 pm */
export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatMonthYear(iso: string): string {
  return monthYearFmt.format(parseLocalDate(iso));
}

/** "just now", "5 min ago", "3 h ago", "yesterday", else a short date. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 2 * 86_400) return 'yesterday';
  if (diff < 7 * 86_400) return `${Math.floor(diff / 86_400)} days ago`;
  return formatShortDate(iso);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${numberFmt.format(Math.round(bytes / 102.4) / 10)} KB`;
  return `${numberFmt.format(Math.round(bytes / (1024 * 102.4)) / 10)} MB`;
}

export const unitLabel: Record<string, string> = {
  sq_ft: 'sq ft',
  sq_m: 'sq m',
  cu_m: 'cu m',
  rft: 'running ft',
  nos: 'nos',
  kg: 'kg',
  lump_sum: 'lump sum',
  day: 'day',
};

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}
