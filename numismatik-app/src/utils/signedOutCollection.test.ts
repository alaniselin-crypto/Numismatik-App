import assert from 'node:assert/strict';
import test from 'node:test';
import { collectionToKeepOnSignOut } from './signedOutCollection';

test('sign-out clears the collection on screen', () => {
  const result = collectionToKeepOnSignOut({
    previousUid: 'user-1',
    visible: { coins: ['taler'], folders: ['Tresor'], platforms: ['Ricardo'] },
    account: { coins: ['alte-münze'], folders: ['Archiv'], platforms: ['eBay'] },
    device: { coins: ['gerät'], folders: ['Lokal'], platforms: ['Lokal'] },
  });

  assert.equal(result.saveOnDevice, false);
  assert.deepEqual(result.collection, { coins: [], folders: [], platforms: [] });
});

test('a signed-out launch does not restore coins saved on the device', () => {
  const result = collectionToKeepOnSignOut({
    previousUid: null,
    visible: { coins: [], folders: [], platforms: [] },
    account: { coins: [], folders: [], platforms: [] },
    device: { coins: ['taler'], folders: ['Tresor'], platforms: ['Ricardo'] },
  });

  assert.equal(result.saveOnDevice, false);
  assert.deepEqual(result.collection.coins, []);
});
