import type { Coin } from '../types';

/** Bestes verfügbares Foto: volle Grösse aus Firebase Storage, sonst das in der Münze gespeicherte Bild. */
export function fullSizePhotoUrl(coin: Pick<Coin, 'imageUrl' | 'reverseImageUrl' | 'storageFrontUrl' | 'storageBackUrl' | 'driveFrontDirty' | 'driveBackDirty'>, side: 'front' | 'back'): string {
  if (side === 'front') {
    if (coin.imageUrl && coin.storageFrontUrl && !coin.driveFrontDirty) return coin.storageFrontUrl;
    return coin.imageUrl || '';
  }
  if (coin.reverseImageUrl && coin.storageBackUrl && !coin.driveBackDirty) return coin.storageBackUrl;
  return coin.reverseImageUrl || '';
}
