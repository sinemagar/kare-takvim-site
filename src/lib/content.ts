// Web içerik yükleyici: Supabase → yerel önbellek → (bağlantı yoksa) demo.
import { CITIES } from './cities';
import { demoDay } from './demo';
import { read, write } from './storage';
import { fetchCities, fetchDay, getClient, isConfigured } from './supabase-query';
import type { City, DayContent, ISODate } from './types';

const config = {
  url: import.meta.env.PUBLIC_SUPABASE_URL as string | undefined,
  publishableKey: import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined,
};

export const supabaseConfigured = isConfigured(config);

export type LoadResult =
  | { ok: true; day: DayContent; offline: boolean }
  | { ok: false; reason: 'offline' | 'error' };

function readCache(date: ISODate): DayContent | null {
  const raw = read(`day:${date}`);
  if (!raw) return null;
  try {
    return { ...(JSON.parse(raw) as DayContent), origin: 'cache' };
  } catch {
    return null;
  }
}

export async function loadDay(date: ISODate): Promise<LoadResult> {
  const sb = getClient(config);
  if (!sb) return { ok: true, day: demoDay(date), offline: false };
  try {
    const day = await fetchDay(sb, date);
    write(`day:${date}`, JSON.stringify(day));
    return { ok: true, day, offline: false };
  } catch {
    const cached = readCache(date);
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (cached) return { ok: true, day: cached, offline: true };
    return { ok: false, reason: offline ? 'offline' : 'error' };
  }
}

/** Şehir listesi: Supabase (varsa) → önbellek → paketlenmiş 81 il. */
export async function loadCities(): Promise<City[]> {
  const sb = getClient(config);
  if (!sb) return CITIES;
  try {
    const list = await fetchCities(sb);
    if (list.length) {
      write('cities', JSON.stringify(list));
      return list;
    }
  } catch {
    /* önbelleğe düş */
  }
  try {
    const cached = JSON.parse(read('cities') ?? 'null') as City[] | null;
    if (cached?.length) return cached;
  } catch {
    /* paketlenmiş listeye düş */
  }
  return CITIES;
}
