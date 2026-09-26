// Administrator-Erkennung.
// Nur der Administrator (Besitzer der App) sieht und verwaltet die "Eigenen Felder".
// Käufer der App sehen davon nichts.

const ADMIN_STORAGE_KEY = 'numismatik_admin_mode';
const ADMIN_UNLOCK_CODE = 'MZ-ADMIN';

// E-Mail-Adressen, die immer als Administrator gelten.
export const ADMIN_EMAILS: string[] = [
  // z.B. 'meine-adresse@example.com'
];

export function isLocalAdminEnabled(): boolean {
  try {
    return localStorage.getItem(ADMIN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setLocalAdmin(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(ADMIN_STORAGE_KEY, '1');
    else localStorage.removeItem(ADMIN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function unlockAdmin(code: string): boolean {
  if (code.trim().toUpperCase() === ADMIN_UNLOCK_CODE) {
    setLocalAdmin(true);
    return true;
  }
  return false;
}

export function isAdminUser(email?: string | null): boolean {
  if (isLocalAdminEnabled()) return true;
  if (!email) return false;
  return ADMIN_EMAILS.some(entry => entry.toLowerCase() === email.toLowerCase());
}
