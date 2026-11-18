// Günlük sayfa etkileşimi: URL durumu (?tarih=&sehir=), içerik yükleme, güneş saatleri, şehir seçimi ve tarayıcı notu.
// Tüm dinamik metin textContent ile yazılır (HTML enjeksiyonu yok).
import { CITIES, DEFAULT_CITY_ID, findCity, searchCities } from '../lib/cities';
import { loadCities, loadDay } from '../lib/content';
import { categoryKey, pageArtKey } from '../lib/art';
import { addDays, dateParts, isValidISODate, todayISO, yearProgress } from '../lib/date';
import { deleteNote, getNote, saveNote } from '../lib/notes';
import { read, write } from '../lib/storage';
import { sunProgress, sunTimes } from '../lib/sun';
import { eventLabel, hasDemo } from '../lib/supabase-query';
import type { City, DayContent, DayEvent, ISODate } from '../lib/types';

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Eksik öğe: ${sel}`);
  return el;
};

const leaf = $('[data-leaf]');
const els = {
  long: $('[data-long]'),
  monthYear: $('[data-month-year]'),
  weekday: $('[data-weekday]'),
  dayNumber: $('[data-day-number]'),
  prev: $<HTMLButtonElement>('[data-prev]'),
  next: $<HTMLButtonElement>('[data-next]'),
  today: $<HTMLButtonElement>('[data-today]'),
  dateInput: $<HTMLInputElement>('[data-date-input]'),
  dateOpen: $<HTMLButtonElement>('[data-date-open]'),
  bandBody: $('[data-band-body]'),
  leafBody: $('[data-leaf-body]'),
  hero: $('[data-hero]'),
  heroMonth: $('[data-hero-month]'),
  heroWeekday: $('[data-hero-weekday]'),
  progress: $('[data-progress]'),
  special: $('[data-special]'),
  specialLabel: $('[data-special-label]'),
  specialTitle: $('[data-special-title]'),
  specialSummary: $('[data-special-summary]'),
  specialSources: $('[data-special-sources]'),
  memorial: $('[data-memorial]'),
  pageArt: $<HTMLImageElement>('[data-page-art]'),
  event: $('[data-event]'),
  eventLabel: $('#event-label'),
  eventHead: $('[data-event-head]'),
  eventBody: $('[data-event-body]'),
  spot: $<HTMLImageElement>('[data-spot]'),
  sky: $('[data-sky]'),
  sunDot: $('[data-sun-dot]'),
  sunStatus: $('[data-sun-status]'),
  noteLinks: $('[data-note-links]'),
  quote: $('[data-quote]'),
  quoteText: $('[data-quote-text]'),
  quoteSource: $('[data-quote-source]'),
  cityName: $('[data-city-name]'),
  cityOpen: $<HTMLButtonElement>('[data-city-open]'),
  sunrise: $('[data-sunrise]'),
  sunset: $('[data-sunset]'),
  status: $('[data-status]'),
  demoBadge: $('[data-demo-badge]'),
  noteView: $('[data-note-view]'),
  noteText: $('[data-note-text]'),
  noteEdit: $<HTMLButtonElement>('[data-note-edit]'),
  noteDelete: $<HTMLButtonElement>('[data-note-delete]'),
  noteForm: $<HTMLFormElement>('[data-note-form]'),
  noteInput: $<HTMLTextAreaElement>('[data-note-input]'),
  noteCancel: $<HTMLButtonElement>('[data-note-cancel]'),
  cityDialog: $<HTMLDialogElement>('[data-city-dialog]'),
  citySearch: $<HTMLInputElement>('[data-city-search]'),
  cityList: $('[data-city-list]'),
};

let cities: City[] = CITIES;
let currentDate: ISODate = todayISO();
let currentCity: City = findCity(DEFAULT_CITY_ID)!;
let loadToken = 0;

// ---------- URL ve tercih ----------
function readStateFromUrl() {
  const params = new URLSearchParams(location.search);
  const tarih = params.get('tarih');
  currentDate = isValidISODate(tarih) ? tarih : todayISO();
  const sehir = params.get('sehir') ?? read('city');
  currentCity = findCity(sehir, cities) ?? findCity(DEFAULT_CITY_ID, cities) ?? cities[0];
}

function writeUrl(push: boolean) {
  const params = new URLSearchParams(location.search);
  if (currentDate === todayISO()) params.delete('tarih');
  else params.set('tarih', currentDate);
  if (currentCity.id === DEFAULT_CITY_ID && !params.has('sehir')) params.delete('sehir');
  else params.set('sehir', currentCity.id);
  const qs = params.toString();
  const url = `${location.pathname}${qs ? `?${qs}` : ''}`;
  if (url === `${location.pathname}${location.search}`) return;
  history[push ? 'pushState' : 'replaceState'](null, '', url);
}

// ---------- Render ----------
function renderDate() {
  const p = dateParts(currentDate);
  const isToday = currentDate === todayISO();
  els.long.textContent = `${p.long}${isToday ? ', bugün' : ''}`;
  const y = yearProgress(currentDate);
  els.monthYear.textContent = p.monthYear.toLocaleUpperCase('tr-TR');
  els.weekday.textContent = p.weekday;
  els.dayNumber.textContent = p.dayNumber;
  els.heroMonth.textContent = p.monthYear.toLocaleUpperCase('tr-TR');
  els.heroWeekday.textContent = p.weekday;
  els.progress.textContent = `${y.dayOfYear}. GÜN · ${y.week}. HAFTA`;
  els.dateInput.value = currentDate;
  els.today.hidden = isToday;
  document.title = `${p.long} · KareTakvim`;
}

function renderSun() {
  const t = sunTimes(currentDate, currentCity);
  els.cityName.textContent = currentCity.name;
  els.sunrise.textContent = t.sunrise ?? '—';
  els.sunset.textContent = t.sunset ?? '—';
  // Güneşin yolu: yalnızca bugün ve gündüz; konum CSS geçişiyle yumuşakça değişir.
  const isToday = currentDate === todayISO();
  const prog = isToday ? sunProgress(t) : null;
  const toMin = (v: string | null) => (v ? Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5)) : null);
  const rise = toMin(t.sunrise);
  const set = toMin(t.sunset);
  const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`);
  let status = rise != null && set != null ? `Gün uzunluğu ${dur(set - rise)}` : '';
  if (isToday && rise != null && set != null) {
    const now = new Date();
    const cur = (now.getUTCHours() * 60 + now.getUTCMinutes() + 180) % 1440; // Türkiye UTC+3
    if (cur < rise) status = `Güneşin doğmasına ${dur(rise - cur)}`;
    else if (cur <= set) status = `Güneşin batmasına ${dur(set - cur)}`;
    else status = 'Güneş battı · iyi akşamlar';
  }
  els.sunStatus.textContent = status;
  els.sunDot.hidden = prog == null;
  if (prog == null) {
    els.sunDot.style.left = '0px';
    els.sunDot.style.top = '62px';
    return;
  }
  // Kuadratik Bézier: P0(18,62) P1(150,-38) P2(282,62), viewBox 300x86 (yükseklik sabit 86px).
  const u = 1 - prog;
  const x = u * u * 18 + 2 * u * prog * 150 + prog * prog * 282;
  const y = u * u * 62 + 2 * u * prog * -38 + prog * prog * 62;
  const w = els.sky.clientWidth;
  requestAnimationFrame(() => {
    els.sunDot.style.left = `${(x / 300) * w}px`;
    els.sunDot.style.top = `${y}px`;
  });
}

function setStatus(message: string, kind: 'info' | 'error' = 'info', retry = false) {
  els.status.textContent = message;
  els.status.dataset.kind = kind;
  if (retry) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.textContent = 'Yeniden dene';
    b.addEventListener('click', () => void refreshContent());
    els.status.append(b);
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function safeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

function sourceNode(name: string, url: string | null): Node {
  const href = safeUrl(url);
  if (!href) return document.createTextNode(name);
  const a = el('a', undefined, name);
  a.href = href;
  a.rel = 'noopener noreferrer';
  a.target = '_blank';
  a.append(el('span', 'visually-hidden', ' (yeni sekmede açılır)'));
  return a;
}

function sourceLine(e: DayEvent) {
  const p = el('p', 'event-source');
  p.append('Kaynak: ', sourceNode(e.sourceName, e.sourceUrl));
  if (e.source2Name) p.append(' · ', sourceNode(e.source2Name, e.source2Url));
  return p;
}

/** Gün rakamını ve özel gün başlığını banda ya da gövdeye yerleştirir. */
function placeHero(inBand: boolean) {
  if (inBand) {
    leaf.dataset.band = '';
    els.bandBody.append(els.hero, els.special);
  } else {
    delete leaf.dataset.band;
    els.leafBody.prepend(els.hero);
    els.today.after(els.special);
  }
}

function renderSkeleton() {
  leaf.setAttribute('aria-busy', 'true');
  placeHero(false);
  els.special.hidden = true;
  els.pageArt.hidden = true;
  els.event.hidden = false;
  els.spot.hidden = true;
  els.eventHead.replaceChildren(el('div', 'skeleton skeleton--title'));
  els.eventBody.replaceChildren(el('div', 'skeleton'), el('div', 'skeleton skeleton--short'));
  els.quote.hidden = true;
  els.demoBadge.hidden = true;
  els.eventLabel.textContent = ' ';
  delete leaf.dataset.theme;
  delete leaf.dataset.tier;
}

function emptyState(failed: boolean) {
  const box = el('div', 'event-empty');
  const img = el('img');
  img.src = failed ? '/art/durum-cevrimdisi.webp' : '/art/durum-bos.webp';
  img.alt = '';
  img.width = 900;
  img.height = 675;
  box.append(
    img,
    el('h2', undefined, failed ? 'Yaprak şu an getirilemedi' : 'Bu yaprak henüz yazılmadı'),
    el('p', undefined, failed ? 'Bağlantını kontrol edip yeniden dene. Notların yerinde duruyor.' : 'Bu gün için yayımlanmış bir bilgi yok.'),
  );
  return box;
}

function moreEvents(rest: DayEvent[]) {
  const details = el('details', 'more-events');
  details.append(el('summary', undefined, `${rest.length} bilgi daha`));
  const ul = el('ul');
  for (const e of rest) {
    const li = el('li');
    li.append(el('h3', undefined, e.title), el('p', 'event-summary', e.summary), sourceLine(e));
    ul.append(li);
  }
  details.append(ul);
  return details;
}

function renderContent(day: DayContent) {
  leaf.setAttribute('aria-busy', 'false');
  if (day.theme) leaf.dataset.theme = day.theme;
  const [first] = day.events;
  const special = first?.tier === 'ozel' ? first : null;
  if (special) leaf.dataset.tier = 'ozel';
  // Millî ve dinî günlerde bant aşağı uzar; anma gününde sade kalır.
  placeHero(special != null && day.theme !== 'anma');

  els.special.hidden = !special;
  if (special) {
    els.specialLabel.textContent = eventLabel(special);
    els.specialTitle.textContent = special.title;
    els.specialSummary.textContent = special.summary;
    els.memorial.hidden = !(day.theme === 'anma' && currentDate.endsWith('-11-10'));
    els.specialSources.replaceChildren(sourceLine(special));
  }

  const art = pageArtKey(day);
  els.pageArt.hidden = !art;
  if (art) els.pageArt.src = `/art/sayfa-${art}.webp`;

  const rest = special ? day.events.slice(1) : day.events;
  const [main, ...others] = rest;
  // Yayımlanmış bilgi yoksa olay kartı hiç görünmez.
  els.event.hidden = !main;
  if (!main) {
    els.eventLabel.textContent = eventLabel(undefined);
    els.spot.hidden = true;
    els.eventHead.replaceChildren();
    els.eventBody.replaceChildren(emptyState(false));
  } else {
    els.eventLabel.textContent = eventLabel(main);
    els.spot.src = `/art/kategori-${categoryKey(main.category)}.webp`;
    els.spot.hidden = false;
    els.eventHead.replaceChildren(el('h2', 'event-title', main.title));
    const nodes: Node[] = [el('p', 'event-summary', main.summary), sourceLine(main)];
    if (others.length) nodes.push(moreEvents(others));
    els.eventBody.replaceChildren(...nodes);
  }

  if (day.quote) {
    els.quote.hidden = false;
    els.quoteText.textContent = day.quote.text;
    // Yazar doğrulanmadıysa kişiye atıf yapılmaz; yalnızca kaynak adı gösterilir.
    const attribution = day.quote.author ?? day.quote.sourceName;
    els.quoteSource.textContent = attribution ? `— ${attribution}` : '';
  } else {
    els.quote.hidden = true;
  }
  els.demoBadge.hidden = !hasDemo(day);
}

async function refreshContent() {
  const token = ++loadToken;
  const date = currentDate;
  renderSkeleton();
  setStatus('');
  const result = await loadDay(date);
  if (token !== loadToken) return; // Kullanıcı bu sırada başka güne geçti.
  if (result.ok) {
    renderContent(result.day);
    if (result.offline) setStatus('Bağlantı kurulamadı. Daha önce kaydedilen içerik gösteriliyor.');
  } else {
    leaf.setAttribute('aria-busy', 'false');
    els.eventLabel.textContent = eventLabel(undefined);
    els.eventHead.replaceChildren();
    els.eventBody.replaceChildren(emptyState(true));
    setStatus(
      result.reason === 'offline'
        ? 'Çevrimdışısın. Bağlantını kontrol edip yeniden dene.'
        : 'İçerik servisine ulaşılamadı.',
      'error',
      true,
    );
  }
}

// ---------- Not ----------
function renderNote(editing = false) {
  const note = getNote(currentDate);
  const showView = Boolean(note) && !editing;
  els.noteView.hidden = !showView;
  els.noteLinks.hidden = !showView;
  els.noteForm.hidden = showView;
  els.noteCancel.hidden = !note;
  if (note) els.noteText.textContent = note.body;
  if (!showView) els.noteInput.value = note?.body ?? '';
}

els.noteForm.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const text = els.noteInput.value;
  if (!text.trim()) return;
  if (saveNote(currentDate, text)) {
    renderNote();
    els.noteEdit.focus();
  } else {
    setStatus('Not kaydedilemedi: tarayıcı yerel depolamaya izin vermiyor.', 'error');
  }
});
els.noteEdit.addEventListener('click', () => {
  renderNote(true);
  els.noteInput.focus();
});
els.noteText.addEventListener('click', () => {
  renderNote(true);
  els.noteInput.focus();
});
els.noteCancel.addEventListener('click', () => {
  renderNote();
  els.noteEdit.focus();
});
els.noteDelete.addEventListener('click', () => {
  if (!confirm('Bu günün notu silinsin mi?')) return;
  deleteNote(currentDate);
  renderNote();
  els.noteInput.focus();
});

// ---------- Gezinme ----------
function goTo(date: ISODate, push = true) {
  if (!isValidISODate(date)) return;
  currentDate = date;
  writeUrl(push);
  renderDate();
  renderSun();
  renderNote();
  void refreshContent();
}

els.prev.addEventListener('click', () => goTo(addDays(currentDate, -1)));
els.next.addEventListener('click', () => goTo(addDays(currentDate, 1)));
els.today.addEventListener('click', () => goTo(todayISO()));
els.dateOpen.addEventListener('click', () => {
  try {
    els.dateInput.showPicker();
  } catch {
    // showPicker desteklenmiyorsa giriş alanına odaklan.
    els.dateInput.focus();
  }
});
els.dateInput.addEventListener('change', () => {
  if (isValidISODate(els.dateInput.value)) goTo(els.dateInput.value);
});
document.addEventListener('keydown', (ev) => {
  const t = ev.target as HTMLElement | null;
  if (t && (t.closest('input, textarea, select, dialog') || t.isContentEditable)) return;
  if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
  if (ev.key === 'ArrowLeft') goTo(addDays(currentDate, -1));
  if (ev.key === 'ArrowRight') goTo(addDays(currentDate, 1));
});
window.addEventListener('popstate', () => {
  readStateFromUrl();
  goTo(currentDate, false);
});
// Gün değişimi: sekme tekrar görünür olduğunda URL'de tarih yoksa yeni bugüne geç.
let lastToday = todayISO();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const now = todayISO();
  if (now !== lastToday) {
    const followToday = currentDate === lastToday;
    lastToday = now;
    if (followToday) goTo(now, false);
    else renderDate();
  }
});

// ---------- Şehir ----------
function renderCityList(query = '') {
  const list = searchCities(query, cities);
  const items = list.map((c) => {
    const li = el('li');
    const b = el('button', undefined, c.name);
    b.type = 'button';
    b.dataset.cityId = c.id;
    if (c.id === currentCity.id) b.setAttribute('aria-current', 'true');
    li.append(b);
    return li;
  });
  if (!items.length) items.push(el('li', 'city-hint', 'Eşleşen şehir yok.'));
  els.cityList.replaceChildren(...items);
}

els.cityOpen.addEventListener('click', () => {
  els.citySearch.value = '';
  renderCityList();
  els.cityDialog.showModal();
  els.citySearch.focus();
});
els.citySearch.addEventListener('input', () => renderCityList(els.citySearch.value));
els.citySearch.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') {
    ev.preventDefault();
    els.cityList.querySelector<HTMLButtonElement>('button')?.click();
  }
});
els.cityList.addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-city-id]');
  const city = b && findCity(b.dataset.cityId, cities);
  if (!city) return;
  currentCity = city;
  write('city', city.id);
  const params = new URLSearchParams(location.search);
  params.set('sehir', city.id);
  history.replaceState(null, '', `${location.pathname}?${params}`);
  renderSun();
  els.cityDialog.close();
  els.cityOpen.focus();
});

window.addEventListener('resize', () => renderSun());
// Güneş dakikada bir ilerler.
setInterval(() => {
  if (document.visibilityState === 'visible' && currentDate === todayISO()) renderSun();
}, 30_000);

// ---------- Başlat ----------
readStateFromUrl();
renderDate();
renderSun();
renderNote();
void refreshContent();
void loadCities().then((list) => {
  if (list === CITIES) return;
  cities = list;
  const updated = findCity(currentCity.id, cities);
  if (updated) {
    currentCity = updated;
    renderSun();
  }
});
