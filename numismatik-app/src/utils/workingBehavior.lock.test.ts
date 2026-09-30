import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

function source(relativePath: string): string {
  return readFileSync(join(appRoot, relativePath), 'utf8');
}

function firstEffect(file: string): string {
  const start = file.indexOf('useEffect(() => {');
  const end = file.indexOf('}, []);', start);
  assert.ok(start >= 0 && end > start, 'Auth start effect is missing');
  return file.slice(start, end);
}

test('the iPhone app listens on launch and does not sign out', () => {
  const auth = source('src/context/AuthContext.tsx');
  const effect = firstEffect(auth);
  assert.equal(effect.includes('signOut'), false);
  assert.equal(effect.includes('FirebaseAuthentication'), false);
  assert.match(auth, /const logout = async \(\) => \{[\s\S]*FirebaseAuthentication\.signOut\(\)/);
  assert.match(auth, /const logout = async \(\) => \{[\s\S]*await signOut\(auth\)/);
});

test('native auth starts in memory and falls back if that fails', () => {
  const firebase = source('src/lib/firebase.ts');
  assert.match(firebase, /initializeAuth\(app, \{ persistence: inMemoryPersistence \}\)/);
  assert.match(firebase, /catch \(error\) \{[\s\S]*return getAuth\(app\)/);
});

test('signing out clears the coins on screen', () => {
  const app = source('src/App.tsx');
  const helper = source('src/utils/signedOutCollection.ts');
  assert.match(app, /collectionToKeepOnSignOut/);
  assert.match(helper, /saveOnDevice: false/);
  assert.match(helper, /coins: \[\]/);
});

test('signed-out users see only the dedicated login page', () => {
  const app = source('src/App.tsx');
  const login = source('src/components/LoginPage.tsx');
  const gate = app.indexOf('if (!user) return <LoginPage />');
  const application = app.indexOf('<Header');
  assert.ok(gate >= 0 && application > gate, 'The login gate must render before the application');
  assert.match(login, /function GoogleIcon/);
  assert.match(login, /Mit Google anmelden/);
  assert.match(login, /Mit E-Mail anmelden/);
  assert.ok(login.indexOf('Mit Google anmelden') < login.indexOf('<form'), 'Google must appear above the email form');
});

test('phone layout keeps charts and the coin list readable', () => {
  const css = source('src/index.css');
  assert.match(css, /svg:not\(\.recharts-surface\)/);
  assert.match(css, /\.recharts-wrapper > \.recharts-surface \{[\s\S]*height: 100% !important;/);
  assert.match(css, /\.recharts-legend-item \.recharts-surface \{[\s\S]*width: 12px !important;[\s\S]*height: 12px !important;/);
  assert.match(css, /\.recharts-wrapper \* \{[\s\S]*overflow-wrap: normal !important;/);
  assert.equal(css.includes(':not(.recharts-wrapper)'), true);
  assert.match(css, /#root main \{[\s\S]*overflow-x: clip;/);
  assert.match(css, /\.collection-table th,[\s\S]*white-space: nowrap;/);
  assert.equal(css.includes('overflow-wrap: anywhere'), false);
  assert.equal(css.includes('word-break: break-all'), false);
  assert.match(source('src/components/CoinList.tsx'), /className="collection-table /);
});

test('light mode covers every dark app surface and translucent card', () => {
  const css = source('src/index.css');
  const dashboard = source('src/components/Dashboard.tsx');
  const card = source('src/components/CoinCard.tsx');
  assert.match(css, /html\.light #root > div,[\s\S]*background-color: #f1ebe0 !important;/);
  assert.match(css, /html\.light \[class\*="bg-\[#0"\],[\s\S]*html\.light \[class\*="bg-\[#3"\]/);
  assert.match(css, /\.bg-slate-950\\\/85,[\s\S]*\.bg-slate-900\\\/90/);
  assert.match(css, /\.bg-stone-800\\\/50,[\s\S]*\.bg-stone-950\\\/85/);
  assert.match(css, /html\.light \[class\*="border-\[#"\],[\s\S]*border-color: #d8cfc1 !important;/);
  assert.match(dashboard, /dashboard-welcome/);
  assert.match(card, /coin-card-surface/);
  assert.match(css, /\.dashboard-welcome,[\s\S]*\.coin-card-surface \{[\s\S]*background-image: none !important;/);
  assert.match(css, /\.bg-purple-950\\\/30 \{[\s\S]*background-color: #f3e8ff !important;/);
  assert.match(css, /\.text-purple-200,[\s\S]*\.text-purple-400 \{[\s\S]*color: #6b21a8 !important;/);
  assert.match(css, /\.text-emerald-200,[\s\S]*\.text-emerald-400 \{[\s\S]*color: #047857 !important;/);
  assert.match(css, /\.sold-status-row \{[\s\S]*background-color: #faf7f0 !important;[\s\S]*border-color: #d8cfc1 !important;/);
  assert.match(css, /\.import-success-message \{[\s\S]*background-color: #d1fae5 !important;[\s\S]*color: #065f46 !important;/);
});

test('the user interface contains no blue accents', () => {
  const userInterface = [
    'src/index.css',
    'src/components/CoinFormModal.tsx',
    'src/components/PlatformManagerModal.tsx',
    'src/components/Dashboard.tsx',
    'src/components/FolderManagerModal.tsx',
    'src/components/CoinDetailModal.tsx',
    'src/components/AuthModal.tsx',
    'src/components/BackupExportView.tsx',
    'src/components/CoinCard.tsx',
    'src/components/PrintModal.tsx',
    'src/utils/storage.ts',
    'src/data/rarities.ts',
  ].map(source).join('\n');
  assert.equal(/\b(?:bg|text|border|ring|from|via|to)-(?:blue|sky)-/.test(userInterface), false);
  assert.equal(/#(?:2563eb|1d4ed8|93c5fd)/i.test(userInterface), false);
});

test('the marked phone controls stay simple and clearly labelled', () => {
  const card = source('src/components/CoinCard.tsx');
  const backup = source('src/components/BackupExportView.tsx');
  const print = source('src/components/PrintModal.tsx');
  const form = source('src/components/CoinFormModal.tsx');
  const gridHeader = card.slice(
    card.indexOf('/* Top Banner & Action */'),
    card.indexOf('/* Center Coin Visual Header */')
  );
  assert.match(card, /SKU #\{formatSKU\(coin\.catalogNumber \|\| coin\.id \|\| '1'\)\}/);
  assert.equal(gridHeader.includes('onDuplicate'), false);
  assert.match(backup, /CSV-Mustervorlage/);
  assert.match(backup, /CSV-Vorlage herunterladen/);
  assert.match(backup, /import-success-message/);
  assert.match(form, /sold-status-row/);
  assert.match(form, /formData\.isForSale \? 'bg-purple-600' : 'bg-slate-800'/);
  assert.match(form, /formData\.isSold \? 'bg-emerald-600' : 'bg-slate-800'/);
  assert.match(form, /formData\.isSold[\s\S]*Münze wurde bereits verkauft ✅[\s\S]*Münze ist noch nicht verkauft/);
  assert.equal(form.includes('peer-checked:after:translate-x-full'), false);
  assert.equal(print.includes('In neuem Druck-Fenster öffnen / PDF'), false);
  assert.match(print, /Drucken \/ PDF/);
});

test('small iPhone text stays readable and sales value stays optional', () => {
  const css = source('src/index.css');
  const form = source('src/components/CoinFormModal.tsx');
  assert.match(css, /#root \.text-\\\[10px\\\] \{[\s\S]*font-size: 12px !important;/);
  assert.match(css, /#root \.text-\\\[11px\\\] \{[\s\S]*font-size: 13px !important;/);
  assert.match(css, /#root \.text-xs \{[\s\S]*font-size: 14px !important;/);
  assert.match(css, /#root \.text-sm \{[\s\S]*font-size: 16px !important;/);
  assert.match(form, /Verkaufswert \(CHF\)[\s\S]*\(Optional\)/);
  assert.equal(form.includes('Verkaufswert (CHF) *'), false);
  assert.equal(form.includes('Verkaufswert muss mindestens 0 sein.'), false);
});

test('the app cannot restore example coins', () => {
  const app = source('src/App.tsx');
  const backup = source('src/components/BackupExportView.tsx');
  const storage = source('src/utils/storage.ts');
  assert.equal(app.includes('handleResetToSampleData'), false);
  assert.equal(app.includes('INITIAL_SAMPLE_COINS'), false);
  assert.equal(backup.includes('onResetToSampleData'), false);
  assert.equal(backup.includes('Auf Beispiel-Münzen Zurücksetzen'), false);
  assert.equal(backup.includes('setzen Sie sie auf Musterdaten zurück'), false);
  assert.equal(storage.includes('function resetCoinsToSampleData'), false);
  assert.match(storage, /function loadCoinsFromStorage\(\): Coin\[\] \{[\s\S]*return \[\];/);
});

test('delete-all is protected inside the top-right settings menu', () => {
  const app = source('src/App.tsx');
  const header = source('src/components/Header.tsx');
  const backup = source('src/components/BackupExportView.tsx');
  assert.match(app, /<Header[\s\S]*onClearAllCoins=\{handleClearAllCoins\}/);
  assert.match(header, /Alle Münzen löschen/);
  assert.match(header, /Wirklich alle \{totalCoins\} Münzen dauerhaft löschen\?/);
  assert.match(header, /await onClearAllCoins\(\)/);
  assert.equal(backup.includes('onClearAllCoins'), false);
  assert.equal(backup.includes('Alle Münzen Löschen'), false);
});

test('the coin grid does not print Avers on the picture', () => {
  const card = source('src/components/CoinCard.tsx');
  assert.equal(card.includes('>Avers<'), false);
  assert.equal(card.includes("? 'Avers'"), false);
  assert.match(card, /Zur Vorderseite \(Avers\)/);
});

test('epoch chart labels stay short enough for a phone', () => {
  const stats = source('src/components/StatisticsView.tsx');
  assert.match(stats, /era = 'Antike'/);
  assert.equal(stats.includes('Antike (vor 500'), false);
  assert.match(stats, /width=\{96\}/);
});

test('the mobile title and AI recognition fields stay configured', () => {
  const header = source('src/components/Header.tsx');
  const form = source('src/components/CoinFormModal.tsx');
  const server = source('server.ts');
  assert.match(header, /text-base sm:text-xl[\s\S]*Numismatik\.App/);
  assert.match(form, /normalizeRecognizedCurrency/);
  assert.match(form, /normalizeRecognizedCondition/);
  assert.match(form, /normalizeRecognizedRarity/);
  assert.match(form, /parseRecognizedValue/);
  assert.match(server, /Verkaufswert \(currentValue\)/);
  assert.match(server, /"currentValue": 25/);
  assert.match(server, /\["FR", "FRS", "SFR", "FRANKEN", "SCHWEIZERFRANKEN"\]/);
});

test('the yellow print buttons use the native iOS print dialog', () => {
  const modal = source('src/components/PrintModal.tsx');
  const nativePrint = source('ios/App/App/NativePrint.swift');
  const project = source('ios/App/App.xcodeproj/project.pbxproj');
  const packageScript = source('scripts/package-iphone.sh');
  assert.match(modal, /Capacitor\.getPlatform\(\) === 'ios'/);
  assert.match(modal, /await NativePrint\.print/);
  assert.match(nativePrint, /UIPrintInteractionController\.shared/);
  assert.match(nativePrint, /UIMarkupTextPrintFormatter/);
  assert.match(project, /NativePrint\.swift in Sources/);
  assert.match(packageScript, /list\.add\("NativePrintPlugin"\)/);
});

test('Google and Apple sign-in stay configured for the iPhone build', () => {
  const config = source('capacitor.config.ts');
  const auth = source('src/context/AuthContext.tsx');
  const patch = source('scripts/patch-firebase-auth-close.py');
  assert.match(config, /providers: \['apple\.com', 'google\.com'\]/);
  assert.match(config, /skipNativeAuth: true/);
  assert.match(config, /googleClientId: iosGoogleClientId/);
  assert.match(config, /211237775065-86r14bsi0as6u0an1gqf7c48dv7chr1g/);
  assert.equal(config.includes('googleClientId: firebaseConfig.oAuthClientId'), false);
  assert.match(auth, /FirebaseAuthentication\.signInWithGoogle\(\{ skipNativeAuth: true \}\)/);
  assert.equal(auth.includes('GoogleDesktopSignIn'), false);
  assert.match(patch, /GOOGLE_NEW = """[\s\S]*GIDConfiguration\(clientID: clientId\)\n"""/);
  const plist = source('ios/App/App/Info.plist');
  assert.match(plist, /com\.googleusercontent\.apps\.211237775065-86r14bsi0as6u0an1gqf7c48dv7chr1g/);
  assert.equal(plist.includes('com.googleusercontent.apps.211237775065-c5l25t57c5oe9bl02gkl2p93qq0mchok'), false);
});

test('the iPhone build number stays above the crashing build', () => {
  const project = source('ios/App/App.xcodeproj/project.pbxproj');
  const versions = [...project.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map(match => Number(match[1]));
  assert.equal(versions.length, 2);
  assert.ok(versions.every(version => version >= 32));
});

test('the iOS auth patch does not sign out or tear Firebase down', () => {
  const patch = source('scripts/patch-firebase-auth-close.py');
  assert.match(patch, /providers\.compactMap \{ \$0 as\? String \}/);
  assert.match(patch, /googleClientId/);
  assert.match(patch, /GIDConfiguration\(clientID: clientId\)/);
  assert.match(patch, /if FirebaseApp\.app\(\) != nil/);
  assert.match(patch, /SIGN_OUT_NEW = """[\s\S]*if FirebaseApp\.app\(\) != nil \{[\s\S]*try Auth\.auth\(\)\.signOut\(\)/);
  assert.match(patch, /deinit already absent/);
  assert.equal(patch.includes('DEINIT_INSERT'), false);
  assert.equal(patch.includes('FirebaseAuthentication.signOut'), false);
});
