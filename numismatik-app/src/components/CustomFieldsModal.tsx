import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Lock, ListPlus } from 'lucide-react';
import type { CustomFieldDefinition } from '../types';
import { createCustomFieldId } from '../utils/customFields';

interface CustomFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: CustomFieldDefinition[];
  onSave: (fields: CustomFieldDefinition[]) => void;
}

const TYPE_OPTIONS: { value: CustomFieldDefinition['type']; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Zahl' },
  { value: 'date', label: 'Datum' },
  { value: 'checkbox', label: 'Ja/Nein (Häkchen)' },
  { value: 'dropdown', label: 'Auswahlliste' },
];

export const CustomFieldsModal: React.FC<CustomFieldsModalProps> = ({ isOpen, onClose, fields, onSave }) => {
  const [draft, setDraft] = useState<CustomFieldDefinition[]>(fields);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<CustomFieldDefinition['type']>('text');
  const [newAdminOnly, setNewAdminOnly] = useState(false);
  const [newOptions, setNewOptions] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraft(fields);
      setNewLabel('');
      setNewType('text');
      setNewAdminOnly(false);
      setNewOptions('');
    }
  }, [isOpen, fields]);

  if (!isOpen) return null;

  const parseOptions = (raw: string): string[] =>
    raw.split(/[,;\n]/).map(o => o.trim()).filter(Boolean);

  const addField = () => {
    const label = newLabel.trim();
    if (!label) return;
    setDraft(prev => [...prev, {
      id: createCustomFieldId(),
      label,
      type: newType,
      adminOnly: newAdminOnly,
      ...(newType === 'dropdown' ? { options: parseOptions(newOptions) } : {}),
    }]);
    setNewLabel('');
    setNewType('text');
    setNewAdminOnly(false);
    setNewOptions('');
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-[#1f1815] border border-amber-900/40 rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between gap-3 px-5 py-4 bg-[#1f1815] border-b border-amber-900/30">
          <div className="flex items-center gap-2.5">
            <ListPlus className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-amber-100">Eigene Felder</h2>
              <p className="text-[11px] text-stone-400">Nur für den Administrator sichtbar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-[#322722] transition-colors" aria-label="Schliessen">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-2">
            {draft.length === 0 && (
              <p className="text-xs text-stone-400 bg-[#171210] border border-amber-900/20 rounded-xl p-4">
                Noch keine eigenen Felder. Legen Sie unten Ihr erstes Feld an – es erscheint danach in jedem Münz-Formular.
              </p>
            )}
            {draft.map((field, index) => (
              <div key={field.id} className="bg-[#171210] border border-amber-900/20 rounded-xl p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={field.label}
                    onChange={e => setDraft(prev => prev.map((item, i) => i === index ? { ...item, label: e.target.value } : item))}
                    className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-[#0f0c0b] border border-amber-900/30 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <select
                    value={field.type}
                    onChange={e => setDraft(prev => prev.map((item, i) => i === index ? { ...item, type: e.target.value as CustomFieldDefinition['type'] } : item))}
                    className="px-2.5 py-2 rounded-lg bg-[#0f0c0b] border border-amber-900/30 text-xs text-stone-200 focus:outline-none"
                  >
                    {TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-[11px] text-stone-300 px-2">
                    <input
                      type="checkbox"
                      checked={field.adminOnly}
                      onChange={e => setDraft(prev => prev.map((item, i) => i === index ? { ...item, adminOnly: e.target.checked } : item))}
                      className="w-4 h-4 rounded bg-[#0f0c0b] border-amber-900/40 text-amber-500"
                    />
                    <Lock className="w-3 h-3 text-amber-400" /> nur für mich
                  </label>
                  <button
                    onClick={() => setDraft(prev => prev.filter((_, i) => i !== index))}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Feld löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {field.type === 'dropdown' && (
                  <input
                    value={(field.options || []).join(', ')}
                    onChange={e => setDraft(prev => prev.map((item, i) => i === index ? { ...item, options: parseOptions(e.target.value) } : item))}
                    placeholder="Auswahlmöglichkeiten, mit Komma getrennt: z.B. Gold, Silber, Kupfer"
                    className="w-full px-3 py-2 rounded-lg bg-[#0f0c0b] border border-amber-900/30 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="bg-[#171210] border border-amber-900/25 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-amber-200">Neues Feld anlegen</p>
            <div className="flex flex-wrap gap-2">
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addField(); } }}
                placeholder="Name des Feldes, z.B. Fundort"
                className="flex-1 min-w-[160px] px-3 py-2 rounded-lg bg-[#0f0c0b] border border-amber-900/30 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as CustomFieldDefinition['type'])}
                className="px-2.5 py-2 rounded-lg bg-[#0f0c0b] border border-amber-900/30 text-xs text-stone-200 focus:outline-none"
              >
                {TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={addField}
                className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#1a1412] text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Hinzufügen
              </button>
            </div>
            {newType === 'dropdown' && (
              <input
                value={newOptions}
                onChange={e => setNewOptions(e.target.value)}
                placeholder="Auswahlmöglichkeiten, mit Komma getrennt: z.B. Gold, Silber, Kupfer"
                className="w-full px-3 py-2 rounded-lg bg-[#0f0c0b] border border-amber-900/30 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            )}
            <label className="flex items-center gap-2 text-[11px] text-stone-300">
              <input
                type="checkbox"
                checked={newAdminOnly}
                onChange={e => setNewAdminOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-[#0f0c0b] border-amber-900/40 text-amber-500"
              />
              Nur für mich sichtbar (erscheint nicht im Druck und im Katalog-Export)
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-2 px-5 py-4 bg-[#1f1815] border-t border-amber-900/30">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-amber-900/40 text-sm text-stone-300 hover:bg-[#322722] transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1a1412] text-sm font-bold transition-colors">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
