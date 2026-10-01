// Gratis-Grenze: ohne Numismatik Pro kann ein Kunde höchstens FREE_COIN_LIMIT Münzen speichern.
// Bestehende Münzen über der Grenze bleiben sichtbar und bearbeitbar; nur neue werden blockiert.

export const FREE_COIN_LIMIT = 100;

const PRO_STORAGE_PREFIX = 'numismatik_pro_entitlement:';

export interface StoredProEntitlement {
  productId: string;
  expiresAt: string;
}

function proStorageKey(uid: string): string {
  return `${PRO_STORAGE_PREFIX}${uid}`;
}

export function saveProEntitlement(uid: string, entitlement: StoredProEntitlement): void {
  if (!uid) return;
  try {
    localStorage.setItem(proStorageKey(uid), JSON.stringify({ productId: entitlement.productId, expiresAt: entitlement.expiresAt }));
  } catch {
    /* ignore */
  }
}

export function loadProEntitlement(uid: string | null | undefined): StoredProEntitlement | null {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(proStorageKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredProEntitlement>;
    if (typeof parsed.productId !== 'string' || typeof parsed.expiresAt !== 'string') return null;
    if (!Number.isFinite(Date.parse(parsed.expiresAt))) return null;
    return { productId: parsed.productId, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

export function isProEntitlementActive(entitlement: StoredProEntitlement | null, now = Date.now()): boolean {
  return Boolean(entitlement && Date.parse(entitlement.expiresAt) > now);
}

export interface CoinLimitContext {
  enforced: boolean;
  isPro: boolean;
  isAdmin: boolean;
}

export function isCoinLimitActive(context: CoinLimitContext): boolean {
  return context.enforced && !context.isPro && !context.isAdmin;
}

/** Wie viele neue Münzen noch gespeichert werden dürfen (Infinity = unbegrenzt). */
export function remainingFreeCoins(currentCount: number, context: CoinLimitContext): number {
  if (!isCoinLimitActive(context)) return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_COIN_LIMIT - currentCount);
}

export function canAddCoins(currentCount: number, adding: number, context: CoinLimitContext): boolean {
  return adding <= remainingFreeCoins(currentCount, context);
}
