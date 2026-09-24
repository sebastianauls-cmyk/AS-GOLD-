# Prüfung gegen beworbene Leistungen – 24. September 2026

Maßstab sind die auf `/entdecken` veröffentlichten Leistungen und die Tarifbeschreibungen, nicht allein der Sarah-Fall. Die Werbeaussagen werden nicht abgeschwächt, um eine fehlende Funktion als erledigt zu behandeln.

## Behobene Fehler

| Leistung | Reproduzierter Fehler | Korrektur und Nachweis |
| --- | --- | --- |
| Vollständige Fallauswertung exportieren | Der allgemeine Fallexport enthielt nur Stammdaten und manuelle Bewertungen. Die gespeicherte vollständige Analyse, Berechnungen und der Kundenfahrplan fehlten. | Der Export lädt den letzten gespeicherten Bericht und die aktuellen Fallgrundlagen. Alle sechs Formate enthalten auch die vollständige Auswertung, Belege, Einschränkungen und den bestätigten Bearbeitungsstand. Geänderte Grundlagen sperren den veralteten Bericht. Anschreiben bleiben im Fahrplan separat exportierbar. |
| Excel mit vollständigen Inhalten | Ein langer Vertrag verlor ab dem Zelllimit von 32.767 Zeichen seinen Schluss. | Fortsetzungszeilen erhalten den gesamten Originaltext, einschließlich Unicode-Zeichen an der Grenze. Der Test rekonstruiert den Inhalt aus der tatsächlichen XLSX-Datei. |
| PowerPoint mit lesbaren, vollständigen Inhalten | Werte wurden nach 12.000 Zeichen abgeschnitten. Vier Felder pro Folie pressten lange Texte in kleine Textfelder. | Inhalte werden in begrenzte Textabschnitte auf mehrere Folien verteilt. Tests vergleichen sämtliche Abschnitte in ihrer Reihenfolge. Ein erzeugtes PPTX wurde zusätzlich mit LibreOffice als PDF geöffnet und visuell geprüft. |
| Eigene Daten exportieren | Gespeicherte Kundenfahrpläne und Ländervergleiche fehlten; der Export verwendete nur die bereits geladenen Listen. | Kontodaten werden frisch und mit Pagination geladen, einschließlich aller Fassungen der beiden Ergebnisarten. Negativkontrollen prüfen fremde Konten und Lesefehler; 1.007 Fassungen prüfen die Seitengrenzen. |
| Fälle, Mandanten, Bewertungen und Freigaben zuverlässig speichern | Nach erfolgreicher Datenbankänderung wartete die Oberfläche noch auf die Protokollierung. Bei deren Ausfall blieb der sichtbare Stand alt. | Neun Speicherabläufe aktualisieren den bestätigten Stand unmittelbar. Hängende/fehlgeschlagene Protokollaufrufe und ausgefallener lokaler Gerätespeicher können das Ergebnis nicht verschlucken. |
| Downloads zuverlässig bestätigen | Eine fehlgeschlagene Protokollierung konnte einen bereits ausgelieferten Download als fehlgeschlagen darstellen. | Die Downloadbestätigung bleibt erhalten; Protokollfehler werden getrennt ergänzt und überschreiben keine spätere Meldung. |

## Was die neuen Tests tatsächlich belegen

`npm run test:product-deliverables` prüft drei voneinander unabhängige, synthetische **gespeicherte** Ergebnisse: Werkstattrechnung, Mietkaution und Versicherungsabrechnung. Jede Auswertung wird als PDF, Word, Excel, PowerPoint, CSV und Text erzeugt und auf Vollständigkeit geprüft. Die Fälle sind von Hand verfasste Auslieferungsfixtures; sie sind kein Beweis für die fachliche Qualität einer KI-Generierung. PDF-Text wird bei vorhandenem Poppler zusätzlich aus der erzeugten Datei gelesen.

Die Browserprüfung nutzt den tatsächlichen Exportablauf, erzeugt sechs Downloads und prüft die Sperre nach einer Quellenänderung. Die Datenbank- und Modellantworten der Browserfixture sind simuliert. Es entstehen keine Modellaufrufe oder Versandaktionen.

Die vorhandenen 52 Themen und 104 synthetischen Dokumente prüfen weiterhin technische Regeln wie Zuordnung, Belegbindung, Aktualität, Fristen und Abhängigkeiten. Ein gemeinsamer vorbereiteter Fahrplan für viele Themen erfüllt keine fachliche Abnahme dieser Themen.

## Noch erforderliche Produktabnahme

| Beworbener Nutzen | Erforderlicher Nachweis über technische Tests hinaus |
| --- | --- |
| Briefe, Verträge, Rechnungen und Behördenpost verstehen | Unterschiedliche Originale tatsächlich einlesen; Hauptaussagen, Beträge, fehlende Angaben und nächste Schritte mit den Originalen vergleichen. |
| Vollständige Analyse und Maßnahmenplan | Erfolgreiche echte Generierung für unterschiedliche Fallarten; jede wesentliche Nutzerfrage wird beantwortet oder mit konkreter fehlender Grundlage und zugehöriger Handlung offengehalten. |
| Fachlich belastbare Recherche | Quellen müssen den jeweiligen Sachverhalt, Zeitpunkt und Rechtsraum tragen. Allgemeine Treffer oder vorhandene Links allein genügen nicht. |
| Passende Anschreiben | Richtiger Absender und Empfänger, richtige Beträge und Bezugnahmen, keine erfundene Vollmacht oder fehlende beantragte Handlung; zweisprachige Fassungen bleiben inhaltlich gleich. |
| 11 Ausgabesprachen und 14 Länder | Sprachliche und fachliche Abnahme repräsentativer Kombinationen einschließlich RTL. Vorhandene Übersetzungsfelder und Länderumschalter allein beweisen das Ergebnis nicht. |
| Fortschritt nach neuen Antworten | Echte neue Antwort speichern, Bearbeitungsstand nachvollziehbar ändern und einen aktuellen Folgeplan erhalten, ohne unbelegt erledigte Schritte zu melden. |

Diese fachlichen Live-Nachweise bleiben offen. Die bestehende Kostenpause und die Verbrauchsgrenzen werden durch diese Reparatur nicht verändert. Ein erfolgreicher Build, ein veröffentlichter Stand oder simulierte Browsertests dürfen diesen offenen Abnahmestand nicht in „vollständig erfüllt“ verwandeln.
