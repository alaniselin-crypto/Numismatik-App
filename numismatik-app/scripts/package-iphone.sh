#!/usr/bin/env bash
# Baut die App und packt ein Xcode-Projekt, das auf dem iPhone gestartet werden kann.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

python3 scripts/patch-firebase-auth-close.py

npm run build:ios
npx cap sync ios

node --input-type=module << 'EOF'
import fs from "node:fs";
const path = "ios/App/App/capacitor.config.json";
const config = JSON.parse(fs.readFileSync(path, "utf8"));
const list = new Set(config.packageClassList ?? []);
list.add("AppleStoreKitPlugin");
config.packageClassList = [...list];
fs.writeFileSync(path, JSON.stringify(config, null, "\t") + "\n");
EOF

STAGE="$(mktemp -d)/Numismatik-iPhone"
mkdir -p "$STAGE/node_modules/@capacitor" "$STAGE/node_modules/@capacitor-firebase"
cp -a ios "$STAGE/ios"
rm -rf "$STAGE/ios/DerivedData" "$STAGE/ios/App/build" "$STAGE/ios/App/Pods" "$STAGE/ios/App/output"
find "$STAGE/ios" -name xcuserdata -type d -prune -exec rm -rf {} +
rm -f "$STAGE/ios/App/CapApp-SPM/symlinks/CapacitorFirebaseAuthentication"
ln -s ../../../../node_modules/@capacitor-firebase/authentication \
  "$STAGE/ios/App/CapApp-SPM/symlinks/CapacitorFirebaseAuthentication"
cp -a node_modules/@capacitor/filesystem "$STAGE/node_modules/@capacitor/filesystem"
cp -a node_modules/@capacitor/share "$STAGE/node_modules/@capacitor/share"
cp -a node_modules/@capacitor-firebase/authentication "$STAGE/node_modules/@capacitor-firebase/authentication"
find "$STAGE" -name '.DS_Store' -delete

cat > "$STAGE/ANLEITUNG.txt" << 'EOF'
Numismatik auf dem iPhone öffnen
=================================

Du brauchst einen Mac mit Xcode (Version 16 oder neuer) und ein iPhone mit Kabel.

1. Diese Zip-Datei auf den Mac kopieren und entpacken.
   Den Ordner danach nicht auseinandernehmen: «ios» und «node_modules» müssen nebeneinander bleiben.

2. Xcode öffnen und diese Datei wählen:
   ios → App → App.xcodeproj

3. Oben in Xcode links neben dem Play-Knopf dein iPhone auswählen
   (nicht «Any iOS Device»).

4. Im Projekt links auf «App» klicken, dann den Reiter «Signing & Capabilities».
   Haken bei «Automatically manage signing».
   Bei Team deine Apple-ID auswählen. Eine kostenlose Apple-ID reicht zum Ausprobieren.

5. iPhone per Kabel anschliessen. Auf dem iPhone «Vertrauen» tippen.
   Falls Xcode nach dem Entwicklermodus fragt: auf dem iPhone unter
   Einstellungen → Datenschutz & Sicherheit → Entwicklermodus einschalten.

6. Play-Knopf in Xcode drücken. Die App «Numismatik» startet auf dem iPhone.

Beim ersten Start kann Xcode ein paar Minuten Pakete laden (Capacitor, Firebase).
Das ist normal, solange der Mac online ist.

Ohne Anmeldung siehst du die Sammlung lokal auf dem Gerät.
EOF

OUT="${1:-$ROOT/../Numismatik-iPhone.zip}"
rm -f "$OUT"
(
  cd "$(dirname "$STAGE")"
  zip -r -y "$OUT" "$(basename "$STAGE")" -x '*.DS_Store'
)
echo "Paket geschrieben: $OUT"
