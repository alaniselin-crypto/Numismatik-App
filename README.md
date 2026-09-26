# NumismatikApp

Digitale Münz- und Banknotensammlung für Mac und iPhone: Katalog, Fotos, Ordner, Export und KI-Erkennung. Entstanden in [Lovable](https://lovable.dev/projects/d8cecf1a-d11f-4812-805f-5dbc2b4f67f0) und mit GitHub verbunden.

Die laufende App liegt in `numismatik-app/`. Die Seiten im Projektroot sind die öffentliche Website mit Datenschutz und Support.

## App starten

```sh
cd numismatik-app
npm install
npm run dev
```

Die App läuft dann unter http://localhost:3000. Ohne Anmeldung bleibt die Sammlung lokal im Browser. Cloud-Sync, KI-Erkennung und Konto löschen brauchen ein Firebase-Konto und serverseitig `OPENAI_API_KEY`.

## Website

```sh
npm install
npm run dev
```

- `/` Übersicht
- `/datenschutz` Datenschutzerklärung
- `/support` Support-Seite für den App Store (`kontakt@numismatik.app`)

## Noch offen

Die Bundle-ID der iPhone-App ist weiterhin `com.alaniselin.numisma.test`. Sie darf erst auf `com.alaniselin.numisma` wechseln, wenn diese ID in App Store Connect angelegt ist. Ein echter Testkauf und das Löschen eines Cloud-Kontos brauchen das Apple- bzw. Firebase-Konto.
