import { auth } from '../lib/firebase';
import { compressDataUrlIfNeeded } from './firestoreStorage';
import {
  normalizeRecognizedCondition,
  normalizeRecognizedCurrency,
  normalizeRecognizedRarity,
  parseRecognizedValue,
} from './aiCoinRecognition';

const AI_COIN_INFO_URL = 'https://inumis-node-backend.onrender.com/api/generate-coin-info';

export function aiQuotaNotice(res: Response): string {
  const remaining = Number(res.headers.get('X-AI-Quota-Remaining'));
  if (!res.headers.has('X-AI-Quota-Remaining') || !Number.isFinite(remaining)) return '';
  return remaining === 1
    ? ' Noch 1 KI-Anfrage in diesem Monat.'
    : ` Noch ${remaining} KI-Anfragen in diesem Monat.`;
}

export async function requestAiCoinInfo(payload: Record<string, unknown>): Promise<Response> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Für die KI-Erkennung ist eine Anmeldung erforderlich.');
  }
  const idToken = await currentUser.getIdToken();
  // Kleinere Bilder für die KI: schnellere Übertragung, gleiche Erkennungsqualität.
  const smallerPayload = { ...payload };
  for (const key of ['imageUrl', 'reverseImageUrl'] as const) {
    const value = smallerPayload[key];
    if (typeof value === 'string' && value.startsWith('data:image/')) {
      smallerPayload[key] = await compressDataUrlIfNeeded(value, 1024, 0.8, 200 * 1024);
    }
  }
  return fetch(AI_COIN_INFO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify(smallerPayload)
  });
}

export interface RecognitionTarget {
  name?: string;
  country?: string;
  year?: number;
  faceValue?: string;
  currency?: string;
  material?: string;
  mintMark?: string;
  weight?: string;
  diameter?: string;
  mintage?: string;
  itemType?: 'coin' | 'banknote';
  condition?: string;
  rarity?: string;
  currentValue?: number;
  notes?: string;
}

/** Übernimmt erkannte Werte; was die KI nicht liefert, bleibt wie es war. */
export function applyRecognizedCoinInfo<T extends RecognitionTarget>(prev: T, data: any): T {
  const recognizedCondition = normalizeRecognizedCondition(data.condition);
  const recognizedRarity = normalizeRecognizedRarity(data.rarity);
  const recognizedValue = parseRecognizedValue(data.currentValue ?? data.estimatedValue);
  const recognizedCurrency = normalizeRecognizedCurrency(data.currency);
  return {
    ...prev,
    name: data.title || prev.name,
    country: data.country || prev.country,
    year: (data.year && !isNaN(Number(data.year))) ? Number(data.year) : prev.year,
    faceValue: data.faceValue || prev.faceValue,
    currency: recognizedCurrency || prev.currency,
    material: data.material || prev.material,
    mintMark: data.mintMark || prev.mintMark,
    weight: data.weight || prev.weight,
    diameter: data.diameter || prev.diameter,
    mintage: data.mintage || prev.mintage,
    itemType: (data.itemType === 'coin' || data.itemType === 'banknote') ? data.itemType : prev.itemType,
    condition: recognizedCondition || prev.condition,
    rarity: recognizedRarity || prev.rarity,
    currentValue: recognizedValue ?? prev.currentValue,
    notes: (!prev.notes || prev.notes === 'Keine') && data.description ? data.description : prev.notes,
  };
}
