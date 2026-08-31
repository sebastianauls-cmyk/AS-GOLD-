# AS Gold V33 – Implementierungsstatus

Stand: 31. August 2026

## Ergebnis

- Die Sprachoptionen werden in einer einzigen, senkrechten Liste von oben nach unten angezeigt.
- Jeder Sprachbutton zeigt weiterhin die echten SVG-Landesflaggen und zusätzlich den vollständigen Namen der Sprache.
- Auch der geschlossene Sprachbutton zeigt neben der Flagge den Namen der aktuell gewählten Sprache.
- Auf Mobilgeräten öffnet sich die Sprachauswahl vollständig sichtbar mit eigener Scrollfläche.
- App-Sprache und Ausgabesprache stehen in der geschützten mobilen Kopfzeile untereinander.
- Die Sprachauswahl besitzt einen großen, lokalisierten „Zurück“-Button und lässt sich weiterhin mit Escape oder durch Tippen außerhalb schließen.
- Bestehende Zurück-Aktionen in App, Anmeldung und Rechtsseiten sind kontrastreich als echte Schaltflächen erkennbar.
- Der Zurück-Button der Rechtsseiten bleibt jetzt auch auf Mobilgeräten sichtbar.

## Unveränderte Schutzvorgaben

- Die acht aktiven Sprachen und elf SVG-Landesflaggen bleiben unverändert.
- App-Sprache und Ausgabesprache bleiben getrennt wählbar.
- Arabisch und Farsi behalten die Rechts-nach-links-Darstellung.
- Die deutsche Rechtsfassung bleibt verbindlich.
- Die Bezahlfunktion bleibt deaktiviert.

## Freigabeprüfung

Die V29-, V30-, V31-, V32- und V33-Vertragstests, der Next.js-Produktionsbuild und das Abhängigkeits-Audit wurden erfolgreich ausgeführt. Das Audit meldet keine Schwachstellen.
