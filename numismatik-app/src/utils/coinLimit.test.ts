import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  FREE_COIN_LIMIT,
  canAddCoins,
  isProEntitlementActive,
  loadProEntitlement,
  remainingFreeCoins,
  saveProEntitlement,
} from './coinLimit';
import { fullSizePhotoUrl } from './coinPhotoUrls';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const source = (relativePath: string) => readFileSync(join(appRoot, relativePath), 'utf8');

const free = { enforced: true, isPro: false, isAdmin: false };

test('free customers can store up to 100 coins', () => {
  assert.equal(FREE_COIN_LIMIT, 100);
  assert.equal(canAddCoins(99, 1, free), true);
  assert.equal(canAddCoins(100, 1, free), false);
  assert.equal(canAddCoins(95, 6, free), false);
  assert.equal(remainingFreeCoins(97, free), 3);
  assert.equal(remainingFreeCoins(130, free), 0);
});

test('Pro, admin and non-iPhone platforms have no limit', () => {
  assert.equal(canAddCoins(500, 50, { ...free, isPro: true }), true);
  assert.equal(canAddCoins(500, 50, { ...free, isAdmin: true }), true);
  assert.equal(canAddCoins(500, 50, { ...free, enforced: false }), true);
});

test('a stored Pro subscription counts only until it expires', () => {
  const now = Date.parse('2026-10-01T00:00:00.000Z');
  assert.equal(isProEntitlementActive({ productId: 'p', expiresAt: '2026-11-01T00:00:00.000Z' }, now), true);
  assert.equal(isProEntitlementActive({ productId: 'p', expiresAt: '2026-09-01T00:00:00.000Z' }, now), false);
  assert.equal(isProEntitlementActive(null, now), false);
});

test('the Pro subscription is remembered per account', () => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  };
  saveProEntitlement('uid-a', { productId: 'com.alaniselin.numisma.pro.yearly', expiresAt: '2027-01-01T00:00:00.000Z' });
  assert.deepEqual(loadProEntitlement('uid-a'), { productId: 'com.alaniselin.numisma.pro.yearly', expiresAt: '2027-01-01T00:00:00.000Z' });
  assert.equal(loadProEntitlement('uid-b'), null);
  assert.equal(loadProEntitlement(null), null);
});

test('the app checks the limit before adding, duplicating and importing coins', () => {
  const app = source('src/App.tsx');
  assert.match(app, /enforced: isIos/);
  assert.match(app, /const handleSaveCoin = [\s\S]*?if \(!coinData\.id && !ensureRoomForNewCoins\(1\)\) return;/);
  assert.match(app, /const handleDuplicateCoin = async \(sourceCoin: Coin\) => \{\n\s*if \(!ensureRoomForNewCoins\(1\)\) return;/);
  assert.match(app, /onImportCoins=\{\(newCoins, replaceExisting\) => \{\n\s*if \(!importFitsCoinLimit\(newCoins, replaceExisting\)\) return false;/);
  assert.equal((app.match(/onOpenAddModal=\{openNewCoinForm\}/g) || []).length, 3);
  assert.match(app, /rememberProEntitlement\(entitlement\);[\s\S]*rememberProEntitlement\(entitlement\);/);
  assert.doesNotMatch(app, /setEditCoin\(null\);\n\s*setIsFormModalOpen\(true\);\n\s*\}\}/);
});

test('editing existing coins is never blocked by the limit', () => {
  const app = source('src/App.tsx');
  assert.doesNotMatch(app, /onEdit=\{\(coin\) => \{\n\s*if \(!ensureRoomForNewCoins/);
});

test('full-size photos come from Firebase Storage only while the picture is unchanged', () => {
  const coin = { imageUrl: 'data:image/jpeg;base64,small', storageFrontUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/front.jpg' };
  assert.equal(fullSizePhotoUrl(coin, 'front'), coin.storageFrontUrl);
  assert.equal(fullSizePhotoUrl({ ...coin, driveFrontDirty: true }, 'front'), coin.imageUrl);
  assert.equal(fullSizePhotoUrl({ imageUrl: 'data:image/jpeg;base64,a' }, 'front'), 'data:image/jpeg;base64,a');
  assert.equal(fullSizePhotoUrl({ reverseImageUrl: '' , storageBackUrl: 'https://firebasestorage.googleapis.com/b.jpg' }, 'back'), '');
});

test('photos go to Firebase Storage with an inline preview and an inline fallback', () => {
  const firestore = source('src/utils/firestoreStorage.ts');
  assert.match(firestore, /uploadCoinPhoto\(validUid, coin\.id, side, full\)/);
  assert.match(firestore, /compressDataUrlIfNeeded\(full, 480, 0\.72, 0\)/);
  assert.match(firestore, /storageFrontUrl: frontStorage\.url \?\? deleteField\(\)/);
  assert.match(firestore, /deleteStoragePhotoIfUnused/);
  assert.match(firestore, /void deleteAllCoinPhotosForUser\(validUid\)/);
  assert.match(firestore, /await deleteAllCoinPhotosForUser\(validUid\)/);

  const photos = source('src/utils/coinPhotoStorage.ts');
  assert.match(photos, /users\/\$\{uid\}\/coins\/\$\{safeCoinId\}\/\$\{side\}-\$\{timestamp\}\.jpg/);
  assert.match(photos, /withTimeout\(upload, UPLOAD_TIMEOUT_MS\)/);

  const app = source('src/App.tsx');
  assert.match(app, /const saved = await saveCoinToFirestore\(uid, coin\);[\s\S]*applySavedPhotoFields\(uid, coin, saved\);/);
  assert.match(app, /updatedCoin\.driveFrontDirty = true/);
  assert.match(app, /updatedCoin\.driveBackDirty = true/);

  const rules = source('storage.rules');
  assert.match(rules, /match \/users\/\{uid\}\/coins\/\{coinId\}\/\{fileName\}/);
  assert.match(rules, /request\.auth\.uid == uid/);
  assert.match(rules, /allow read, write: if false;/);
});
