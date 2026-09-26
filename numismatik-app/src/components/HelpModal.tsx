import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Cloud,
  Image as ImageIcon,
  Coins,
  Camera,
  FolderOpen,
  ShoppingBag,
  Printer,
  Database,
  ShieldCheck,
  Apple,
  HardDrive,
  Mail
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'anleitung' | 'dienste' | 'bilder';

const steps = [
  {
    icon: Coins,
    title: 'Münze hinzufügen',
    text: 'Tippen Sie unten auf «Hinzufügen». Pflicht ist nur der Titel – alles andere können Sie später ergänzen.'
  },
  {
    icon: Camera,
    title: 'Fotos aufnehmen',
    text: 'Im Formular können Sie Vorderseite und Rückseite fotografieren oder aus der Fotomediathek wählen. Die Bilder werden automatisch verkleinert.'
  },
  {
    icon: FolderOpen,
    title: 'Ordner & Lagerorte',
    text: 'Unter Einstellungen → «Ordner verwalten» legen Sie Lagerorte an (z. B. Tresor Fach B, Schweiz, Ausland) und ordnen Münzen zu.'
  },
  {
    icon: ShoppingBag,
    title: 'Verkaufsplattformen',
    text: 'Unter Einstellungen → «Verkaufsplattformen» tragen Sie Ricardo, eBay, Tutti usw. ein und markieren Münzen, die zum Verkauf stehen.'
  },
  {
    icon: Printer,
    title: 'Drucken & Katalog',
    text: 'In der Sammlung öffnen Sie die Druckansicht. Dort können Sie die Liste als PDF sichern oder ausdrucken.'
  },
  {
    icon: Database,
    title: 'Datensicherung',
    text: 'Unter «Export & Backup» sichern Sie die ganze Sammlung als Datei oder Tabelle (CSV) – und lesen sie dort auch wieder ein.'
  }
];

const services = [
  {
    icon: Cloud,
    name: 'Google Firebase (Firestore)',
    role: 'Ihr Konto und Ihre Sammlung',
    text: 'Anmeldung (E-Mail und Passwort) sowie alle Münzdaten inklusive Fotos liegen verschlüsselt in der Firebase-Datenbank von Google. Nur Sie sehen Ihre Daten.'
  },
  {
    icon: Apple,
    name: 'Apple App Store',
    role: 'Abo (Pro-Version)',
    text: 'Käufe und Verlängerungen laufen ausschliesslich über Ihr Apple-Konto. Wir sehen keine Zahlungsdaten.'
  },
  {
    icon: HardDrive,
    name: 'Google Drive (freiwillig)',
    role: 'Bilder-Import',
    text: 'Nur wenn Sie den Drive-Import selbst starten, werden Bilder aus Ihrem Google-Drive-Ordner gelesen. Ohne Ihren Klick passiert nichts.'
  },
  {
    icon: ShieldCheck,
    name: 'GitHub',
    role: 'Nicht verbunden',
    text: 'GitHub wird nur für die Entwicklung des Programms genutzt. Die App auf Ihrem Gerät hat keine Verbindung dorthin und sendet keine Daten.'
  }
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<Tab>('anleitung');

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'anleitung', label: 'Anleitung', icon: BookOpen },
    { id: 'dienste', label: 'Dienste', icon: Cloud },
    { id: 'bilder', label: 'Bilder', icon: ImageIcon }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-hidden bg-[#181a22] border border-amber-500/30 rounded-2xl shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800 bg-[#181a22]">
          <h2 className="text-base sm:text-lg font-bold font-serif text-amber-400 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
            Anleitung & Hilfe
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            title="Schliessen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 sm:px-6 pt-3 pb-2 border-b border-slate-800 bg-[#181a22]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <t.icon className="w-3.5 h-3.5 shrink-0" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 text-sm text-slate-300">
          {tab === 'anleitung' && (
            <>
              <p className="text-xs text-slate-400">
                So bedienen Sie Numismatik.App Schritt für Schritt:
              </p>
              {steps.map((s, i) => (
                <div
                  key={s.title}
                  className="flex gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800"
                >
                  <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <s.icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-100 text-sm">
                      {i + 1}. {s.title}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.text}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Frage oder Problem? Schreiben Sie an{' '}
                  <a href="mailto:kontakt@numismatik.app" className="text-amber-300 underline">
                    kontakt@numismatik.app
                  </a>
                  . Wir antworten so rasch wie möglich.
                </p>
              </div>
            </>
          )}

          {tab === 'dienste' && (
            <>
              <p className="text-xs text-slate-400">
                Mit diesen Diensten arbeitet Numismatik.App zusammen:
              </p>
              {services.map((s) => (
                <div
                  key={s.name}
                  className="flex gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800"
                >
                  <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-slate-800 border border-slate-700">
                    <s.icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-100 text-sm">{s.name}</div>
                    <div className="text-[11px] uppercase tracking-wide text-amber-400/80">
                      {s.role}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.text}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === 'bilder' && (
            <>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm">
                  <Cloud className="w-4 h-4 text-amber-400" />
                  Angemeldet: Bilder liegen in der Cloud
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Wenn Sie mit Ihrem Konto angemeldet sind, werden Ihre Münzfotos zusammen mit
                  den Münzdaten in der Firebase-Datenbank von Google gespeichert. Dadurch sehen
                  Sie dieselbe Sammlung auf iPhone und Mac.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  Ohne Anmeldung: Bilder bleiben auf dem Gerät
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ohne Konto bleibt alles lokal im Speicher der App auf Ihrem Gerät. Wird die App
                  gelöscht, sind auch die Bilder weg – sichern Sie dann regelmässig über
                  «Export & Backup».
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  Grösse & Qualität
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Jedes Foto wird beim Speichern automatisch verkleinert (max. 800 Pixel), damit
                  die Sammlung schnell bleibt und wenig Platz braucht.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ihre Bilder gehören Ihnen. Sie werden nicht weitergegeben und nicht öffentlich
                  angezeigt.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-[#121318] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-colors"
          >
            Schliessen
          </button>
        </div>
      </div>
    </div>
  );
};
