#!/usr/bin/env bash
# Baut die App und packt ein Xcode-Projekt, das auf dem iPhone gestartet werden kann.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

python3 scripts/patch-firebase-auth-close.py

node --import tsx --test src/utils/workingBehavior.lock.test.ts src/utils/signedOutCollection.test.ts

npm run build:ios
npx cap sync ios

node --input-type=module << 'EOF'
import fs from "node:fs";
const path = "ios/App/App/capacitor.config.json";
const config = JSON.parse(fs.readFileSync(path, "utf8"));
const list = new Set(config.packageClassList ?? []);
list.add("AppleStoreKitPlugin");
list.add("GoogleDesktopSignInPlugin");
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

Das ist Build 36. Die Google-Anmeldung holt das Geheimnis vom Render-Server,
so wie die Mac-App.

Den alten Xcode-Ordner nicht noch einmal archivieren. Der erzeugt wieder
die alte App.

1. Diese Zip-Datei auf den Mac kopieren und entpacken.
   Den Ordner danach nicht auseinandernehmen: «ios» und «node_modules» müssen nebeneinander bleiben.

2. Xcode öffnen und diese Datei wählen:
   ios → App → App.xcodeproj

3. Oben «Any iOS Device» wählen.

4. Im Projekt links auf «App» klicken, dann den Reiter «Signing & Capabilities».
   Haken bei «Automatically manage signing».
   Bei Team «Alan Iselin» auswählen.

5. Menü Product → Archive.
   Danach Distribute App → App Store Connect → Upload.

6. In App Store Connect unter TestFlight auf Build 1.0 (36) warten.
   Status zuerst «Wird verarbeitet», dann «Abgeschlossen».
   Danach in der TestFlight-App auf dem iPhone auf Aktualisieren tippen.

Beim ersten Archive kann Xcode ein paar Minuten Pakete laden (Capacitor, Firebase).
Das ist normal, solange der Mac online ist.

Wenn ein Fenster «Create Git repositories» kommt: Cancel.
EOF

OUT="${1:-$ROOT/../Numismatik-iPhone.zip}"
rm -f "$OUT"
(
  cd "$(dirname "$STAGE")"
  zip -r -y "$OUT" "$(basename "$STAGE")" -x '*.DS_Store'
)
echo "Paket geschrieben: $OUT"
