// Tarih yardımcıları. "Bugün" her zaman Europe/Istanbul'da hesaplanır.
// Aritmetik, gün sınırı ve yaz saati hatalarından kaçınmak için UTC öğlen üzerinden yapılır.
import type { ISODate } from './types';

export const TIME_ZONE = 'Europe/Istanbul';
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string') return false;
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Europe/Istanbul'daki bugünün tarihi. */
export function todayISO(now: Date = new Date()): ISODate {
  // en-CA biçimi YYYY-MM-DD verir.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function noonUTC(date: ISODate): Date {
  return new Date(`${date}T12:00:00Z`);
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = noonUTC(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', ...opts });
const dayFmt = fmt({ day: 'numeric' });
const monthFmt = fmt({ month: 'long' });
const monthYearFmt = fmt({ month: 'long', year: 'numeric' });
const weekdayFmt = fmt({ weekday: 'long' });
const longFmt = fmt({ day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
const shortFmt = fmt({ day: 'numeric', month: 'long' });

export interface DateParts {
  dayNumber: string;
  month: string;
  monthYear: string;
  weekday: string;
  /** "18 Kasım 2026 Çarşamba" — ekran okuyucu ve başlık için */
  long: string;
  /** "18 Kasım" */
  short: string;
}

export function dateParts(date: ISODate): DateParts {
  const d = noonUTC(date);
  return {
    dayNumber: dayFmt.format(d),
    month: monthFmt.format(d),
    monthYear: monthYearFmt.format(d),
    weekday: weekdayFmt.format(d),
    long: longFmt.format(d),
    short: shortFmt.format(d),
  };
}
