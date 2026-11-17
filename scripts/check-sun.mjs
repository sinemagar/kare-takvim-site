// Güneş saatlerini bağımsız referansla karşılaştırır (kabul: ≤ 2 dk).
// src/lib/sun.ts ile aynı hesap: suncalc.getTimes(öğlen UTC, lat, lng, 0, 180) + Intl Europe/Istanbul.
// Referans: timeanddate.com/sun/turkey/<şehir> (erişim 2026-11-18).
// Kullanım: node scripts/check-sun.mjs
import { readFileSync } from 'node:fs';
import { getTimes } from 'suncalc';

const cities = Object.fromEntries(
  JSON.parse(readFileSync(new URL('../src/data/cities.json', import.meta.url), 'utf8')).map(([id, , lat, lng]) => [id, { lat, lng }]),
);
const refs = [
  ['istanbul', '2026-06-21', '05:32', '20:39'],
  ['ankara', '2026-12-21', '08:06', '17:26'],
  ['erzurum', '2026-03-21', '06:17', '18:27'],
  ['izmir', '2026-09-23', '06:59', '19:07'],
];
const fmt = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const mins = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
let fail = 0;
console.log('şehir     tarih       doğuş(hesap/ref)  batış(hesap/ref)  fark');
for (const [id, date, rise, set] of refs) {
  const t = getTimes(new Date(`${date}T12:00:00Z`), cities[id].lat, cities[id].lng, 0, 180);
  const r = fmt.format(t.sunrise);
  const s = fmt.format(t.sunset);
  const diff = Math.max(Math.abs(mins(r) - mins(rise)), Math.abs(mins(s) - mins(set)));
  if (diff > 2) fail++;
  console.log(`${id.padEnd(9)} ${date}  ${r} / ${rise}     ${s} / ${set}     ${diff} dk ${diff > 2 ? 'HATA' : 'ok'}`);
}
process.exit(fail ? 1 : 0);
