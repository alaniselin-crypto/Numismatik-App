# Roadmap

## Erledigt (vom User selbst)
- [x] Datenschutzerklärung in App Store Connect (User, 17.09.2026)
- [x] Abo-Preise ausgefüllt (kopiert von inumis)

## Offen

### Windows-Punkte (User-Liste, 21.09.2026 – korrigiert und geprüft in v20)
- [x] SKU-Nummerierung nach vollständigem Cloud-Laden zuverlässig auf 00001 zurücksetzen
- [x] Analyse-Darstellung: störende Breitenregel entfernen und Diagramme sichtbar prüfen
- [x] Hauptfenster kleiner: 1120×760 (statt 1280×850)
- [x] Dashboard: Dollar-Symbol durch Münz-Symbol ersetzt, Beträge sind CHF
- [x] CSV- und Bildimport: Duplikate vor neuer SKU-Vergabe erkennen
- [x] Einstellungen oben rechts: Breitenbegrenzung reparieren und Menü sichtbar prüfen

### Fehlerliste des Users (17.09.2026)
- [x] Eigene Felder anlegen/verwalten (Admin)
- [x] Einstellungen: Datensicherung & CSV Export/Import ohne Funktion (v11: iPhone nutzt natives Teilen-Menü via @capacitor/filesystem + share)
- [x] Material und Legierung standardmässig leer
- [x] Einstellungen: Anleitung und Hilfe
- [x] Einstellungen-Fenster verschiebt sich links/rechts (Menü sitzt fest im Fenster)
- [x] Hauptbildschirm verschiebt sich links/rechts (Eingabefelder auf dem Handy mindestens 16px)
- [x] Datenschutzerklärung ganz unten bei der Anmeldung
- [x] Übersicht: mit welchen Diensten ist Numismatik verbunden (GitHub etc.)
- [ ] Konto löschen funktioniert nicht (Ablauf ist gebaut, braucht einen echten Test mit Firebase-Konto)
- [x] Wo werden Benutzerbilder gespeichert (Cloud?) – klären und anzeigen
- [x] Admin-eigene Felder, nur für Admin sichtbar (v10, Code MZ-ADMIN)
- [x] KI-Bilderkennung: Felder automatisch ausfüllen (läuft über den Server, Anmeldung nötig)
- [x] Makro-Foto
- [x] Druckansicht & Katalog-Export schöner darstellen (Bildspalte, Münzen rund, Banknoten rechteckig)
- [x] Eigene Felder: neue Feldtypen «Checkbox» und «Dropdown» (mit eigenen Optionen) ergänzen – NICHT sofort als Version bauen, User sammelt noch (Bild image-26, 17.09.)
- [x] Münzbilder: KORREKTUR – runde Form BLEIBT (Quadrat-Wunsch zurückgezogen, 17.09.); Banknoten rechteckig (bestätigt)
- [x] Detailansicht: nur EIN Löschen-Button (aktuell 2x «Löschen», Bild image-36, 18.09.)
- [x] Klick auf goldenes App-Symbol → Infofenster mit «Numismatik.App» und Name «Alan Iselin» statt Logo-Download-Fenster (18.09.)
- [x] Schriftgrösse insgesamt etwas kleiner (Bild image-29, 17.09.)
- [x] CSV-Import-Bug: Backup mit 61 Münzen, nach Löschen nur 20 importiert – Import bricht/limitiert (17.09.)
- [ ] Weitere Bilder vom User abwarten

### App Store
- [x] Datenschutz-Seite vorhanden unter /datenschutz (öffentlich weiterhin https://inumis.app/datenschutzerklarung/)
- [x] Support-URL für Apple: Seite /support, Kontakt kontakt@numismatik.app
- [ ] Bundle-ID von .test auf finalen Namen wechseln (bleibt com.alaniselin.numisma.test, bis die ID in App Store Connect umgestellt ist)
- [ ] 3 Abo-Technik-Punkte: Server-Prüfung gegen doppelte/veraltete Käufe, Apple-Server-Meldungen, echter Testkauf
- [x] Banknoten rechteckig, Münzen rund (Quadrat-Wunsch zurückgezogen)

- v10 gebaut (18.09.2026): /mnt/documents/Numismatik-App-v10.zip
- v11 gebaut (18.09.2026): Backup am iPhone repariert (Teilen-Menü), goldenes Münz-Logo oben links statt altem Symbol; iOS-Flow jetzt `npx cap sync ios` statt copy

- v22 (23.09.2026): SKU-Nummern werden nie wiederverwendet – geloeschte Nummer (z.B. 00009) bleibt frei, naechste neue Muenze bekommt 00010. Windows-Paket v22 geliefert.

### SKU-Korrektur v23 (23.09.2026)
- [x] Bestand einmalig ab 00001 neu nummerieren
- [x] Danach gelöschte SKU dauerhaft nie wieder vergeben
- [x] Beide Regeln gemeinsam prüfen und Windows-Paket liefern

### iPhone v23 (24.09.2026)
- [x] Quellcode v23 (SKU-Fixes) für iPhone bereitgestellt: ios/-Ordner neu erstellt (war in allen ZIPs verloren), StoreKit-Brücke neu geschrieben, Symbol + Kamera-Zulassung, Name „Numismatik"
- [x] Numismatik-App-v23-Quellcode.zip nach /mnt/documents/ geliefert
- [x] Xcode-Fehler „Cannot find MyViewController in scope“ korrigiert: MyViewController.swift und AppleStoreKit.swift im App-Ziel eingebunden
- [x] Terminal-Befehle (npm install/build:ios/cap sync) überflüssig gemacht: v23-Fertig.zip enthält gebaute App-Seiten direkt im ios/App/Public — User öffnet nur noch Xcode
- [ ] User: Xcode öffnen (ios → App → App.xcodeproj) → Team wählen → Any iOS Device (arm64) → Product → Archive → Distribute App → Upload
- [ ] Nach Upload: neue Screenshots 02/03 (CHF NaN) ersetzen
