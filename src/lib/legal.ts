// Yasal sayfalarda ortak bilgiler. Yayıncı adı ve e-posta ortam değişkeninden gelir;
// mağazaya göndermeden önce .env / Vercel ortamında doldurulmalıdır.
export const LEGAL_UPDATED = '18 Kasım 2026';
export const LEGAL_UPDATED_EN = 'November 18, 2026';
export const PUBLISHER = import.meta.env.PUBLIC_PUBLISHER_NAME || 'KareTakvim geliştiricisi';
export const CONTACT_EMAIL: string | undefined = import.meta.env.PUBLIC_CONTACT_EMAIL || undefined;
export const mailto = (subject: string) =>
  CONTACT_EMAIL ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}` : undefined;
