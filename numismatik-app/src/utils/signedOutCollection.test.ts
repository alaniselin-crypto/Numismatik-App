import assert from 'node:assert/strict';
import test from 'node:test';
import { collectionToKeepOnSignOut } from './signedOutCollection';

test('sign-out keeps the collection that is on screen', () => {
  const result = collectionToKeepOnSignOut({
    previousUid: 'user-1',
    visible: { coins: ['taler'], folders: ['Tresor'], platforms: ['Ricardo'] },
    account: { coins: ['alte-münze'], folders: ['Archiv'], platforms: ['eBay'] },
    device: null,
  });

  assert.equal(result.saveOnDevice, true);
  assert.deepEqual(result.collection, {
    coins: ['taler'],
    folders: ['Tresor'],
    platforms: ['Ricardo'],
  });
});

test('sign-out falls back to the account copy when the screen was not filled yet', () => {
  const result = collectionToKeepOnSignOut({
    previousUid: 'user-1',
    visible: { coins: [], folders: [], platforms: [] },
    account: { coins: ['taler'], folders: ['Tresor'], platforms: ['Ricardo'] },
    device: null,
  });

  assert.deepEqual(result.collection.coins, ['taler']);
  assert.equal(result.saveOnDevice, true);
});

test('a signed-out launch restores the collection saved on the device', () => {
  const result = collectionToKeepOnSignOut({
    previousUid: null,
    visible: { coins: [], folders: [], platforms: [] },
    account: { coins: [], folders: [], platforms: [] },
    device: { coins: ['taler'], folders: ['Tresor'], platforms: ['Ricardo'] },
  });

  assert.equal(result.saveOnDevice, false);
  assert.deepEqual(result.collection.coins, ['taler']);
});

test('a signed-out launch without a saved collection stays empty', () => {
  const result = collectionToKeepOnSignOut({
    previousUid: null,
    visible: { coins: ['soll-nicht-bleiben'], folders: [], platforms: [] },
    account: { coins: [], folders: [], platforms: [] },
    device: null,
  });

  assert.deepEqual(result.collection.coins, []);
});
