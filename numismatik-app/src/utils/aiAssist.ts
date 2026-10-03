const AUTO_AI_STORAGE_KEY = 'numismatik_auto_ai_recognition';
const AI_SERVER_BASE_URL = 'https://inumis-node-backend.onrender.com';
const WAKE_INTERVAL_MS = 5 * 60 * 1000;

export function loadAutoAiRecognition(): boolean {
  try {
    return localStorage.getItem(AUTO_AI_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveAutoAiRecognition(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(AUTO_AI_STORAGE_KEY, '1');
    else localStorage.removeItem(AUTO_AI_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

let lastWakeAt = 0;

/** Weckt den Render-Gratis-Server auf, damit die KI-Erkennung nicht erst auf den Kaltstart (~50 s) warten muss. */
export function wakeAiServer(now = Date.now()): boolean {
  if (now - lastWakeAt < WAKE_INTERVAL_MS) return false;
  lastWakeAt = now;
  if (typeof fetch !== 'function') return false;
  void fetch(`${AI_SERVER_BASE_URL}/`, { mode: 'no-cors', cache: 'no-store' }).catch(() => undefined);
  return true;
}
