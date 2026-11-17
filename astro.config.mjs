// @ts-check
import { defineConfig } from 'astro/config';

// Statik çıktı: Vercel'e adaptörsüz dağıtılır.
// https://docs.astro.build/en/guides/deploy/vercel/
export default defineConfig({
  // Kanonik adres yalnızca PUBLIC_SITE_URL verilince eklenir (alan adı henüz alınmadı).
  site: process.env.PUBLIC_SITE_URL || undefined,
  output: 'static',
  // Astro 7 varsayılanı 'jsx' satır içi boşlukları silebilir.
  compressHTML: true,
});
