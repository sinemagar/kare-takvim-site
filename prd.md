# KareTakvim Web Sitesi — PRD

**Durum:** MVP kapsamı / taslak ürün gereksinimi  
**Ürün:** KareTakvim günlük takvim sayfası ve tanıtım sitesi  
**Dil ve bölge:** İlk sürüm Türkçe, Türkiye şehirleri, `Europe/Istanbul`  
**Önerilen teknoloji:** Astro + TypeScript, statik dağıtım, günlük görünüm için küçük istemci tarafı etkileşim.

## 1. Ürün özeti

KareTakvim web sitesi, mobil uygulamadaki günlük yaprağı tarayıcıda da kullanılabilir kılar. Ana sayfa varsayılan olarak bugünün eski usul takvim yaprağını gösterir: tarih, önemli gün/tarihi bilgi, özlü söz, seçili şehirde güneşin doğuş/batış saatleri ve o güne özel kişisel not alanı. Kullanıcı tarih ve şehir seçebilir. Site; uygulamayla aynı görsel dili, içerik kayıtlarını ve kaynak gösterme yaklaşımını kullanır.

Web sitesi ana ekran widget'ı sağlamaz. Kullanıcı notları ilk sürümde Supabase'e gönderilmez ve mobil uygulamayla eşitlenmez; ilgili tarayıcıda saklanır. Site ayrıca KareTakvim'in ne olduğunu, uygulama mağazası bağlantılarını, gizlilik bilgisini ve kısa SSS'yi sunar.

## 2. Hedefler ve kapsam dışı

### Hedefler

- Bugünün sayfasını doğrudan ve hızlı biçimde açmak.
- Mobil uygulamadaki günlük yaprağı, içerik ve şehir seçim mantığıyla tutarlı olmak.
- Tarih paylaşımına uygun, bağlantıyla tekrar açılabilen günlük sayfa sunmak.
- Kullanıcıya aynı tarayıcıda güne not ekleme, düzenleme ve silme imkânı vermek.
- Arama motoru ve uygulama mağazası ziyaretçisine ürünü kısa biçimde tanıtmak.

### İlk sürümde kapsam dışı

- Web push, ana ekran widget'ı, tam çevrimdışı PWA, kullanıcı hesabı ve bulut senkronizasyonu.
- Notların Supabase'e, mobil uygulamaya veya başka tarayıcıya aktarılması.
- Zengin metin editörü, görev/hatırlatma, paylaşım akışı ve yorumlar.
- İçerik yönetim paneli. Editoryal kayıtlar Supabase Dashboard/import üzerinden yönetilir.

## 3. Kullanıcılar ve temel senaryolar

- Uygulamayı yüklemeden önce KareTakvim'i deneyen ziyaretçi.
- Masaüstü veya telefondan günlük takvim sayfasını okumak isteyen kişi.
- Belirli bir tarihi bağlantıyla açmak veya paylaşmak isteyen kullanıcı.
- Hatırlatma amacıyla o güne tarayıcıda kısa bir not bırakmak isteyen kişi.

## 4. Sayfa yapısı

### Günlük sayfa — `/`

- Varsayılan tarih bugündür. Seçili tarih ve şehir, paylaşılabilir URL parametrelerinde tutulur: `/?tarih=2026-11-17&sehir=duzce`.
- Takvim yaprağı görsel alanı: gün numarası, ay, yıl ve haftanın günü.
- O günün önemli gün/tarihi bilgisi; birden fazla kayıt varsa kısa özet ve ayrıntı bağlantısı.
- Günün özlü sözü, biliniyorsa yazar ve kaynak/atıf bilgisi.
- Seçili şehir adıyla güneşin doğuş ve batış saatleri.
- Tarih seçici, önceki/sonraki gün ve bugüne dönme eylemi.
- O güne özel kısa not alanı; açık “Kaydet”, “Düzenle” ve “Sil” eylemleri.
- Dikey ve yatay görsel kompozisyonları ekran oranına göre uyarlanır; metin görselin üzerinde erişilebilir HTML metni olarak da bulunur.

### Tanıtım ve destek sayfaları

- **Hakkında/ana tanıtım:** ürünün tek cümlelik açıklaması, görsel önizleme, App Store/Google Play bağlantıları (yayında olunca), günlük sayfaya geçiş.
- **SSS:** günlük içerik, şehir seçimi, notların nerede saklandığı, mobil widget hakkında kısa cevaplar.
- **Gizlilik:** notun tarayıcıda kaldığı, silme yöntemi, çerez/analitik yaklaşımı.
- **İletişim:** hata ve içerik düzeltme bildirimi için adres/form bağlantısı.

## 5. Fonksiyonel gereksinimler

| ID | Gereksinim | Kabul ölçütü |
|---|---|---|
| WEB-01 | Bugünün sayfası | Ana sayfa yerel ürün saat diliminde bugünü açar; tarih, ay ve haftanın günü görünür. Hesap açma istenmez. |
| WEB-02 | Tarih gezinme | Önceki/sonraki gün ve tarih seçici seçili tarihi değiştirir. `tarih` parametresi URL'e yansır; bağlantı kopyalanıp açıldığında aynı gün gelir. |
| WEB-03 | Şehir seçimi | Türkiye şehirleri aranabilir listeden seçilir. Seçim URL'de veya yerel tercihte korunur; kullanıcı GPS izni vermeye zorlanmaz. |
| WEB-04 | Önemli gün bilgisi | Yayınlanmış bilgi başlığı ve kısa özet sayfanın ana içerik vurgusudur. Ayrıntıda kaynak adı ve varsa kaynak bağlantısı bulunur. Veri yoksa uydurma içerik yerine boş durum gösterilir. |
| WEB-05 | Günlük söz | Söz ve biliniyorsa yazarı/atıfı gösterilir. Yazar/kaynak bilgisi belirsizse yanlış kişiye atfedilmez. |
| WEB-06 | Güneş saatleri | Seçili şehir ve tarihin doğuş/batış saatleri 24 saat biçiminde gösterilir. Şehir adı saatlerle birlikte görünür; farklı şehir ve mevsimlerden referanslarla kontrol edildiğinde gösterilen dakika değeri en fazla 2 dakika sapar. |
| WEB-07 | Tarayıcı notu | Kullanıcı her tarih için bir kısa not kaydeder, düzenler veya siler. Not ilgili tarayıcının yerel depolamasında kalır ve sayfa yeniden açılınca görünür. |
| WEB-08 | Not gizliliği | Not, Supabase'e veya analitik olayına gönderilmez. Arayüz/gizlilik sayfası notun bu tarayıcıda saklandığını ve tarayıcı verileri temizlenirse kaybolabileceğini söyler. |
| WEB-09 | Günlük veri | Supabase'ten sadece yayınlanmış günlük içerik ve şehir verisi okunur; istemci yazma yetkisi taşımaz. Yükleniyor, çevrimdışı, boş ve yeniden dene durumları vardır. |
| WEB-10 | Görsel uyum | Sayfa mobil dikey ekranda, tablette ve masaüstünde eski takvim hissini korur; temel içerik küçük ekranda yatay kaydırma gerektirmez. |
| WEB-11 | Tanıtım sayfaları | Hakkında, SSS, gizlilik ve iletişim sayfaları tüm boyutlarda açılır; mağaza bağlantıları yapılandırılabilir alandan eklenebilir. |
| WEB-12 | Erişilebilirlik | Semantik başlık sırası, klavye ile gezinme, odak göstergesi, ekran okuyucu etiketleri, yeterli kontrast ve görsel dışı metin içerikleri bulunur. |
| WEB-13 | Hata yönetimi | İçerik servisi yanıt vermezse önceden önbelleğe alınmış sayfa varsa gösterilir; yoksa hatanın nedeni ve yeniden deneme seçeneği görünür. Not verisi korunur. |

## 6. Etkileşim ve görsel davranış

- Günlük sayfa, mobil uygulamanın ana tasarım kaynağıyla aynı kâğıt dokusu, tipografi, kenarlık ve tarih hiyerarşisini kullanır. Örnek görsel yalnızca yön duygusu verir; özgün tasarım ve lisanslı/üretilmiş görseller kullanılır.
- Masaüstünde takvim yaprağı ana odakta, gezinme ve şehir seçimi yakında bulunur. Telefonda yaprak önce, ayrıntılar ve not devamında gelir.
- Önemli olay, günlük sözden daha yüksek görsel öncelik taşır: önce olay başlığı/açıklaması, sonra söz ve güneş saatleri gösterilir.
- Metin, arka plan görselinin içine gömülü tek bir bitmap olmamalıdır; seçilebilir ve ekran okuyucuya açık DOM metni bulunmalıdır.
- Tarih veya şehir değişiminde yükleniyor göstergesi kullanılır; notlar yanlış güne taşınmaz.
- Görsel paylaşım/indirme özelliği ilk sürüm için zorunlu değildir; sonraki küçük iyileştirme olarak değerlendirilebilir.

## 7. İçerik ve veri modeli

Mobil uygulamayla ortak Supabase tabloları kullanılır:

- `calendar_days`: tarih, yayın durumu ve sayfa teması.
- `day_events`: tarih, kategori, başlık, kısa açıklama, kaynak adı/URL'si, editoryal kontrol tarihi ve sıralama.
- `daily_quotes`: tarih, söz, yazar, atıf/kaynak ve kullanım hakkı notu.
- `cities`: şehir adı, ülke, saat dilimi ve güneş hesabında kullanılacak koordinatlar.

Güneş saatleri `suncalc` v2.x ile seçili şehrin koordinatlarından istemcide hesaplanır; şehrin IANA saat dilimi için güncel UTC farkı açıkça verilir ve saatler `Intl.DateTimeFormat` ile bu saat diliminde biçimlendirilir. Güneş hesabı için üçüncü taraf konum servisi çağrılmaz. Şehir koordinatları Supabase'ten veya yerel önbellekten gelir. Türkiye şehirleri `Europe/Istanbul` kullanır. Farklı mevsim ve şehirlerden referanslarla doğrulanmalı; kabul hedefi gösterilen dakika değerinde en fazla 2 dakika farktır.

İçerik Supabase Dashboard/import üzerinden yönetilir; MVP'de özel CMS yazılmaz. İlk beta öncesi en az 30 günlük ileri günlük içerik kuyruğu hazır olmalıdır. Her olayın kaynak bilgisi ve kontrol tarihi olmalı; belirsiz/alınmış haklı söz veya görsel yayımlanmamalıdır.

## 8. Teknik yaklaşım

- **Astro + TypeScript:** tanıtım, SSS ve gizlilik sayfaları statik üretilebilir; günlük görünüm için tarih/şehir seçimi ve veri okuma yapan küçük istemci kodu kullanılır.
- **Dağıtım:** Vercel'de statik site. Günlük içerik tarayıcıdan Supabase'in güvenli, herkese açık okuma katmanına bağlanır.
- **Durum ve depolama:** seçili gün URL parametresinde; şehir ve not yerel tarayıcı deposunda. Günlük içerik gerekirse küçük yerel önbellekte tutulur.
- **Not anahtarı:** her tarihe ayrı anahtar; örneğin `kare-takvim:note:2026-11-17`. Notlar uygulama sunucusuna gönderilmez.
- **SEO:** tanıtım, SSS ve gizlilik sayfaları statik başlık/açıklama ve sitemap ile indekslenebilir. Tarih seçimi client-side olduğundan her olası gün için ayrı arama motoru sayfası üretmek MVP şartı değildir.
- **Sır yönetimi:** Supabase publishable key istemcide kullanılabilir; tüm açık tablolar için RLS ve sadece gerekli `SELECT` izni gerekir. Secret key web bundle'ına konmaz.

## 9. Gizlilik ve güvenlik

- GPS konumu istenmez. Güneş saatleri şehir seçimine dayanır.
- Notlar localStorage/uygun tarayıcı yerel deposunda kalır; uygulama API'sine ve analitik sistemine gönderilmez.
- Gizlilik sayfasında notların tarayıcı verileri temizlenince kaybolabileceği açıkça belirtilir.
- Supabase'te halka açık erişim yalnızca yayımlanmış, kullanıcıya gösterilmesi amaçlanan içerikle sınırlanır. İçerik tablolarına istemciden `INSERT`, `UPDATE` veya `DELETE` verilmez.
- Supabase secret key hiçbir tarayıcı koduna veya statik build çıktısına girmez.

## 10. Performans ve erişilebilirlik

- İlk ekranda önce sayfa iskeleti ve tarih, ardından günlük içerik yüklenir.
- Görseller uygun boyutta sunulur ve ekran ölçüsüne göre yüklenir; mobil bağlantıda gereksiz büyük görsel indirilmez.
- Sayfa 320 px genişlikten masaüstüne kadar yatay taşma olmadan çalışır.
- Klavye ile tarih kontrolleri ve not alanı kullanılabilir; her görsel için anlamlı alternatif metin bulunur.
- Büyük yazı boyutu ve yüksek kontrastta tarih, önemli bilgi, söz ve güneş saatleri okunur kalır.

## 11. Başarı ölçümleri

- Günlük sayfanın başarıyla yüklenme oranı.
- Tarih gezinmesi ve not oluşturma kullanan ziyaretçi oranı (not metni ölçülmeden).
- Mobil cihazlardan günlük sayfaya tekrar ziyaret.
- Uygulama mağazası bağlantılarına tıklama.
- Hata oranı, sayfa açılış performansı ve erişilebilirlik sorunları.

## 12. Yayın öncesi kabul listesi

- [ ] Bugünün tarihi ve haftanın günü İstanbul saat diliminde doğru.
- [ ] URL'deki tarih/şehir ile sayfa aynı durumu açıyor ve paylaşılabiliyor.
- [ ] Şehir/tarih değişince güneş saatleri güncelleniyor ve referansla doğrulanmış.
- [ ] Notlar tarihe göre ayrılıyor, yeniden açılışta duruyor, silinebiliyor ve sunucuya gönderilmiyor.
- [ ] Supabase istemcisi yalnızca yayımlanmış içerik okuyabiliyor; hiçbir secret key statik dosyalara girmiyor.
- [ ] Ağ kesintisi, içeriksiz gün ve servis hatası için anlaşılır durumlar var.
- [ ] Hakkında, SSS, gizlilik ve iletişim sayfaları mobil ve masaüstünde erişilebilir.

## 13. Aşamalı teslimat

1. **Görsel prototip:** günlük yaprak, mobil/masaüstü düzeni ve tarih gezinme.
2. **Günlük deneyim:** Supabase'ten yayınlanmış içerik, şehir seçimi, güneş saatleri ve tarayıcı notu.
3. **Tanıtım:** Hakkında, mağaza bağlantıları, SSS, gizlilik ve iletişim.
4. **Yayın hazırlığı:** içerik kaynaklarının kontrolü, erişilebilirlik, hata/çevrimdışı davranışı ve temel ölçümleme.

## 14. Teknik dayanaklar

- [Astro yapılandırması — statik çıktı](https://docs.astro.build/en/reference/configuration-reference/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase API anahtarları — publishable/secret ayrımı](https://supabase.com/docs/guides/getting-started/api-keys)
- [SunCalc — güneş doğuş/batış hesabı ve saat dilimi davranışı](https://github.com/mourner/suncalc)
