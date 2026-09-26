import { Coin } from '../types';

const normalize = (value?: string) => (value || '').trim().toLocaleLowerCase('de-CH');
const placeholderNames = new Set(['titel', 'münze', 'unbenannte münze']);

function imageKey(value?: string): string {
  const normalized = normalize(value);
  if (!normalized) return '';
  const driveId = normalized.match(/(?:\/d\/|[?&]id=)([a-z0-9_-]+)/i)?.[1];
  return driveId ? `drive:${driveId}` : normalized;
}

export function findDuplicateCoin(existingCoins: Coin[], candidate: Coin): Coin | undefined {
  const candidateSku = normalize(candidate.catalogNumber);
  const candidateBase = normalize(candidate.rawBaseName);
  const candidateImages = new Set([imageKey(candidate.imageUrl), imageKey(candidate.reverseImageUrl)].filter(Boolean));
  const candidateName = normalize(candidate.name);

  return existingCoins.find(existing => {
    if (candidate.id && existing.id === candidate.id) return true;
    if (candidateSku && normalize(existing.catalogNumber) === candidateSku) return true;
    if (candidateBase && normalize(existing.rawBaseName) === candidateBase) return true;
    if (candidateImages.size > 0) {
      const existingImages = [imageKey(existing.imageUrl), imageKey(existing.reverseImageUrl)];
      if (existingImages.some(key => key && candidateImages.has(key))) return true;
    }
    return Boolean(
      candidateName
      && !placeholderNames.has(candidateName)
      && normalize(existing.name) === candidateName
      && Number(existing.year) === Number(candidate.year),
    );
  });
}