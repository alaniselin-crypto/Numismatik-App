import type { CustomFieldDefinition } from '../types';

const STORAGE_KEY = 'numismatik_custom_fields';

export function loadCustomFields(): CustomFieldDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return sanitizeCustomFields(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveCustomFieldsLocally(fields: CustomFieldDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeCustomFields(fields)));
  } catch (error) {
    console.warn('Eigene Felder konnten lokal nicht gespeichert werden:', error);
  }
}

const VALID_TYPES = ['text', 'number', 'date', 'checkbox', 'dropdown'] as const;

export function sanitizeCustomFields(value: unknown): CustomFieldDefinition[] {
  if (!Array.isArray(value)) return [];
  const result: CustomFieldDefinition[] = [];
  value.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const raw = item as Record<string, unknown>;
    const label = typeof raw.label === 'string' ? raw.label.trim() : '';
    if (!label) return;
    const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : createCustomFieldId();
    const type = (VALID_TYPES as readonly string[]).includes(raw.type as string)
      ? (raw.type as CustomFieldDefinition['type'])
      : 'text';
    const options = Array.isArray(raw.options)
      ? raw.options.map(o => String(o).trim()).filter(Boolean)
      : [];
    result.push({
      id,
      label,
      type,
      adminOnly: raw.adminOnly === true,
      ...(type === 'dropdown' ? { options } : {}),
    });
  });
  return result;
}

export function createCustomFieldId(): string {
  return `cf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
