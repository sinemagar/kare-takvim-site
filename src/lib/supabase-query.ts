// Supabase salt okunur sorgusu ve satır → sözleşme eşlemesi.
// İstemci yalnızca publishable key ile çalışır; RLS yayımlanmamış satırları gizler.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { City, DayContent, ISODate } from './types';

export interface SupabaseConfig {
  url: string | undefined;
  publishableKey: string | undefined;
}

let client: SupabaseClient | null = null;

export function isConfigured(cfg: SupabaseConfig): cfg is { url: string; publishableKey: string } {
  return Boolean(cfg.url && cfg.publishableKey && /^https:\/\//.test(cfg.url));
}

export function getClient(cfg: SupabaseConfig): SupabaseClient | null {
  if (!isConfigured(cfg)) return null;
  if (!client) {
    client = createClient(cfg.url, cfg.publishableKey, {
      // Oturum yok: yalnızca herkese açık içerik okunur, depolama gerekmez.
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}

type EventRow = {
  id: string; category: string; title: string; summary: string;
  source_name: string; source_url: string | null; sort_order: number; is_demo: boolean;
};
type QuoteRow = {
  id: string; quote_text: string; author: string | null;
  source_name: string | null; source_url: string | null; is_demo: boolean;
};
type DayRow = { day_date: string; design_key: string | null; day_events: EventRow[]; daily_quotes: QuoteRow[] };

/** Bir günün yayınlanmış içeriği. Gün yayınlanmamışsa boş içerik döner (uydurma yok). */
export async function fetchDay(sb: SupabaseClient, date: ISODate): Promise<DayContent> {
  const { data, error } = await sb
    .from('calendar_days')
    .select(
      'day_date, design_key, day_events(id, category, title, summary, source_name, source_url, sort_order, is_demo), daily_quotes(id, quote_text, author, source_name, source_url, is_demo)',
    )
    .eq('day_date', date)
    .maybeSingle<DayRow>();
  if (error) throw error;
  return toDayContent(date, data);
}

function toDayContent(date: ISODate, data: DayRow | null): DayContent {
  const events = (data?.day_events ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => ({
      id: r.id, category: r.category, title: r.title, summary: r.summary,
      sourceName: r.source_name, sourceUrl: r.source_url, sortOrder: r.sort_order, isDemo: r.is_demo,
    }));
  const q = data?.daily_quotes?.[0];
  return {
    date,
    designKey: data?.design_key ?? null,
    events,
    quote: q
      ? { id: q.id, text: q.quote_text, author: q.author, sourceName: q.source_name, sourceUrl: q.source_url, isDemo: q.is_demo }
      : null,
    origin: 'supabase',
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchCities(sb: SupabaseClient): Promise<City[]> {
  const { data, error } = await sb.from('cities').select('city_id, name, latitude, longitude').order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.city_id as string,
    name: r.name as string,
    timezone: 'Europe/Istanbul' as const,
    lat: Number(r.latitude),
    lng: Number(r.longitude),
  }));
}

/** Gösterilecek içerikte demo kayıt var mı? */
export function hasDemo(day: DayContent): boolean {
  return day.origin === 'demo' || day.events.some((e) => e.isDemo) || Boolean(day.quote?.isDemo);
}

/** Tarih aralığının yayınlanmış içeriği (widget zaman çizelgesi için). Yayınlanmamış günler listede olmaz. */
export async function fetchRange(sb: SupabaseClient, from: ISODate, to: ISODate): Promise<DayContent[]> {
  const { data, error } = await sb
    .from('calendar_days')
    .select(
      'day_date, design_key, day_events(id, category, title, summary, source_name, source_url, sort_order, is_demo), daily_quotes(id, quote_text, author, source_name, source_url, is_demo)',
    )
    .gte('day_date', from)
    .lte('day_date', to)
    .returns<DayRow[]>();
  if (error) throw error;
  return (data ?? []).map((row) => toDayContent(row.day_date, row));
}
