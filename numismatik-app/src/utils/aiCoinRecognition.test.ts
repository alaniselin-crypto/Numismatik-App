import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeRecognizedCondition,
  normalizeRecognizedCurrency,
  normalizeRecognizedRarity,
  parseRecognizedValue,
} from './aiCoinRecognition';

test('normalizes Swiss franc labels to CHF', () => {
  for (const value of ['FR', 'Fr.', 'SFr', 'Franken', 'Schweizer Franken']) {
    assert.equal(normalizeRecognizedCurrency(value), 'CHF');
  }
  assert.equal(normalizeRecognizedCurrency('eur'), 'EUR');
});

test('normalizes AI condition labels to form values', () => {
  assert.equal(normalizeRecognizedCondition('Vorzüglich'), 'vz');
  assert.equal(normalizeRecognizedCondition('SS - Sehr schön'), 'ss');
  assert.equal(normalizeRecognizedCondition('Proof / Polierte Platte'), 'PP');
});

test('normalizes AI rarity labels to supported options', () => {
  assert.equal(normalizeRecognizedRarity('RR - Sehr selten'), 'RR - Sehr Selten');
  assert.equal(normalizeRecognizedRarity('Knapp'), 'C - Knapp');
  assert.equal(normalizeRecognizedRarity('A'), 'A - Häufig');
});

test('parses recognized CHF values', () => {
  assert.equal(parseRecognizedValue(125), 125);
  assert.equal(parseRecognizedValue('CHF 48.50'), 48.5);
  assert.equal(parseRecognizedValue('25,90 CHF'), 25.9);
  assert.equal(parseRecognizedValue('unbekannt'), null);
});
