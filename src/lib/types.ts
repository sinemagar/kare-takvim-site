// KareTakvim ortak veri sözleşmesi. Mobil ve web aynı tipleri kullanır.
// Kaynak: karetakvim-kaynak-dokuman/tasarim-dili-ve-veri-sozlesmesi.md

/** 'YYYY-MM-DD', Europe/Istanbul takvim günü */
export type ISODate = string;

export interface DayEvent {
  id: string;
  category: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string | null;
  sortOrder: number;
  isDemo: boolean;
}

export interface DailyQuote {
  id: string;
  text: string;
  author: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  isDemo: boolean;
}

export type ContentOrigin = 'supabase' | 'cache' | 'demo';

export interface DayContent {
  date: ISODate;
  designKey: string | null;
  events: DayEvent[];
  quote: DailyQuote | null;
  origin: ContentOrigin;
  fetchedAt: string;
}

export interface City {
  id: string;
  name: string;
  timezone: 'Europe/Istanbul';
  lat: number;
  lng: number;
}

export interface SunTimes {
  /** 'HH:mm' 24 saat; güneş doğmuyorsa null */
  sunrise: string | null;
  sunset: string | null;
}

/** Widget'a giden küçük anlık görüntü. Kişisel not İÇERMEZ. */
export interface WidgetSnapshot {
  date: ISODate;
  dayNumber: string;
  monthYear: string;
  weekday: string;
  eventTitle: string | null;
  eventSummary: string | null;
  quote: string | null;
  cityName: string;
  sunrise: string | null;
  sunset: string | null;
  url: string;
}
