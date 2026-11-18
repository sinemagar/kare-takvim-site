# KareTakvim sitesi

Bugünün günlük takvim yaprağı, tarih ve şehir seçimi, güne özel tarayıcı notu ve tanıtım sayfaları.
Ürün kapsamı ve kabul ölçütleri: [prd.md](prd.md).

**Teknoloji:** Astro 7 + TypeScript, statik çıktı, Vercel. UI framework yok; gün sayfası tek bir küçük istemci betiğiyle çalışır.

## Çalıştırma

Node 22.12 veya üzeri gerekir.

```bash
npm install
cp .env.example .env      # isteğe bağlı; boşsa demo veriyle çalışır
npm run dev               # http://localhost:4321
npm run build             # astro check + statik çıktı (dist/)
npm run preview           # dist/ önizlemesi
npm run sun:check         # güneş saatlerini referansla karşılaştırır (≤ 2 dk)
```

## Ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| `PUBLIC_SUPABASE_URL` | Supabase proje adresi |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yalnızca `sb_publishable_...`. **Secret key asla.** |
| `PUBLIC_APPSTORE_URL`, `PUBLIC_PLAY_URL` | Mağaza bağlantıları; boşsa "yakında" metni |
| `PUBLIC_CONTACT_EMAIL` | İletişim sayfasındaki adres |
| `PUBLIC_SITE_URL` | Kanonik adres; alan adı alınınca girilir |

`PUBLIC_` ile başlayan her değer statik çıktıya gömülür. Supabase kurulumu: [`../karetakvim-kaynak-dokuman/supabase/README.md`](../karetakvim-kaynak-dokuman/supabase/README.md). Bu repo ayrı tutulduğu için SQL dosyaları ve kurulum adımları o klasördedir.

Supabase projesi 18 Kasım 2026'da kuruldu ve doğrulandı. `.env` yoksa site yerel demo veriye düşer. Veritabanındaki içerik de şimdilik demodur ve arayüzde "Demo içerik" etiketiyle görünür.

## Yapı

```
src/pages/index.astro        Günün yaprağı (?tarih=YYYY-MM-DD&sehir=<il>)
src/pages/{hakkinda,sss,gizlilik,iletisim}.astro
src/components/Leaf.astro    Yaprak işaretlemesi (erişilebilir DOM metni)
src/scripts/day-page.ts      URL durumu, içerik, şehir diyaloğu, not
src/lib/                     Ortak sözleşme: types, date, sun, cities, demo, supabase-query (+ web: content, notes, storage)
src/data/                    cities.json (81 il), demo-content.json
src/styles/                  tokens.css, leaf.css
```

`src/lib` içindeki `types`, `date`, `sun`, `cities`, `demo`, `supabase-query` dosyaları mobil uygulamayla aynıdır. Birinde değişiklik yaparsan diğerine de kopyala.

## Davranış

- "Bugün" her zaman `Europe/Istanbul` saat dilimine göre hesaplanır.
- Bugün açıkken URL'de `tarih` yoktur, yani yer imi her gün yeni yaprağı açar. Başka bir gün seçilince `tarih` eklenir ve bağlantı paylaşılabilir.
- Not anahtarı `kare-takvim:note:YYYY-MM-DD`. Notlar hiçbir sunucuya gönderilmez.
- İçerik akışı: Supabase → tarayıcı önbelleği → hata ve "Yeniden dene". Supabase yapılandırılmamışsa demo veri.
- Klavye: sol/sağ ok tuşları önceki/sonraki gün.

## Dağıtım (Vercel)

Statik Astro sitesi adaptör olmadan dağıtılır. Vercel'de projeyi bu repoya bağla; çerçeve otomatik algılanır. Ortam değişkenlerini Vercel proje ayarlarına ekle. `vercel.json` yalnızca güvenlik başlıklarını tanımlar.

## Bilinen kısıtlar

- Yaprağın alt görseli `public/paper/leaf-art.webp` (ChatGPT ile üretildi). Tanıtım ve sosyal paylaşım görselleri henüz yok.
- Tarih sayfaları istemci tarafında üretilir; her gün için ayrı SEO sayfası yoktur (PRD'ye uygun).
- Alan adı alınmadı; kanonik adres `PUBLIC_SITE_URL` girilene kadar eklenmez.
