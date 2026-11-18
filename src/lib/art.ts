// İçerik → görsel anahtarı eşlemesi. Mobil ve web aynı dosyayı kullanır;
// anahtarın dosyaya çevrilmesi platforma özeldir (mobil: require, web: /art/*.webp).
import type { DayContent } from './types';

export const CATEGORY_KEYS = [
  'bilim', 'uzay', 'teknoloji', 'doga', 'sanat', 'edebiyat', 'muzik',
  'spor', 'mimari', 'kultur', 'kurum', 'kesif', 'haklar', 'genel',
] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

const TR: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };

/** 'Müzik' → 'muzik'; bilinmeyen kategori → 'genel'. */
export function categoryKey(category: string | null | undefined): CategoryKey {
  const slug = (category ?? '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşüâîû]/g, (c) => TR[c] ?? c)
    .trim();
  return (CATEGORY_KEYS as readonly string[]).includes(slug) ? (slug as CategoryKey) : 'genel';
}

export type PageArtKey = 'ozel-gun' | 'dini';

/** Özel günlerde yaprağa konan geniş görsel. Anma günlerinde ve sıradan günlerde görsel yok. */
export function pageArtKey(day: Pick<DayContent, 'theme' | 'events'> | null): PageArtKey | null {
  if (!day || day.events[0]?.tier !== 'ozel') return null;
  if (day.theme === 'anma') return null;
  return day.theme === 'dini' ? 'dini' : 'ozel-gun';
}
