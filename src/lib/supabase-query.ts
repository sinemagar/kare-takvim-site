// Supabase salt okunur sorguları ve satır → sözleşme eşlemesi.
// İstemci yalnızca publishable key ile çalışır; RLS yayımlanmamış/onaylanmamış satırları gizler.
//
// İki içerik türü birleştirilir:
//   day_events / daily_quotes     → belirli tarihe bağlı (dinî bayram, kandil, değişen günler)
//   yearly_events / yearly_quotes → ay+gün ile her yıl tekrar eden (tarihte bugün, sabit özel günler)
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { City, DailyQuote, DayContent, DayEvent, DayTheme, ISODate } from './types';

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
  tier?: string | null; theme?: string | null; label?: string | null;
  source2_name?: string | null; source2_url?: string | null;
};
type QuoteRow = {
  id: string; quote_text: string; author: string | null;
  source_name: string | null; source_url: string | null; is_demo: boolean;
};
type DayRow = { day_date: string; design_key: string | null; day_events: EventRow[]; daily_quotes: QuoteRow[] };
type YearlyEventRow = EventRow & { month: number; day: number };
type YearlyQuoteRow = QuoteRow & { month: number; day: number };

const EVENT_COLS = 'id, category, title, summary, source_name, source_url, sort_order, is_demo, tier, theme, label, source2_name, source2_url';
const EVENT_COLS_LEGACY = 'id, category, title, summary, source_name, source_url, sort_order, is_demo';
const QUOTE_COLS = 'id, quote_text, author, source_name, source_url, is_demo';
const daySelect = (eventCols: string) => `day_date, design_key, day_events(${eventCols}), daily_quotes(${QUOTE_COLS})`;

/** 004 migration'ı henüz çalıştırılmamış veritabanı: yeni tablo/kolon yok. */
function isMissingSchema(error: { code?: string } | null): boolean {
  return Boolean(error && ['42703', '42P01', 'PGRST204', 'PGRST205'].includes(error.code ?? ''));
}

const THEMES: readonly string[] = ['milli', 'anma', 'dini'];

function toEvent(r: EventRow, dated: boolean): DayEvent & { dated: boolean } {
  return {
    id: r.id,
    tier: r.tier === 'ozel' ? 'ozel' : 'normal',
    theme: r.theme && THEMES.includes(r.theme) ? (r.theme as DayTheme) : null,
    label: r.label ?? null,
    category: r.category,
    title: r.title,
    summary: r.summary,
    sourceName: r.source_name,
    sourceUrl: r.source_url,
    source2Name: r.source2_name ?? null,
    source2Url: r.source2_url ?? null,
    sortOrder: r.sort_order,
    isDemo: r.is_demo,
    dated,
  };
}

function toQuote(q: QuoteRow): DailyQuote {
  return { id: q.id, text: q.quote_text, author: q.author, sourceName: q.source_name, sourceUrl: q.source_url, isDemo: q.is_demo };
}

/** Sıra: özel günler önce; aynı düzeyde tarihe özel kayıt yıllık kayıttan önce; sonra sort_order. */
function assemble(date: ISODate, row: DayRow | null, yearlyEvents: YearlyEventRow[], yearlyQuotes: YearlyQuoteRow[]): DayContent {
  const merged = [
    ...(row?.day_events ?? []).map((r) => toEvent(r, true)),
    ...yearlyEvents.map((r) => toEvent(r, false)),
  ].sort(
    (a, b) =>
      Number(b.tier === 'ozel') - Number(a.tier === 'ozel') ||
      Number(b.dated) - Number(a.dated) ||
      a.sortOrder - b.sortOrder,
  );
  const events: DayEvent[] = merged.map(({ dated: _dated, ...e }) => e);
  const quoteRow = row?.daily_quotes?.[0] ?? yearlyQuotes[0];
  return {
    date,
    designKey: row?.design_key ?? null,
    theme: events.find((e) => e.tier === 'ozel' && e.theme)?.theme ?? null,
    events,
    quote: quoteRow ? toQuote(quoteRow) : null,
    origin: 'supabase',
    fetchedAt: new Date().toISOString(),
  };
}

const monthDay = (date: ISODate) => ({ month: Number(date.slice(5, 7)), day: Number(date.slice(8, 10)) });

async function fetchDatedRows(sb: SupabaseClient, dates: ISODate[]): Promise<DayRow[]> {
  const run = (cols: string) =>
    sb.from('calendar_days').select(daySelect(cols)).gte('day_date', dates[0]).lte('day_date', dates[dates.length - 1]).returns<DayRow[]>();
  let { data, error } = await run(EVENT_COLS);
  if (isMissingSchema(error)) ({ data, error } = await run(EVENT_COLS_LEGACY));
  if (error) throw error;
  return data ?? [];
}

async function fetchYearly<T extends { month: number; day: number }>(
  sb: SupabaseClient,
  table: 'yearly_events' | 'yearly_quotes',
  cols: string,
  dates: ISODate[],
): Promise<T[]> {
  const pairs = [...new Set(dates.map((d) => d.slice(5)))].map((md) => `and(month.eq.${Number(md.slice(0, 2))},day.eq.${Number(md.slice(3, 5))})`);
  const { data, error } = await sb.from(table).select(`month, day, ${cols}`).or(pairs.join(',')).returns<T[]>();
  if (isMissingSchema(error)) return [];
  if (error) throw error;
  return data ?? [];
}

/** Verilen (ardışık, sıralı) günlerin yayınlanmış içeriği. Her gün için bir kayıt döner; içerik yoksa boş (uydurma yok). */
export async function fetchDays(sb: SupabaseClient, dates: ISODate[]): Promise<DayContent[]> {
  if (!dates.length) return [];
  const [rows, yEvents, yQuotes] = await Promise.all([
    fetchDatedRows(sb, dates),
    fetchYearly<YearlyEventRow>(sb, 'yearly_events', EVENT_COLS, dates),
    fetchYearly<YearlyQuoteRow>(sb, 'yearly_quotes', QUOTE_COLS, dates),
  ]);
  const byDate = new Map(rows.map((r) => [r.day_date, r]));
  return dates.map((date) => {
    const { month, day } = monthDay(date);
    return assemble(
      date,
      byDate.get(date) ?? null,
      yEvents.filter((e) => e.month === month && e.day === day),
      yQuotes.filter((q) => q.month === month && q.day === day),
    );
  });
}

export async function fetchDay(sb: SupabaseClient, date: ISODate): Promise<DayContent> {
  return (await fetchDays(sb, [date]))[0];
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

/** Olay kartının üst etiketi. */
export function eventLabel(e: Pick<DayEvent, 'label' | 'tier'> | undefined): string {
  if (!e) return 'GÜNÜN BİLGİSİ';
  return e.label ?? (e.tier === 'ozel' ? 'ÖNEMLİ GÜN' : 'TARİHTE BUGÜN');
}
