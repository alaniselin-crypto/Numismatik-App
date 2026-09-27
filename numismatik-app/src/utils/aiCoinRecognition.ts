import { CoinCondition } from '../types';
import { RARITY_OPTIONS } from '../data/rarities';

export function normalizeRecognizedCurrency(value: unknown): string {
  const currency = String(value ?? '').trim();
  const compact = currency.toUpperCase().replace(/[\s.]/g, '');
  if (['FR', 'FRS', 'SFR', 'FRANKEN', 'SCHWEIZERFRANKEN'].includes(compact)) {
    return 'CHF';
  }
  return currency.toUpperCase();
}

export function normalizeRecognizedCondition(value: unknown): CoinCondition | null {
  const condition = String(value ?? '').trim().toLowerCase();
  if (!condition) return null;
  if (condition === 'pp' || condition.includes('polierte platte') || condition.includes('proof')) return 'PP';
  if (condition === 'stgl' || condition.includes('stempelglanz') || condition.includes('unzirkuliert')) return 'stgl';
  if (condition === 'vz' || condition.includes('vorzüglich')) return 'vz';
  if (condition === 'ss' || condition.includes('sehr schön')) return 'ss';
  if (condition === 's' || condition === 'schön') return 's';
  if (condition === 'ge' || condition.includes('gering')) return 'ge';
  return null;
}

export function normalizeRecognizedRarity(value: unknown): string {
  const rarity = String(value ?? '').trim();
  if (!rarity) return '';
  const normalized = rarity.toLowerCase();
  const byLabel = RARITY_OPTIONS.find(option =>
    normalized === option.fullLabel.toLowerCase() ||
    normalized === option.label.toLowerCase()
  );
  if (byLabel) return byLabel.fullLabel;
  const code = rarity.toUpperCase().match(/^(RRR|RR|R|C|B|A)\b/)?.[1];
  return RARITY_OPTIONS.find(option => option.code === code)?.fullLabel ?? '';
}

export function parseRecognizedValue(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== 'string') return null;
  const cleaned = value
    .replace(/[^\d.,'-]/g, '')
    .replace(/'/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
