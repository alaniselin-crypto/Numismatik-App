// Hell/Dunkel-Umschaltung. Speichert die Wahl und setzt die Klasse <html class="light">.
export type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'numismatik_theme';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  return window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('light', mode === 'light');
}

export function setTheme(mode: ThemeMode): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_KEY, mode);
  }
  applyTheme(mode);
}
