import assert from 'node:assert/strict';
import test from 'node:test';
import { Coin } from '../types';
import { findDuplicateCoin } from './importDedup';

const coin = (overrides: Partial<Coin>): Coin => ({
  id: 'one', name: 'Vreneli', country: 'Schweiz', faceValue: '20', currency: 'CHF', year: 1935,
  condition: 'vz', purchasePrice: 0, currentValue: 0, purchaseDate: '', notes: '',
  createdAt: '', updatedAt: '', ...overrides,
});

test('finds duplicates before a missing SKU is assigned', () => {
  const existing = coin({ catalogNumber: '00042' });
  assert.equal(findDuplicateCoin([existing], coin({ id: 'new', catalogNumber: '' }))?.id, 'one');
});

test('finds the same Drive image across different URL formats', () => {
  const existing = coin({ imageUrl: 'https://lh3.googleusercontent.com/d/abc_123' });
  const imported = coin({ id: 'new', name: 'Anderer Name', imageUrl: 'https://drive.google.com/open?id=abc_123' });
  assert.equal(findDuplicateCoin([existing], imported)?.id, 'one');
});

test('does not merge unrelated placeholder entries', () => {
  const existing = coin({ name: 'TITEL', year: 2000, rawBaseName: 'foto-a' });
  const imported = coin({ id: 'new', name: 'TITEL', year: 2000, rawBaseName: 'foto-b' });
  assert.equal(findDuplicateCoin([existing], imported), undefined);
});