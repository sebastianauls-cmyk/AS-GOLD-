# AS Gold V38 – Verbindlicher Abnahmeplan

Stand: 01.09.2026

## Ziel
V38 wird erst als praktisch abgenommen bewertet, wenn der vollständige Nutzerweg mit synthetischen Testdaten nachvollziehbar funktioniert: Einstieg → Registrierung/Login → Dokument/Fall → Analyse → Frist → Ampel/Begründung → genau ein nächster Schritt → Freigabe → Export.

## Ampelregeln
- 🟢 Bestanden: praktisch oder automatisiert mit belastbarem Nachweis geprüft.
- 🟡 Offen: technisch vorbereitet/simuliert, reale Interaktion noch ausstehend.
- 🔴 Blockiert: Fehler verhindert Kernfunktion, Sicherheit oder Transparenz.

## Aktueller Ausgangsstand
- 🟢 Produktionsbuild und V34–V38-Guards grün.
- 🟢 Pre-Launch-Guard aktiv.
- 🟢 Praktische Simulation mit synthetischem Fall bestanden.
- 🟢 DOCX/PDF/XLSX/PPTX werden im Build tatsächlich erzeugt und strukturell geprüft.
- 🟢 OAuth-State-, Cookie- und Token-Manipulationstests bestanden.
- 🟢 Zahlungsfunktion bleibt deaktiviert.
- 🟢 Testdaten-Schranke bleibt aktiv: nur synthetische oder wirksam anonymisierte Daten.
- 🟡 Reale Endgeräte-/Browser-/Testkonto-/Anbieter-OAuth-Abnahme steht noch aus.

## Verbindlicher Testablauf

### A. Einstieg und Konto
1. Startseite öffnen.
2. Sprache auswählen.
3. Registrierung mit Testkonto durchführen.
4. Rechtstexte/Testdaten-Regel bestätigen.
5. E-Mail-Bestätigung durchführen.
6. Login, Logout und Passwort-Reset prüfen.

Bestanden, wenn: keine Sackgasse entsteht, Fehlermeldungen verständlich sind und kein kostenpflichtiger Vorgang ausgelöst wird.

### B. Fall und Dokument
1. Synthetischen Kunden/Fall anlegen.
2. Vorbereitete synthetische Musterdatei hochladen.
3. Datenklasse korrekt auswählen.
4. KI-Analyse ausdrücklich starten.
5. Erkannte Inhalte vor Speicherung kontrollieren.

Bestanden, wenn: nur zulässige Testdaten akzeptiert werden, Upload-/Analysefehler sichtbar bleiben und nichts ungeprüft als sicher dargestellt wird.

### C. Frist, Ampel und nächster Schritt
1. Erkannte Frist mit Originaldokument vergleichen.
2. Dringlichkeit prüfen.
3. Ampel öffnen und „Warum?“ kontrollieren.
4. Fehlende Unterlagen/Unsicherheit prüfen.
5. Sicherstellen, dass genau eine Hauptempfehlung sichtbar ist.

Bestanden, wenn: bloße Termine nicht als Frist erscheinen, Unsicherheit erkennbar ist und der nächste Schritt priorisiert und nachvollziehbar ist.

### D. Freigabe und Export
1. Ergebnis manuell kontrollieren.
2. Freigabe auslösen.
3. Export nacheinander als PDF, DOCX, XLSX und PPTX durchführen.
4. Dateien öffnen und Inhalt vergleichen.

Bestanden, wenn: jede Datei geöffnet werden kann, Inhalt plausibel ist und keine nicht freigegebenen Inhalte exportiert werden.

### E. Mobile und Desktop
Prüfen auf:
- Android Smartphone
- iPhone-Breite
- Desktop-Browser

Kontrollpunkte: Sprachmenü, deutscher „← Zurück“-Button, keine abgeschnittenen Karten, keine horizontale Sackgasse, Touchziele erreichbar, lange Texte lesbar.

### F. 10 Sprachen
Stichprobe je Sprache: Startseite, Sprachmenü, Fristenkarte, Ampel-Erklärung, nächster Schritt und Exportbezeichnung.

Sprachen: DE, EN, FR, TR, PL, RU, AR, FA, RO, BG.

Bestanden, wenn: Oberfläche verständlich bleibt, RTL-Sprachen nutzbar sind und deutsche Rechtstexte als verbindliche Fassung erkennbar bleiben.

### G. Integrationen
1. Google-Verbindung mit echtem Testkonto autorisieren.
2. Microsoft-Verbindung mit echtem Testkonto autorisieren.
3. Ablehnung/Abbruch der Freigabe prüfen.
4. Rückkehr zur App prüfen.
5. Verbindung erneut aufrufen/trennen.

Bestanden, wenn: kein Anbieterpasswort in AS Gold eingegeben wird, OAuth-State geschützt ist und nur ausdrücklich freigegebene Rechte verwendet werden.

## Fehlerklassen
- P0 🔴: Sicherheits-/Datenschutzproblem, Datenverlust, Zahlung unbeabsichtigt aktiv, Login/Export/Kernweg blockiert.
- P1 🔴: Kernfunktion falsch oder unverständlich, Frist/Ampel/Nächster Schritt irreführend.
- P2 🟡: Bedienproblem ohne Daten-/Sicherheitsrisiko.
- P3 🟢/🟡: rein optische Verbesserung.

## Freigabekriterium V38
V38 erhält Gesamtstatus 🟢, wenn:
- kein P0/P1 offen ist,
- Kernweg auf mindestens einem Android-Gerät, einer iPhone-Breite und einem Desktop praktisch bestanden ist,
- 10-Sprachen-Stichprobe bestanden ist,
- mindestens ein echter Testkonto-Endweg bestanden ist,
- PDF/DOCX/XLSX/PPTX praktisch geöffnet wurden,
- Google/Microsoft-OAuth entweder praktisch bestanden oder vor Marktstart bewusst als nicht freigegeben gekennzeichnet bleibt,
- Zahlungsfunktion weiterhin deaktiviert bleibt, bis eine gesonderte finale Freigabe erfolgt.

## Testprotokoll
Für jeden Test festhalten:
- Datum/Uhrzeit
- Tester
- Gerät/Browser
- Sprache
- Testschritt
- Ergebnis 🟢/🟡/🔴
- Screenshot/Fehlermeldung falls vorhanden
- GitHub-Issue/Commit bei Korrektur
- Nachtest-Ergebnis

## Aktuelle Gesamtampel
🟡 Nahe an praktischer Abnahme.
Automatische und synthetische Prüfungen sind weitgehend grün. Offen sind im Wesentlichen reale Endgeräte-, Testkonto-, Dateiexport- und Anbieter-OAuth-Prüfungen.
