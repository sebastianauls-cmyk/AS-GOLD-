# V46 – Mobile Sprachabnahme

Aus dem realen Android-Screenshot erkannte Abnahmefehler:

- Oben war nur die Oberflächensprache sichtbar; die Ausgabesprache wurde wegen einer veralteten DOM-Annahme (`select`) nicht erkannt.
- Die feste Sicherheitsleiste mit Zurück/Deutsch/Erklärvideo überlagerte das geöffnete Sprachmenü.

Korrektur:

- Ausgabesprache wird als aktueller Flaggen-/Listbox-Schalter erkannt.
- Oben werden 1. Sprache und 2. Ausgabesprache getrennt angeordnet.
- Solange ein Sprachmenü geöffnet ist, wird die feste Sicherheitsleiste ausgeblendet und danach wieder eingeblendet.
- V46-Regressionsschutz läuft vor jedem Build.
