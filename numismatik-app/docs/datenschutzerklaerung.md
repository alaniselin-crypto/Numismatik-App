# Datenschutzerklärung – INUMIS

Stand: 1. Oktober 2026

Diese Datenschutzerklärung gilt für die Website inumis.app sowie für die App INUMIS (Numismatik) für iPhone, iPad und Mac.

## 1. Verantwortlicher

Alan Iselin
Via Colombera 2
6987 Caslano
Schweiz

E-Mail: support@inumis.app
Telefon: +41 79 800 29 20

## 2. Grundsätze

Wir bearbeiten personenbezogene Daten nur, soweit dies für den Betrieb der Website und der App sowie für die vom Benutzer gewünschten Funktionen nötig ist. Massgebend ist das Schweizer Datenschutzgesetz (DSG) und, soweit anwendbar, die Datenschutz-Grundverordnung der EU (DSGVO).

INUMIS zeigt keine Werbung, setzt kein Tracking und keine Analyse-Werkzeuge ein und verkauft keine Daten.

## 3. Benutzerkonto und Anmeldung

Für die Nutzung der App ist ein Benutzerkonto erforderlich. Die Anmeldung ist mit E-Mail und Passwort, mit Google oder mit Apple möglich. Dabei werden insbesondere bearbeitet:

- E-Mail-Adresse und gegebenenfalls Name aus dem Google- oder Apple-Konto
- eine Benutzer-ID
- technische Anmeldedaten (z. B. Zeitpunkt der Anmeldung, IP-Adresse, Geräte-Informationen)

Für die Anmeldung verwenden wir Firebase Authentication von Google.

## 4. Sammlungsdaten

In der App können Benutzer ihre Sammlung erfassen, zum Beispiel Bezeichnung, Land, Jahrgang, Nominal, Material, Erhaltung, Seltenheit, Katalog- und Inventarnummer, Kaufpreis, Verkaufswert, Lagerort, Verkaufsangaben, Notizen sowie Fotos der Vorder- und Rückseite.

Diese Daten werden dem Benutzerkonto zugeordnet und dienen ausschliesslich dazu, die Sammlung anzuzeigen, auszuwerten, zu drucken, zu exportieren und zwischen den Geräten des Benutzers zu synchronisieren.

## 5. Speicherort der Daten

- **Google Cloud Firestore:** Sammlungsdaten und ein kleines Vorschaubild jedes Fotos.
- **Google Firebase Storage:** die Fotos in voller Grösse. Jeder Benutzer hat nur Zugriff auf seine eigenen Fotos.
- **Auf dem Gerät:** eine lokale Kopie der Sammlung, damit die App auch ohne Internet funktioniert.
- **Google Drive (optional, nur Mac):** Wenn der Benutzer dies ausdrücklich einschaltet, werden Fotos in voller Grösse im eigenen Google Drive des Benutzers abgelegt. INUMIS erhält dafür nur Zugriff auf die von der App selbst angelegten Dateien.

## 6. Kamera und Fotos

Die App greift nur nach Erlaubnis des Benutzers auf Kamera oder Fotomediathek zu, und nur auf die Bilder, die der Benutzer auswählt. Die Fotos werden verkleinert und wie in Ziffer 5 beschrieben gespeichert.

## 7. KI-Münzerkennung

Wenn der Benutzer die KI-Erkennung oder die KI-Beschreibung ausdrücklich startet, werden die ausgewählten Münzfotos und die bereits erfassten Angaben über unseren Server an OpenAI übermittelt, um die Münze zu bestimmen und Angaben vorzuschlagen. Nach Angaben von OpenAI werden über die Programmierschnittstelle übermittelte Daten nicht zum Training der Modelle verwendet und höchstens 30 Tage zur Missbrauchserkennung aufbewahrt.

KI-Ergebnisse können falsch oder unvollständig sein und sollten vom Benutzer geprüft werden.

## 8. Abonnement „Numismatik Pro“ und In-App-Käufe

Die Gratis-Version erlaubt eine begrenzte Anzahl Münzen. Für mehr kann ein Abonnement abgeschlossen werden.

Kauf, Zahlung und Kündigung laufen vollständig über Apple (App Store). INUMIS erhält keine Zahlungs- oder Kreditkartendaten. Damit das Abonnement dem richtigen Konto zugeordnet werden kann, bearbeiten wir:

- die Benutzer-ID
- eine zufällige Konto-Kennung, die beim Kauf an Apple übergeben wird
- die von Apple signierten Kaufbelege (Produkt, Transaktionsnummer, Kauf- und Ablaufdatum, Status)

Diese Angaben werden auf unserem Server geprüft und gespeichert, damit das Abonnement auf allen Geräten des Benutzers gilt.

## 9. Server

Für die KI-Funktion, die Prüfung der Abonnements und die Kontolöschung betreiben wir einen Server bei Render Services, Inc. Dabei fallen technisch notwendige Verbindungsdaten an (IP-Adresse, Zeitpunkt, angefragte Funktion, Fehlerprotokolle).

## 10. Optionaler Import

Benutzer können Münzen aus CSV-Dateien oder Fotos importieren; dies geschieht auf dem Gerät. Für den optionalen automatischen Import aus Google Drive kann der Dienst Make (Celonis) eingesetzt werden, der die Import-Daten an unseren Server übermittelt.

## 11. Website inumis.app

Beim Besuch der Website werden technisch notwendige Daten bearbeitet (IP-Adresse, Datum und Uhrzeit, aufgerufene Seiten, Browser und Betriebssystem, Server- und Fehlerprotokolle), um die Website sicher und stabil bereitzustellen.

## 12. Dienstleister und Datenübermittlung ins Ausland

| Dienstleister | Zweck |
|---|---|
| Google (Firebase, Google Cloud, Google Drive) | Anmeldung, Speicherung, Synchronisierung, Fotos |
| OpenAI | KI-Münzerkennung |
| Render Services, Inc. | Server |
| Apple | App Store, Anmeldung mit Apple, In-App-Käufe |
| Make (Celonis) | optionaler automatischer Import |

Diese Dienstleister können Daten auch ausserhalb der Schweiz, insbesondere in den USA, bearbeiten. Die Übermittlung stützt sich, soweit vorhanden, auf das Swiss-U.S. Data Privacy Framework bzw. das EU-U.S. Data Privacy Framework oder auf Standardvertragsklauseln.

## 13. Speicherdauer und Löschung

Daten werden gespeichert, solange das Benutzerkonto besteht.

- Löscht der Benutzer eine Münze oder alle Münzen, werden die Daten und Fotos aus der Cloud entfernt.
- Über „Konto löschen“ in der App werden das Konto, alle Sammlungsdaten und alle Fotos gelöscht.
- Angaben zu Käufen werden nur so lange aufbewahrt, wie es gesetzliche Pflichten verlangen.
- Bei den Dienstleistern können technische Protokolle und Sicherungskopien für kurze Zeit weiter bestehen, bevor sie automatisch gelöscht werden.

## 14. Datensicherheit

Die Verbindungen zwischen App, Server und Cloud-Diensten sind mit HTTPS verschlüsselt. Der Zugriff auf Sammlungsdaten und Fotos ist durch Sicherheitsregeln auf das jeweilige Benutzerkonto beschränkt.

## 15. Rechte der Benutzer

Benutzer können Auskunft über ihre Daten verlangen sowie deren Berichtigung, Herausgabe oder Löschung. Die Sammlung kann jederzeit selbst als CSV exportiert werden. Anfragen bitte an support@inumis.app.

Benutzer haben zudem das Recht, sich beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) oder, in der EU, bei der zuständigen Aufsichtsbehörde zu beschweren.

## 16. Kinder

Die App richtet sich nicht an Kinder unter 13 Jahren.

## 17. Änderungen

Wir passen diese Erklärung an, wenn sich die App oder die eingesetzten Dienste ändern. Es gilt die jeweils auf inumis.app veröffentlichte Fassung.
