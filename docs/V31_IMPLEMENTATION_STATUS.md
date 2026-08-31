# AS Gold V31 – Implementierungsstatus

Stand: 31. August 2026

## Ergebnis

- Die Sprachwahl zeigt Landesflaggen statt Sprachkürzeln; Englisch, Arabisch und Farsi zeigen mehrere passende Flaggen.
- App-Sprache und Ausgabesprache bleiben getrennt wählbar.
- Impressum, Datenschutz, Nutzungsbedingungen, Cookies, KI-Transparenz, Kontakt, Rechtliches, Testhinweise, Widerruf und Datenschutz-Steuerung wechseln automatisch mit der App-Sprache.
- Die deutsche Fassung bleibt auf jeder übersetzten Rechtsseite ausdrücklich als verbindlich gekennzeichnet.
- Ein Promo-Code kann im geschützten Tarifbereich eingegeben, serverseitig geprüft und entfernt werden.

## Promo-Sicherheit

- Rohcodes werden weder in der Datenbank noch in Upgrade-Anfragen gespeichert; gespeichert wird ausschließlich ein SHA-256-Digest des normalisierten Codes.
- Gültigkeit, Zeitraum, Tarif, Laufzeit, Gesamt- und Nutzerlimit werden ausschließlich serverseitig geprüft.
- Ungültige oder abgelaufene Codes verändern keinen Preis und können kein Upgrade vormerken.
- Die Preisvorschau und Upgrade-Anfrage protokollieren die rabattierten Beträge nachvollziehbar.
- Die Bezahlfunktion bleibt deaktiviert (`payment_enabled=false`).
- Es wurde absichtlich kein kommerzieller Code angelegt. Code, Rabattsatz, Zeitraum, Tarifumfang und Einlöselimits müssen vor einer Aktion festgelegt werden.

## Produktivdatenbank

Die Migrationen `v31_secure_promo_codes` und `v31_index_promo_foreign_key` sind in der produktiven Supabase-Instanz angewendet. Gültige und ungültige Codes sowie Preisneutralität bei ungültigen Codes wurden transaktional geprüft; temporäre Testdaten wurden wieder entfernt.

## Freigabeprüfung

Die bestehenden V29-/V30-Tests, der V31-Vertragstest, der Next.js-Produktionsbuild, `npm audit --audit-level=high` und `git diff --check` wurden erfolgreich ausgeführt. Das Abhängigkeits-Audit meldet keine Schwachstellen.
