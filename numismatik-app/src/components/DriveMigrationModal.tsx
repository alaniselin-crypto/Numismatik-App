import React, { useMemo, useState } from 'react';
import { X, Cloud, CloudUpload, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Coin } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveCoinToFirestore } from '../utils/firestoreStorage';
import { connectDrive, driveStatus, hasValidDriveToken, isDriveEnabled } from '../utils/googleDrive';

interface DriveMigrationModalProps {
  open: boolean;
  onClose: () => void;
  coins: Coin[];
  onCoinUpdated: (coin: Coin) => void;
}

type MigrationState = 'idle' | 'running' | 'paused' | 'done';

/**
 * Überträgt alle vorhandenen Münzfotos nach Google Drive.
 * Danach bleiben in der App nur noch kleine Vorschaubilder – die grossen
 * Fotos liegen im eigenen Google Drive (Ordner "Numismatik.App Fotos").
 * Kann jederzeit pausiert und fortgesetzt werden (bereits übertragene
 * Fotos werden übersprungen).
 */
export const DriveMigrationModal: React.FC<DriveMigrationModalProps> = ({ open, onClose, coins, onCoinUpdated }) => {
  const { user } = useAuth();
  const [state, setState] = useState<MigrationState>('idle');
  const [connecting, setConnecting] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [failed, setFailed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pending = useMemo(
    () =>
      coins.filter(
        coin =>
          ((coin.imageUrl?.startsWith('data:') && (!coin.driveFrontFileId || coin.driveFrontDirty)) ||
            (coin.reverseImageUrl?.startsWith('data:') && (!coin.driveBackFileId || coin.driveBackDirty))),
      ),
    [coins],
  );

  if (!open) return null;

  const connected = isDriveEnabled() && hasValidDriveToken();

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await connectDrive();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verbindung zu Google Drive fehlgeschlagen.');
    } finally {
      setConnecting(false);
    }
  };

  const handleRun = async () => {
    if (!user) return;
    setState('running');
    setError(null);
    let done = 0;
    let fails = 0;
    for (const coin of pending) {
      // Token abgelaufen? Pausieren, damit der Nutzer neu verbinden kann.
      if (!hasValidDriveToken()) {
        setState('paused');
        setError('Die Google-Verbindung ist abgelaufen. Bitte neu verbinden und weiter machen – bereits übertragene Fotos werden übersprungen.');
        setProcessed(done);
        setFailed(fails);
        return;
      }
      try {
        const saved = await saveCoinToFirestore(user.uid, coin);
        if (saved) {
          onCoinUpdated(saved);
          done++;
        } else {
          fails++;
        }
      } catch {
        fails++;
      }
      setProcessed(done);
      setFailed(fails);
    }
    setState('done');
  };

  const total = pending.length;
  const progressPct = total > 0 ? Math.round(((processed + failed) / total) * 100) : 0;
  const canResume = driveStatus() === 'expired';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={state === 'running' ? undefined : onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[#4a382e] bg-[#241c18] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#3e2e26] px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-amber-300 font-serif">
            <CloudUpload className="w-5 h-5 text-amber-400" />
            Fotos in die Cloud übertragen
          </h2>
          <button
            onClick={onClose}
            disabled={state === 'running'}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-[#322722] hover:text-amber-400 disabled:opacity-40"
            title="Schliessen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm text-stone-200">
          {state === 'idle' && (
            <>
              <p>
                Von deinen Münzen warten <strong className="text-amber-300">{total}</strong> mit Fotos auf die Übertragung
                nach Google Drive.
              </p>
              <p className="text-xs text-stone-400">
                Danach bleiben in der App nur kleine Vorschaubilder – die App bleibt schnell und die Backups klein.
                Das Fenster muss während der Übertragung offen bleiben. Du kannst jederzeit pausieren und später weitermachen.
              </p>
            </>
          )}

          {(state === 'running' || state === 'paused' || state === 'done') && (
            <>
              <div className="flex justify-between text-xs text-stone-400">
                <span>{processed} übertragen{failed > 0 ? `, ${failed} ohne Erfolg` : ''} von {total}</span>
                <span>{progressPct} %</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#16100e]">
                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              {state === 'running' && (
                <p className="flex items-center gap-2 text-xs text-stone-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  Übertragung läuft … bitte Fenster offen lassen.
                </p>
              )}
              {state === 'paused' && (
                <p className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </p>
              )}
              {state === 'done' && (
                <p className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Fertig! Deine Fotos liegen jetzt in Google Drive (Ordner „Numismatik.App Fotos").
                </p>
              )}
            </>
          )}

          {error && state !== 'paused' && (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-300">{error}</p>
          )}

          {!connected && (
            <button
              onClick={handleConnect}
              disabled={connecting || state === 'running'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
              {connecting ? 'Verbinde …' : canResume || driveStatus() === 'expired' ? 'Mit Google Drive neu verbinden' : 'Mit Google Drive verbinden'}
            </button>
          )}

          {connected && state !== 'done' && (
            <button
              onClick={handleRun}
              disabled={state === 'running' || total === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {state === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {state === 'paused' ? 'Weiter machen' : state === 'running' ? 'Übertragung läuft …' : 'Jetzt übertragen'}
            </button>
          )}

          {state === 'done' && (
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400"
            >
              Schliessen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
