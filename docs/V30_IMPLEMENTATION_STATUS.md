# AS Gold V30 – Französisch, Farsi und bereinigte Sprachwahl

Stand: 30. August 2026

## Ergebnis

V30 ersetzt Ukrainisch in der aktiven Sprachwahl durch zwei vollständig integrierte
Sprachen: Französisch und Farsi. AS Gold unterstützt damit acht aktive UI- und
Ausgabesprachen: Deutsch, Englisch, Französisch, Türkisch, Polnisch, Russisch,
Arabisch und Farsi.

Die Sprachänderung greift nicht in Tariflogik, Datenbank, Authentifizierung,
Datenschutzgrenzen oder Zahlungsstatus ein. V30 führt sie auf dem parallel
entstandenen V29-Sicherheitsstand zusammen. Dadurch bleiben Next.js 16, sichere
lokale Office-Exporte, Sicherheitsheader und das servervalidierte Audit erhalten.
V30 bleibt ein kostenloser kontrollierter Testbetrieb; echte personenbezogene
Kundendaten und Zahlungsvorgänge sind nicht freigegeben.

## Sprachumfang

- Ukrainisch ist aus der aktiven Sprachliste, den Auswahlfeldern und allen
  Laufzeitkatalogen entfernt.
- Französisch und Farsi umfassen die öffentliche Produktseite, Registrierung und
  Anmeldung, Arbeitsbereich, Fälle, Kunden, Dokumente, Freigaben, Datenschutz,
  Tarife, Empfehlungen, Systemmeldungen und Exportbezeichnungen.
- App-Sprache und Ausgabesprache bleiben getrennte Einstellungen; beide bieten
  exakt dieselben acht Sprachen an.
- Die deutsche Rechtsgrundlage bleibt unabhängig von der gewählten Sprache
  sichtbar und unverändert.

## Schreibrichtung und Gebietsschemata

- Farsi setzt `lang=fa`, `dir=rtl` und nutzt `fa-IR` für lokalisierte Datumswerte.
- Arabisch bleibt ebenfalls RTL.
- Deutsch, Englisch, Französisch, Türkisch, Polnisch und Russisch bleiben LTR.
- Die Laufzeit setzt Schreibrichtung und Dokumentensprache bei jedem Sprachwechsel
  neu, sodass kein RTL-Zustand in einer folgenden LTR-Sprache erhalten bleibt.

## Technische Struktur

- `app/lib/v30Languages.mjs` bündelt aktive Sprachen, Schreibrichtung,
  Gebietsschemata, Ausgabesprachennamen und die vollständigen Seitenkataloge für
  Französisch und Farsi.
- `app/lib/v30ComponentTranslations.mjs` ergänzt die komponentenspezifischen Texte
  für Arbeitsbereich, Freigaben, Dokumentanalyse, Datenschutz, KI-Kontrolle,
  Passwortregeln und Footer.
- Bestehende Fachkomponenten übernehmen die neuen Kataloge additiv; fachliche
  V24- bis V29-Logik wurde nicht dupliziert oder verändert.
- `scripts/test_v30_languages.mjs` prüft aktive Sprachcodes, RTL-Regeln,
  Katalogstruktur, Platzhalter und ukrainische Laufzeitreste.
- Der Drei-Wege-Merge basiert auf dem gemeinsamen bestätigten V28-Stand. Er erhält
  die V29-Sicherheitsänderungen an Abhängigkeiten, Exporten, Headern, Audit und
  lokaler Gerätehistorie und ergänzt darauf die V29-Testerführung und V30-Sprachen.

## Verifikation

- `npm run test:v29-password`: sechs Positiv-/Negativfälle erfolgreich.
- `npm run test:v30-languages`: acht aktive Sprachen; Französisch vollständig;
  Farsi vollständig und RTL; Ukrainisch entfernt.
- `npm run build`: erfolgreicher Produktions-Build mit Next.js 16.3.3 und
  Turbopack; 13 statische Routen erzeugt, einschließlich `/testen`.
- `npm audit --audit-level=high`: 0 bekannte Schwachstellen.
- Gerenderter Desktop-Browserlauf mit Chromium: Sprachwahlschalter enthält exakt
  `de`, `en`, `fr`, `tr`, `pl`, `ru`, `ar`, `fa`.
- Französisch zeigt den lokalisierten öffentlichen Inhalt mit `lang=fr` und LTR.
- Farsi zeigt den lokalisierten öffentlichen Inhalt mit `lang=fa` und RTL.
- Ukrainisch ist im gerenderten Sprachwahlschalter nicht vorhanden.
- Keine JavaScript-, Seiten- oder Konsolenfehler im Browserlauf.
- Produktionsnaher Header-Test bestätigt CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, strikte Referrer-/Permissions-Regeln, COOP
  und HSTS.
- Vercel-Preview `dpl_7sHLvBv3xEZpMcBifdU64f2CXygS`: `READY`, Next.js
  16.3.3, 13 von 13 statischen Routen und `/testen` erfolgreich erzeugt.
- Vercel-Produktion `dpl_8Ax4jwzJ5vQS2etKCJAQqcubG6HK`: `READY` unter
  `https://app-gold-workspace.vercel.app`.
- Live-Prüfung: `/` und `/testen` liefern HTTP 200; V30-Testhinweis,
  deaktivierte Bezahlfunktion, alle acht Sprachcodes, Französisch, Farsi/RTL und
  die erwarteten Sicherheitsheader sind enthalten; Ukrainisch ist nicht enthalten.
- Im Kontrollzeitraum nach dem Rollout wurden keine Vercel-Laufzeitfehler erkannt.

## Unveränderte Freigabegrenzen

1. Nur synthetische oder wirksam anonymisierte Testdaten verwenden.
2. Keine echten Kundendaten oder besonderen Kategorien personenbezogener Daten.
3. Zahlung, Abonnement und automatische Verlängerung bleiben deaktiviert.
4. Authentifizierter End-to-End-Test nach echter E-Mail-Bestätigung bleibt ein
   eigener Freigabeschritt.
5. Physischer Test auf mindestens einem realen Android- und iOS-Gerät bleibt offen.
6. Rechtstexte und organisatorische Datenschutzmaßnahmen müssen vor Echtdaten- oder
   Bezahlbetrieb fachlich abschließend geprüft werden.
