// Türkiye'nin 81 il merkezi. Kaynak: karetakvim-kaynak-dokuman/supabase/data/cities.json
// Koordinatlar il merkezlerinin yaklaşık değerleridir (güneş hesabı için yeterli hassasiyet).
import raw from '../data/cities.json';
import type { City } from './types';

export const DEFAULT_CITY_ID = 'istanbul';

export const CITIES: City[] = (raw as [string, string, number, number][]).map(([id, name, lat, lng]) => ({
  id,
  name,
  timezone: 'Europe/Istanbul',
  lat,
  lng,
}));

export function findCity(id: string | null | undefined, list: City[] = CITIES): City | undefined {
  return id ? list.find((c) => c.id === id) : undefined;
}

/** Türkçe karakterlere duyarsız arama için sadeleştirir. */
export function normalizeTr(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u');
}

export function searchCities(query: string, list: City[] = CITIES): City[] {
  const q = normalizeTr(query.trim());
  if (!q) return list;
  return list.filter((c) => normalizeTr(c.name).includes(q) || c.id.includes(q));
}
