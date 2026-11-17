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
