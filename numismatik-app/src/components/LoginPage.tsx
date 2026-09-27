import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.63.39 3.17 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}

function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'E-Mail-Adresse oder Passwort ist nicht korrekt.';
  if (code.includes('user-not-found')) return 'Für diese E-Mail-Adresse wurde kein Konto gefunden.';
  if (code.includes('email-already-in-use')) return 'Diese E-Mail-Adresse ist bereits registriert.';
  if (code.includes('weak-password')) return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
  if (code.includes('popup-closed') || code.includes('canceled')) return 'Die Anmeldung wurde abgebrochen.';
  return error instanceof Error ? error.message : 'Die Anmeldung ist fehlgeschlagen.';
}

export function LoginPage() {
  const { loginWithEmail, registerWithEmail, resetPassword, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [busy, setBusy] = useState<'google' | 'email' | 'reset' | null>(null);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setBusy('email');
    try {
      if (registerMode) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (error) {
      setMessage({ type: 'error', text: authErrorMessage(error) });
      setBusy(null);
    }
  };

  const submitGoogle = async () => {
    setMessage(null);
    setBusy('google');
    try {
      await loginWithGoogle();
    } catch (error) {
      setMessage({ type: 'error', text: authErrorMessage(error) });
      setBusy(null);
    }
  };

  const sendReset = async () => {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Bitte zuerst Ihre E-Mail-Adresse eingeben.' });
      return;
    }
    setMessage(null);
    setBusy('reset');
    try {
      await resetPassword(email);
      setMessage({ type: 'success', text: 'Der Link zum Zurücksetzen wurde per E-Mail versendet.' });
    } catch (error) {
      setMessage({ type: 'error', text: authErrorMessage(error) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#100c0b] px-4 py-[max(1rem,env(safe-area-inset-top))] text-stone-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-[-5rem] h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -right-28 bottom-[-6rem] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
        <section className="w-full overflow-hidden rounded-[2rem] border border-amber-500/20 bg-[#181513]/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <div className="border-b border-amber-500/15 bg-gradient-to-b from-amber-500/[0.08] to-transparent px-6 pb-6 pt-7 text-center">
            <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-2xl border border-amber-400/30 shadow-xl shadow-amber-950/50">
              <img src={logoImg} alt="Numismatik.App" className="h-full w-full object-cover" />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-50">Numismatik.App</h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Ihre Sammlung. Sicher, übersichtlich und überall verfügbar.
            </p>
          </div>

          <div className="space-y-5 px-6 py-6">
            <button
              type="button"
              onClick={submitGoogle}
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-600/70 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-slate-100 disabled:opacity-60"
            >
              <GoogleIcon />
              <span>{busy === 'google' ? 'Google wird geöffnet …' : 'Mit Google anmelden'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700/70" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">oder mit E-Mail</span>
              <div className="h-px flex-1 bg-slate-700/70" />
            </div>

            <form onSubmit={submitEmail} className="space-y-3.5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-stone-300">E-Mail-Adresse</span>
                <span className="relative block">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                    placeholder="name@beispiel.ch"
                    className="w-full rounded-xl border border-slate-700 bg-[#100f11] py-3 pl-10 pr-4 text-base text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-stone-300">Passwort</span>
                <span className="relative block">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    autoComplete={registerMode ? 'new-password' : 'current-password'}
                    required
                    minLength={6}
                    placeholder="Mindestens 6 Zeichen"
                    className="w-full rounded-xl border border-slate-700 bg-[#100f11] py-3 pl-10 pr-11 text-base text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    className="absolute right-3 top-2.5 rounded-lg p-1.5 text-stone-500 hover:text-amber-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              {message && (
                <div className={`rounded-xl border px-3.5 py-3 text-xs leading-relaxed ${
                  message.type === 'error'
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                }`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={busy !== null}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-3.5 text-sm font-extrabold text-[#24160a] shadow-lg shadow-amber-950/50 transition hover:from-amber-300 hover:to-amber-400 disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {busy === 'email' ? 'Bitte warten …' : registerMode ? 'Konto erstellen' : 'Mit E-Mail anmelden'}
              </button>
            </form>

            <div className="flex items-center justify-between gap-3 text-xs">
              {!registerMode ? (
                <button type="button" onClick={sendReset} disabled={busy !== null} className="text-stone-400 hover:text-amber-300">
                  Passwort vergessen?
                </button>
              ) : <span />}
              <button
                type="button"
                onClick={() => {
                  setRegisterMode(value => !value);
                  setMessage(null);
                }}
                className="font-semibold text-amber-400 hover:text-amber-300"
              >
                {registerMode ? 'Bereits registriert?' : 'Neues Konto erstellen'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-slate-800 px-6 py-4 text-[11px] text-stone-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Geschützte Anmeldung und verschlüsselte Cloud-Synchronisation</span>
          </div>
        </section>
      </div>
    </main>
  );
}
