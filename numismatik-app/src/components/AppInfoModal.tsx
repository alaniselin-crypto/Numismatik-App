import React, { useState } from 'react';
import { X, ShieldCheck, Lock } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { isLocalAdminEnabled, setLocalAdmin, unlockAdmin } from '../utils/admin';

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminChange?: (isAdmin: boolean) => void;
}

export const AppInfoModal: React.FC<AppInfoModalProps> = ({ isOpen, onClose, onAdminChange }) => {
  const [adminOn, setAdminOn] = useState<boolean>(() => isLocalAdminEnabled());
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUnlock = () => {
    if (unlockAdmin(code)) {
      setAdminOn(true);
      setCode('');
      setError('');
      onAdminChange?.(true);
    } else {
      setError('Code stimmt nicht.');
    }
  };

  const handleDisable = () => {
    setLocalAdmin(false);
    setAdminOn(false);
    onAdminChange?.(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#1f1815] border border-amber-900/40 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-900/30">
          <h2 className="text-sm font-bold text-amber-100">Über diese App</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-[#322722]" aria-label="Schliessen">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-6 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
            <img src={logoImg} alt="Numismatik.App" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-lg font-bold text-stone-100 font-serif">Numismatik.App</p>
            <p className="text-xs text-stone-400 mt-0.5">Version 1.0</p>
          </div>
          <div className="w-full bg-[#171210] border border-amber-900/25 rounded-xl p-3 text-xs text-stone-300">
            <p className="text-[11px] uppercase tracking-wider text-stone-500 mb-1">Entwickelt von</p>
            <p className="font-semibold text-amber-200">Alan Iselin</p>
          </div>
          <p className="text-[11px] text-stone-500">Ihre Sammlung, sicher verwaltet.</p>
        </div>

        <div className="px-5 pb-5">
          {adminOn ? (
            <div className="flex items-center justify-between gap-2 bg-[#171210] border border-amber-900/25 rounded-xl px-3 py-2.5">
              <span className="flex items-center gap-2 text-[11px] text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Administrator-Modus aktiv
              </span>
              <button onClick={handleDisable} className="text-[11px] text-stone-400 underline hover:text-amber-300">
                ausschalten
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleUnlock(); } }}
                placeholder="Administrator-Code"
                className="flex-1 px-3 py-2 rounded-lg bg-[#0f0c0b] border border-amber-900/30 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <button onClick={handleUnlock} className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#1a1412] text-xs font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> OK
              </button>
            </div>
          )}
          {error && <p className="text-[11px] text-rose-400 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
};
