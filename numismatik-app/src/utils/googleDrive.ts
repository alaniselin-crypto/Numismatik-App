/**
 * Google Drive: Speichert die Münzfotos in voller Grösse im eigenen Google Drive.
 * In der App selbst bleibt nur ein kleines Vorschaubild gespeichert.
 *
 * Der Google-Zugriff wird einmalig über ein Anmeldefenster geholt (Knopfdruck)
 * und für ca. 1 Stunde zwischengespeichert.
 */
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { auth } from '../lib/firebase';

const TOKEN_KEY = 'numismatik_drive_token';
const ENABLED_KEY = 'numismatik_drive_enabled';
const FOLDER_KEY = 'numismatik_drive_folder';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const DRIVE_FOLDER_NAME = 'Numismatik.App Fotos';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

interface CachedToken {
  token: string;
  expiresAt: number;
}

function readToken(): CachedToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedToken;
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Drive funktioniert nur in der Desktop-/Browser-App, nicht auf dem iPhone. */
export function driveSupported(): boolean {
  return typeof window !== 'undefined' && !Capacitor.isNativePlatform();
}

export function isDriveEnabled(): boolean {
  return driveSupported() && localStorage.getItem(ENABLED_KEY) === '1';
}

export function hasValidDriveToken(): boolean {
  const cached = readToken();
  return !!cached && cached.expiresAt > Date.now() + 60_000;
}

export function driveStatus(): 'off' | 'connected' | 'expired' {
  if (!driveSupported() || !isDriveEnabled()) return 'off';
  return hasValidDriveToken() ? 'connected' : 'expired';
}

/** Wird über einen Knopfdruck aufgerufen (Anmeldefenster braucht eine Nutzeraktion). */
export async function connectDrive(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_SCOPE);
  const credential = await signInWithPopup(auth, provider);
  const accessToken = (credential as unknown as { _tokenResponse?: { oauthAccessToken?: string } })._tokenResponse?.oauthAccessToken
    ?? (GoogleAuthProvider.credentialFromResult(credential) as unknown as { accessToken?: string } | null)?.accessToken;
  if (!accessToken) {
    throw new Error('Google-Zugriff konnte nicht geholt werden. Bitte erneut versuchen.');
  }
  // Google-Tokens laufen nach ca. 1 Stunde ab; mit Puffer speichern.
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: accessToken, expiresAt: Date.now() + 55 * 60_000 }));
  localStorage.setItem(ENABLED_KEY, '1');
  await getOrCreateDriveFolder(accessToken);
}

export function disconnectDrive(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ENABLED_KEY);
  localStorage.removeItem(FOLDER_KEY);
}

async function getOrCreateDriveFolder(token: string): Promise<string> {
  const cached = localStorage.getItem(FOLDER_KEY);
  if (cached) return cached;

  const query = encodeURIComponent(
    `name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
  );
  const listRes = await fetch(`${DRIVE_API}/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (listRes.ok) {
    const data = (await listRes.json()) as { files?: { id: string; name: string }[] };
    const existing = data.files?.[0]?.id;
    if (existing) {
      localStorage.setItem(FOLDER_KEY, existing);
      return existing;
    }
  }

  const createRes = await fetch(`${DRIVE_API}/files?fields=id`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: DRIVE_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  if (!createRes.ok) {
    throw new Error(`Google Drive Ordner konnte nicht erstellt werden (${createRes.status}).`);
  }
  const created = (await createRes.json()) as { id: string };
  localStorage.setItem(FOLDER_KEY, created.id);
  return created.id;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',');
  const mimeMatch = /data:([^;]+)/.exec(meta);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Lädt ein Foto nach Google Drive hoch. Gibt die Drive-Datei-ID zurück oder
 * null, wenn keine gültige Verbindung besteht / der Upload fehlschlägt.
 */
export async function uploadDrivePhoto(dataUrl: string, fileName: string): Promise<string | null> {
  const cached = readToken();
  if (!cached || cached.expiresAt <= Date.now() + 60_000) return null;
  try {
    const folderId = await getOrCreateDriveFolder(cached.token);
    const metadata = { name: fileName, parents: [folderId], mimeType: 'image/jpeg' };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', dataUrlToBlob(dataUrl));
    const res = await fetch(`${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cached.token}` },
      body: form,
    });
    if (!res.ok) return null;
    const created = (await res.json()) as { id?: string };
    return created.id ?? null;
  } catch {
    return null;
  }
}

/** Löscht ein Foto aus Google Drive (bestmöglich – Fehler werden ignoriert). */
export async function deleteDrivePhoto(fileId: string): Promise<void> {
  const cached = readToken();
  if (!cached || !fileId) return;
  try {
    await fetch(`${DRIVE_API}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cached.token}` },
    });
  } catch {
    // still
  }
}

const fullPhotoCache = new Map<string, string>();

/**
 * Holt ein Foto in voller Grösse aus Google Drive (z.B. für die Detailansicht)
 * und merkt es sich im Arbeitsspeicher. Gibt null zurück, wenn nicht möglich.
 */
export async function fetchDrivePhotoUrl(fileId: string): Promise<string | null> {
  const cached = fullPhotoCache.get(fileId);
  if (cached) return cached;
  const cachedToken = readToken();
  if (!cachedToken || cachedToken.expiresAt <= Date.now() + 60_000) return null;
  try {
    const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${cachedToken.token}` },
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    fullPhotoCache.set(fileId, url);
    return url;
  } catch {
    return null;
  }
}
