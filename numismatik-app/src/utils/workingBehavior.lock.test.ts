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

test('phone layout keeps charts and the coin list readable', () => {
  const css = source('src/index.css');
  assert.match(css, /svg:not\(\.recharts-surface\)/);
  assert.match(css, /\.recharts-surface \{[\s\S]*height: 100% !important;/);
  assert.match(css, /\.recharts-wrapper \* \{[\s\S]*overflow-wrap: normal !important;/);
  assert.equal(css.includes(':not(.recharts-wrapper)'), true);
  assert.match(css, /#root main \{[\s\S]*overflow-x: clip;/);
  assert.match(css, /\.collection-table th,[\s\S]*white-space: nowrap;/);
  assert.equal(css.includes('overflow-wrap: anywhere'), false);
  assert.equal(css.includes('word-break: break-all'), false);
  assert.match(source('src/components/CoinList.tsx'), /className="collection-table /);
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

test('Google and Apple sign-in stay configured for the iPhone build', () => {
  const config = source('capacitor.config.ts');
  assert.match(config, /providers: \['apple\.com', 'google\.com'\]/);
  assert.match(config, /skipNativeAuth: true/);
  assert.match(config, /googleClientId: firebaseConfig\.oAuthClientId/);
  assert.match(source('src/context/AuthContext.tsx'), /GoogleDesktopSignIn\.signIn\(\)/);
  const plist = source('ios/App/App/Info.plist');
  assert.match(plist, /com\.googleusercontent\.apps\.211237775065-c5l25t57c5oe9bl02gkl2p93qq0mchok/);
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
  assert.match(patch, /if FirebaseApp\.app\(\) != nil/);
  assert.match(patch, /deinit already absent/);
  assert.equal(patch.includes('DEINIT_INSERT'), false);
  assert.equal(patch.includes('FirebaseAuthentication.signOut'), false);
});
