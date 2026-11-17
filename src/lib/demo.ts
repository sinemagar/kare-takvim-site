// Yerel DEMO içerik. Supabase bağlantısı yokken uygulamanın çalışması içindir.
// Olaylar editoryal kaynak kontrolünden GEÇMEMİŞTİR; arayüz bunları "Demo içerik" olarak etiketler.
// Sözler anonim Türk atasözleridir; kişiye atıf yapılmaz.
import raw from '../data/demo-content.json';
import type { DayContent, ISODate } from './types';

type DemoFile = { events: [string, string, string, string][]; quotes: string[] };
const demo = raw as unknown as DemoFile;
const eventsByMonthDay = new Map(demo.events.map((e) => [e[0], e]));

export function demoDay(date: ISODate): DayContent {
  const e = eventsByMonthDay.get(date.slice(5));
  const dayIndex = Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  const quoteText = demo.quotes[((dayIndex % demo.quotes.length) + demo.quotes.length) % demo.quotes.length];
  return {
    date,
    designKey: 'default',
    events: e
      ? [
          {
            id: `demo-${date}`,
            category: e[1],
            title: e[2],
            summary: e[3],
            sourceName: 'Demo — kaynak eklenecek',
            sourceUrl: null,
            sortOrder: 0,
            isDemo: true,
          },
        ]
      : [],
    quote: quoteText
      ? { id: `demo-q-${date}`, text: quoteText, author: null, sourceName: 'Türk atasözü', sourceUrl: null, isDemo: true }
      : null,
    origin: 'demo',
    fetchedAt: new Date().toISOString(),
  };
}
