// Güneş doğuş/batış: suncalc@2.1.4, şehir koordinatı + açık UTC farkı.
// Türkiye yıl boyu UTC+3 (Europe/Istanbul). utcOffset verildiğinde suncalc
// yerel takvim gününün olaylarını döndürür; sonuç Intl ile İstanbul saatinde biçimlenir.
import { getTimes } from 'suncalc';
import { TIME_ZONE, noonUTC } from './date';
import type { City, ISODate, SunTimes } from './types';

const TURKEY_UTC_OFFSET_MINUTES = 180;

const timeFmt = new Intl.DateTimeFormat('tr-TR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function format(value: Date | null | undefined): string | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  return timeFmt.format(value);
}

export function sunTimes(date: ISODate, city: Pick<City, 'lat' | 'lng'>): SunTimes {
  const t = getTimes(noonUTC(date), city.lat, city.lng, 0, TURKEY_UTC_OFFSET_MINUTES);
  return { sunrise: format(t.sunrise), sunset: format(t.sunset) };
}

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Güneşin gün içindeki konumu (0 = doğuş, 1 = batış). Gece ya da saat yoksa null. */
export function sunProgress(times: SunTimes, now: Date = new Date()): number | null {
  if (!times.sunrise || !times.sunset) return null;
  const rise = toMinutes(times.sunrise);
  const set = toMinutes(times.sunset);
  const cur = toMinutes(timeFmt.format(now));
  if (set <= rise || cur < rise || cur > set) return null;
  return (cur - rise) / (set - rise);
}
