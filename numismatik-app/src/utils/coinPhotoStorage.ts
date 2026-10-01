import { deleteObject, getDownloadURL, listAll, ref, uploadString } from 'firebase/storage';
import type { StorageReference } from 'firebase/storage';
import { storage } from '../lib/firebase';

export type CoinPhotoSide = 'front' | 'back';

const UPLOAD_TIMEOUT_MS = 25000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      value => { clearTimeout(timer); resolve(value); },
      () => { clearTimeout(timer); resolve(null); },
    );
  });
}

export function coinPhotoPath(uid: string, coinId: string, side: CoinPhotoSide, timestamp = Date.now()): string {
  const safeCoinId = coinId.replace(/[^A-Za-z0-9_-]/g, '_');
  return `users/${uid}/coins/${safeCoinId}/${side}-${timestamp}.jpg`;
}

export function isFirebaseStorageUrl(url: string | undefined | null): url is string {
  return typeof url === 'string' && /^https:\/\/firebasestorage\.googleapis\.com\//.test(url);
}

/** Lädt ein Foto (data URL) hoch. Gibt bei Fehler oder Zeitüberschreitung null zurück, damit das Speichern nie blockiert. */
export async function uploadCoinPhoto(uid: string, coinId: string, side: CoinPhotoSide, dataUrl: string): Promise<string | null> {
  if (!uid || !dataUrl.startsWith('data:image/')) return null;
  const upload = (async () => {
    const photoRef = ref(storage, coinPhotoPath(uid, coinId, side));
    await uploadString(photoRef, dataUrl, 'data_url', { contentType: 'image/jpeg', cacheControl: 'private, max-age=31536000' });
    return getDownloadURL(photoRef);
  })();
  const result = await withTimeout(upload, UPLOAD_TIMEOUT_MS);
  if (!result) console.warn(`Firebase Storage upload (${side}) failed; keeping the photo inline.`);
  return result;
}

export async function deleteCoinPhoto(url: string | undefined | null): Promise<void> {
  if (!isFirebaseStorageUrl(url)) return;
  try {
    await deleteObject(ref(storage, url));
  } catch (error) {
    console.warn('Firebase Storage photo could not be deleted:', error);
  }
}

async function deleteFolderRecursive(folder: StorageReference): Promise<void> {
  const listing = await listAll(folder);
  await Promise.all(listing.items.map(item => deleteObject(item).catch(() => undefined)));
  await Promise.all(listing.prefixes.map(prefix => deleteFolderRecursive(prefix)));
}

export async function deleteAllCoinPhotosForUser(uid: string): Promise<void> {
  if (!uid) return;
  try {
    await withTimeout(deleteFolderRecursive(ref(storage, `users/${uid}/coins`)), 60000);
  } catch (error) {
    console.warn('Firebase Storage photos could not be removed:', error);
  }
}
