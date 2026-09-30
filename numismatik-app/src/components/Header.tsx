import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Folder, ShoppingBag, Cloud, UserCheck, Settings, ChevronDown, LogIn, Crown, ListPlus, Sun, Moon, CloudUpload, CloudOff, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/storage';
import { getStoredTheme, setTheme, applyTheme, type ThemeMode } from '../utils/theme';
import { connectDrive, disconnectDrive, driveStatus, driveSupported } from '../utils/googleDrive';
import logoImg from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  totalValue: number;
  totalCoins: number;
  onOpenAddModal?: () => void;
  onOpenCustomFields?: () => void;
  onOpenGuideModal?: () => void;
  onOpenFolderManager?: () => void;
  onOpenPlatformManager?: () => void;
  onOpenAuthModal?: () => void;
  onOpenLogoModal?: () => void;
  onOpenHeroModal?: () => void;
  onOpenProModal?: () => void;
  onManualFetchWebhooks?: () => void;
  isFetchingWebhooks?: boolean;
  onOpenDriveMigration?: () => void;
  onClearAllCoins?: () => void | Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  totalValue,
  totalCoins,
  onOpenCustomFields,
  onOpenGuideModal,
  onOpenFolderManager,
  onOpenPlatformManager,
  onOpenAuthModal,
  onOpenLogoModal,
  onOpenHeroModal,
  onOpenProModal,
  onManualFetchWebhooks,
  isFetchingWebhooks,
  onOpenDriveMigration,
  onClearAllCoins
}) => {
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredTheme());
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);
  const toggleTheme = () => {
    const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    setTheme(next);
  };
  const [driveState, setDriveState] = useState<'off' | 'connected' | 'expired'>(() => (driveSupported() ? driveStatus() : 'off'));
  const [driveConnecting, setDriveConnecting] = useState(false);
  const refreshDriveState = () => setDriveState(driveSupported() ? driveStatus() : 'off');
  const handleDriveConnect = async () => {
    setDriveConnecting(true);
    try {
      await connectDrive();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verbindung zu Google Drive fehlgeschlagen.');
    } finally {
      setDriveConnecting(false);
      refreshDriveState();
    }
  };
  const handleDriveDisconnect = () => {
    disconnectDrive();
    refreshDriveState();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
        setShowClearConfirmation(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#16100e] border-b border-amber-900/40 px-1.5 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)] sm:px-6 max-w-full shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 sm:gap-4">
        {/* Brand */}
        <div 
          onClick={onOpenLogoModal}
          className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 cursor-pointer group"
          title="Numismatik.App Logo anzeigen & herunterladen"
        >
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg shadow-amber-950/40 group-hover:scale-105 transition-transform">
            <img src={logoImg} alt="Numismatik.App" className="w-full h-full object-cover" />
            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-[#1a1412] ${user ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-stone-100 tracking-tight font-serif truncate group-hover:text-amber-400 transition-colors">
                Numismatik.App
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Münztracker
              </span>
            </div>
            <p className="text-xs text-stone-400 hidden sm:block">
              Ihre digitale Münzsammlung & Wertanalyse
            </p>
          </div>
        </div>

        {/* Stats Display in Center */}
        <div className="hidden md:flex items-center gap-4 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Sammlungswert:</span>
            <span className="font-bold text-amber-400 font-mono text-xs sm:text-sm">
              {formatCurrency(totalValue)}
            </span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Münzen:</span>
            <span className="font-semibold text-slate-200 font-mono text-xs sm:text-sm">
              {totalCoins} Stk.
            </span>
          </div>
        </div>

        {/* Right Controls: Login & Zahnrad Settings Menu */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1 px-2 py-1.5 text-[10px] sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs font-semibold rounded-lg transition-all shadow-sm shrink-0 border ${
                user
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-400 font-bold shadow-amber-950/40'
              }`}
              title={user ? `Cloud-Konto: ${user.email || 'Verbunden'}` : 'Anmelden oder Kostenlos Registrieren'}
            >
              {user ? (
                <>
                  <UserCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="hidden sm:inline font-medium text-emerald-300">
                    {user.email ? user.email.split('@')[0] : 'Konto'}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-stone-950" />
                  <span className="sm:hidden">Anmelden</span>
                  <span className="hidden sm:inline">Anmelden / Registrieren</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all shrink-0"
            title={themeMode === 'dark' ? 'In die helle Darstellung wechseln' : 'In die dunkle Darstellung wechseln'}
          >
            {themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-amber-600" />
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                refreshDriveState();
                setIsSettingsOpen(!isSettingsOpen);
                if (isSettingsOpen) setShowClearConfirmation(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 text-[10px] sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 rounded-lg transition-all shadow-sm shrink-0"
              title="Einstellungen & Werkzeuge öffnen"
            >
              <Settings className={`w-4 h-4 text-amber-400 shrink-0 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90' : ''}`} />
              <span className="font-medium text-amber-300">Einstellungen</span>
              <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-amber-400/80 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isSettingsOpen && (
              <div className="fixed right-2 top-[calc(env(safe-area-inset-top)+4.75rem)] z-50 w-[min(24rem,calc(100vw-1rem))] max-h-[calc(100dvh-6rem)] overflow-y-auto overflow-x-hidden bg-[#241c18] border border-[#4a382e] rounded-xl shadow-2xl animate-fadeIn py-1.5">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400 border-b border-[#3d2f26] flex items-center justify-between">
                  <span>Werkzeuge & Optionen</span>
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                </div>

                {onOpenProModal && (
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onOpenProModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-300 hover:bg-[#322722] transition-colors text-left"
                  >
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium">Numismatik Pro</div>
                      <div className="text-[10px] text-stone-400">Abo wählen oder wiederherstellen</div>
                    </div>
                  </button>
                )}

                {onOpenFolderManager && (
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onOpenFolderManager();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-200 hover:bg-[#322722] hover:text-amber-400 transition-colors text-left"
                  >
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium">Ordner verwalten</div>
                      <div className="text-[10px] text-stone-400">Lagerorte hinzufügen & umbenennen</div>
                    </div>
                  </button>
                )}

                {onOpenPlatformManager && (
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onOpenPlatformManager();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-200 hover:bg-[#322722] hover:text-amber-300 transition-colors text-left"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium">Verkaufsplattformen</div>
                      <div className="text-[10px] text-stone-400">Ricardo, eBay, Tutti usw.</div>
                    </div>
                  </button>
                )}

                {onOpenAuthModal && (
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-200 hover:bg-[#322722] hover:text-amber-300 transition-colors text-left border-t border-[#3d2f26] mt-1"
                  >
                    {user ? (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-medium">Cloud Konto ({user.email ? user.email.split('@')[0] : 'Verbunden'})</div>
                          <div className="text-[10px] text-emerald-400">Cloud-Synchronisation aktiv</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="font-medium">Cloud Konto aktivieren</div>
                          <div className="text-[10px] text-stone-400">Münzen online sichern</div>
                        </div>
                      </>
                    )}
                  </button>
                )}

                {driveSupported() && (
                  <div className="border-t border-[#3d2f26] mt-1 pt-1">
                    <button
                      onClick={driveState === 'connected' ? undefined : handleDriveConnect}
                      disabled={driveConnecting}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-200 hover:bg-[#322722] hover:text-amber-300 transition-colors text-left disabled:opacity-60"
                    >
                      {driveState === 'connected' ? (
                        <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : driveState === 'expired' ? (
                        <CloudOff className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Cloud className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-medium">
                          {driveState === 'connected' ? 'Google Drive: verbunden' : driveState === 'expired' ? 'Google Drive: neu verbinden' : 'Google Drive verbinden'}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {driveState === 'connected' ? 'Fotos liegen sicher in der Cloud' : 'Fotos in deinem eigenen Google Drive sichern'}
                        </div>
                      </div>
                    </button>
                    {driveState === 'connected' && onOpenDriveMigration && (
                      <button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          onOpenDriveMigration();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-200 hover:bg-[#322722] hover:text-amber-400 transition-colors text-left"
                      >
                        <CloudUpload className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="font-medium">Fotos in die Cloud übertragen</div>
                          <div className="text-[10px] text-stone-400">Alle vorhandenen Münzfotos nach Google Drive</div>
                        </div>
                      </button>
                    )}
                    {driveState === 'connected' && (
                      <button
                        onClick={handleDriveDisconnect}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-300 hover:bg-[#322722] hover:text-rose-300 transition-colors text-left"
                      >
                        <CloudOff className="w-4 h-4 text-stone-400 shrink-0" />
                        <div>
                          <div className="font-medium">Google Drive trennen</div>
                          <div className="text-[10px] text-stone-400">Fotos bleiben in Drive erhalten</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {onOpenCustomFields && (
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onOpenCustomFields();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-300 hover:bg-[#322722] hover:text-amber-400 transition-colors text-left"
                  >
                    <ListPlus className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium">Eigene Felder</div>
                      <div className="text-[10px] text-stone-400">Zusätzliche Angaben selbst anlegen</div>
                    </div>
                  </button>
                )}

                {onOpenGuideModal && (
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onOpenGuideModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-300 hover:bg-[#322722] hover:text-amber-400 transition-colors text-left"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium">Anleitung & Hilfe</div>
                      <div className="text-[10px] text-stone-400">Nützliche Tipps zur Bedienung</div>
                    </div>
                  </button>
                )}

                {onClearAllCoins && (
                  <div className="border-t border-[#3d2f26] mt-1 pt-1">
                    {showClearConfirmation ? (
                      <div className="m-2 rounded-xl border border-rose-700/70 bg-rose-950/70 p-3">
                        <p className="text-xs font-semibold text-rose-200">
                          Wirklich alle {totalCoins} Münzen dauerhaft löschen?
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await onClearAllCoins();
                              setShowClearConfirmation(false);
                              setIsSettingsOpen(false);
                            }}
                            className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500"
                          >
                            Ja, alle löschen
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowClearConfirmation(false)}
                            className="rounded-lg bg-stone-800 px-3 py-2 text-xs font-semibold text-stone-200 hover:bg-stone-700"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowClearConfirmation(true)}
                        disabled={totalCoins === 0}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/60 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        <div>
                          <div className="font-medium">Alle Münzen löschen</div>
                          <div className="text-[10px] text-stone-400">{totalCoins} Münzen dauerhaft entfernen</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
