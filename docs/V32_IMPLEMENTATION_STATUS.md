# AS Gold V32 – Implementierungsstatus

Stand: 31. August 2026

## Ergebnis

- Die obere Auswahl für App-Sprache und Ausgabesprache zeigt jetzt echte SVG-Landesflaggen statt systemabhängiger Emoji-Flaggen.
- Die Flaggen bleiben dadurch auch auf Android-, Windows- und anderen Geräten sichtbar, die Unicode-Länderflaggen nicht zuverlässig darstellen.
- „Sprache“ und „Ausgabesprache“ sind in der oberen App-Leiste eindeutig beschriftet.
- Die acht aktiven Sprachen bleiben unverändert: Deutsch, Englisch, Französisch, Türkisch, Polnisch, Russisch, Arabisch und Farsi.
- Englisch, Arabisch und Farsi behalten jeweils zwei passende Landesflaggen.

## Flaggen-Zuordnung

- Deutsch: Deutschland
- Englisch: Vereinigtes Königreich und USA
- Französisch: Frankreich
- Türkisch: Türkei
- Polnisch: Polen
- Russisch: Russland
- Arabisch: Saudi-Arabien und Vereinigte Arabische Emirate
- Farsi: Iran und Afghanistan

## Unveränderte Schutzvorgaben

- App-Sprache und Ausgabesprache bleiben getrennt wählbar.
- Arabisch und Farsi behalten die Rechts-nach-links-Darstellung.
- Die deutsche Rechtsfassung bleibt verbindlich.
- Die Bezahlfunktion bleibt deaktiviert.

## Freigabeprüfung

Die V29-, V30-, V31- und V32-Vertragstests sowie der Next.js-Produktionsbuild wurden erfolgreich ausgeführt. Der V32-Test rendert alle elf verwendeten SVG-Landesflaggen serverseitig und prüft ihre vollständige Zuordnung zu den acht Sprachen.
