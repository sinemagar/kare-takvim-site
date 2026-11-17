// Güne özel not: yalnızca bu tarayıcının localStorage'ında, anahtar kare-takvim:note:YYYY-MM-DD.
// Not hiçbir sunucuya veya analitiğe gönderilmez.
import { read, remove, write } from './storage';
import type { ISODate } from './types';

export const NOTE_MAX_LENGTH = 500;

export interface DailyNote {
  date: ISODate;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export function getNote(date: ISODate): DailyNote | null {
  const raw = read(`note:${date}`);
  if (!raw) return null;
  try {
    const n = JSON.parse(raw) as DailyNote;
    return typeof n.body === 'string' && n.date === date ? n : null;
  } catch {
    // Eski/düz metin kayıt: kaybetmemek için not olarak kabul et.
    return { date, body: raw, createdAt: '', updatedAt: '' };
  }
}

/** Boş metin kaydedilmez. Başarısızsa false (ör. depolama kapalı). */
export function saveNote(date: ISODate, body: string): boolean {
  const text = body.trim().slice(0, NOTE_MAX_LENGTH);
  if (!text) return false;
  const now = new Date().toISOString();
  const prev = getNote(date);
  const note: DailyNote = { date, body: text, createdAt: prev?.createdAt || now, updatedAt: now };
  return write(`note:${date}`, JSON.stringify(note));
}

export function deleteNote(date: ISODate): boolean {
  return remove(`note:${date}`);
}
