# Gemeinsame Ausgabevorgabe für die Fallprüfung

Die vollständige Fallprüfung verwendete für jeden Abschnitt einen anderen `location.enum` im Ausgabeschema. Laut Anbieter-Dokumentation gehört das Ausgabeschema zu den Anweisungen vor dem eigentlichen Quellentext. Dadurch konnten identische Originale trotz gesetzter Cache-Grenzen nicht durchgehend denselben Anfrageanfang bilden.

Die Fallprüfung nutzt nun einen festen, begrenzten Katalog aller möglichen Pfade innerhalb der bestehenden Größenlimits. Die tatsächlich zugewiesenen Prüffelder werden weiterhin für jeden Abschnitt separat ermittelt und nach der Cache-Grenze als Serveranweisung übergeben. Nach der Antwort prüft derselbe bisherige Validator die genaue Zuordnung. Ein anderer Pfad aus dem allgemeinen Katalog bleibt unzulässig. Fehlermeldungen werden weder ausgefiltert noch in Freigaben umgewandelt.

Alle Originale, die jeweils ausgewählten vollständigen Quellentexte, Prüfabschnitte, Gegenprüfungen, das Modell, die Denktiefe und Ausgabegrenzen bleiben erhalten. Eine Änderung des konkreten Prüfauftrags verändert weiterhin den Hash der Gesamtanfrage und kann keine frühere Freigabe übernehmen. Andere Aufrufer behalten ohne den neuen optionalen Katalog ihr bisheriges Verhalten.

Nachweise ohne externe Modellanfragen:

- `node --import ./scripts/offline/noNetwork.mjs scripts/test_case_review_cache.mjs`: identische Ausgabevorgabe und Originale bei wechselnden zugewiesenen Feldern; Ablehnung fremder oder unbekannter Pfade; keine Übernahme einer Freigabe für einen geänderten Auftrag; ungültige Konfiguration stoppt vor dem Anbieteraufruf.
- `node --import ./scripts/offline/noNetwork.mjs scripts/test_complete_case.mjs`: tatsächlicher Gesamtprozess einschließlich Grundlagen-, Rechen-, Maßnahmen- und Briefprüfung; alle verwenden dieselbe Ausgabevorgabe. Bestehende Herkunfts-, Rechen-, Korrektur-, Freigabe- und Exportprüfungen bestanden.

Damit ist die strukturelle Ursache für wechselnde Anfrageanfänge beseitigt. Tatsächliche Cache-Treffer und Kosteneinsparungen beim Anbieter sind erst mit einem später separat freigegebenen echten Lauf messbar. Es wird keine feste Ersparnis und kein erfolgreicher Live-Gesamtfall behauptet. Diese Änderung enthält keine neue Dollar-Kostengrenze und verändert keine Verbrauchsgrenze.

Offizielle Grundlage, geprüft am 19.10.2026:
https://developers.openai.com/api/docs/guides/prompt-caching
