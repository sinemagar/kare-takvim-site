// Tarayıcı yerel deposu. Erişim engellenirse (gizli pencere, kapalı site verisi) sessizce null döner.
export const KEY_PREFIX = 'kare-takvim';

export function read(key: string): string | null {
  try {
    return window.localStorage.getItem(`${KEY_PREFIX}:${key}`);
  } catch {
    return null;
  }
}

export function write(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(`${KEY_PREFIX}:${key}`, value);
    return true;
  } catch {
    return false;
  }
}

export function remove(key: string): boolean {
  try {
    window.localStorage.removeItem(`${KEY_PREFIX}:${key}`);
    return true;
  } catch {
    return false;
  }
}
