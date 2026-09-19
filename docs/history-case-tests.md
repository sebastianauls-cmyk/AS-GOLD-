# Tests aus verfügbaren Gesprächsquellen

`npm run test:history-corpus` führt den lokalen Vergleich für 52 Themenbereiche mit 104 vollständig erfundenen Dokumenten aus. Der Aufruf ist Teil von `prebuild`. Die acht bereits vorhandenen komplexen Dokumenttests bleiben separat erhalten.

Die Daten liegen in `app/modules/testing/historyCaseCorpus.mjs`. `reviewCriteria` enthält fachliche Anforderungen für die spätere KI-Abnahme, keine bereits erreichten Modellergebnisse. Der Corpus wird nicht als Produktivinhalt in den Workspace importiert.

## Reichweite

- Grundlagen: sichtbarer Gesprächskontext, gezielte Verlaufsrecherche und eine frühere Übersicht mit 33 Positionen.
- Alle konkret benannten Positionen dieser Übersicht sind zugeordnet. Die unspezifische Sammelposition 14 bleibt offen. Neuere Themen ergänzen den Bestand.
- Kein vollständiger Chat-Export, keine Volltextprüfung sämtlicher früherer Chats und kein Import von Originalkundendaten.
- Die Herkunftsangabe `register` bedeutet eine frühere Fallübersicht; `context` bedeutet den bereitgestellten Kontext einschließlich Zusammenfassungen; `retrieval` bedeutet ergänzende Verlaufsrecherche. Keine dieser Kennungen behauptet einen vollständigen Originalchat.

## Was tatsächlich läuft

Die Tests rufen die produktiven Funktionen für Fall-/Eigentümerzuordnung, Belegprüfung, Erneuerung nach geänderten oder hinzugefügten Dokumenten, Ampel, Datumsherkunft, Fristerkennung und Fahrplanvalidierung auf. Fremde Fallbelege, erfundene Zitate, verfrühte grüne Schritte und unzulässige Schrittfolgen werden geprüft. Die lokale Ampel bleibt eine konservative deutschsprachige Schlüsselworthilfe.

Ein optionaler absoluter Ausgabepfad in `ASH_HISTORY_TEST_REPORT` schreibt die aktuellen lokalen Ergebnisse als JSON. Ohne diese Variable schreibt der Test keine Datei. Die JSON-Ausgabe markiert `model` und `live` weiterhin als `pending`.

## Build-Verifikation dieser Erweiterung

Die gesamte konfigurierte Regressionskette aus `npm run build` bestand. In der ersten Runde endete ein Standardbuild unvollständig; der alternative Webpack-Build war vollständig nachgewiesen. Die anschließende Nachprüfung am Commit `70bd27a` schließt die aktuelle Build-Lücke: `npm run build` und ein zweiter sauberer `next build` ohne vorhandenes `.next`-Verzeichnis bestanden beide mit Turbopack, Exit 0, 29/29 Seiten, abgeschlossener Optimierung und vollständiger Routenübersicht. Es wurde keine Build-Konfiguration geändert.

Der frische Build `XODcEeivE24z_aTdmdUBZ` enthält keinen unvollständigen Exportmarker. Ein daraus gestarteter lokaler Produktionsserver liefert `/`, `/impressum`, `/datenschutz` und `/widerruf` mit HTTP 200, passenden Titeln und Content-Security-Policy aus. `buildStage: static-generation` bleibt in der installierten Next.js-Version auch bei erfolgreichem Abschluss bestehen; dieses Feld allein ist kein Fehlschlagsbeleg. Die damalige Ursache des unvollständigen Laufs bleibt ungesichert.

Der öffentliche Live-Browser zeigt den Anmeldebildschirm. Die sichere Anmeldung wurde nicht fortgesetzt; daher weiterhin kein angemeldeter Dokument-/KI-Lauf und keine produktiv gespeicherten Testfälle. Die neuen lokalen Änderungen sind unveröffentlicht. Ein späterer Test der bisherigen Live-Version muss getrennt von der Abnahme des neuen Entwicklungsstands ausgewiesen werden.

## Prüfung des vorhandenen Kontos und der veröffentlichten Funktionen

Am 19. September 2026 bestätigten ausschließlich lesende Abfragen über den verbundenen Supabase-Projektzugang: Sebastian Auls ist aktiver, freigegebener Eigentümer (`owner`, `active=true`, `approved`). `private.gold_effective_permissions` bestätigt `owner_permanent_access=true`, `full_analysis=true` und `business_mode=true`. Die gespeicherten Basiswerte des kostenlosen Tarifs sind wegen der Eigentümerergänzung kein Beleg für fehlende Analyserechte. KI-Verarbeitung sowie die aktuellen Datenschutz- und Bedingungsversionen sind im vorhandenen Konto bereits freigegeben. Es wurden keine Rechte oder Freigaben geändert.

Die tatsächlich veröffentlichten Funktionen `gold-document-analysis` v11 und `gold-case-roadmap` v2 sind aktiv. Ihre abgerufenen Dateien enthalten die neue lokale Erweiterung `CASE_EVIDENCE_RULES` noch nicht. Beide prüfen selbst eine gültige Benutzersitzung. Die Projektverbindung stellt keine solche Websitzung her; ein angemeldeter KI-Lauf bleibt deshalb offen. Der aktive Funktionsstatus ist kein Nachweis erfolgreicher Modellantworten oder eines verfügbaren Anbieterschlüssels.

## Noch erforderliche Abnahme

Jeden Themenbereich im bereits bestätigten persönlichen Eigentümerkonto separat anlegen, sobald dessen angemeldete Sitzung im Arbeitsbrowser verfügbar ist. Ausschließlich die synthetischen Texte über den regulären Dokumentweg erfassen und tatsächliche KI-Antworten gegen sämtliche `reviewCriteria` prüfen. Ein neues Konto oder eine erneute Rechtevergabe ist nicht erforderlich. Zeitabhängige Fristentests brauchen die ausdrücklich eingefrorene Testzeit; fiktive Datumswerte dürfen nicht als echte Kundentermine verwendet werden. Neue Antworten müssen eine erneute Belegprüfung auslösen. Fachliche Qualität, vollständige Übersetzungen, aktuelle Recherchen, Exporte, E-Mail-Zuordnung, Benachrichtigungen und Smartphone-Verhalten sind durch diese lokalen Funktionstests nicht nachgewiesen.

Versand, Veröffentlichung, Käufe und echte Kundendaten sind nicht Bestandteil dieses Testlaufs. Die Abnahme darf keine vorhandenen Zugangskontrollen oder Freigaben umgehen.

## Fortsetzung am 19. September 2026 – exakter Fristabgleich

Bei der weiteren Prüfung wurde ein konkreter Fehler reproduziert: Für das Original „Bitte antworten Sie bis 11.04.2030.“ akzeptierte der Fahrplan die falsche Frist „2030-04-01“. Ursache war ein Teilzeichenfolgen-Abgleich, bei dem „1.04.2030“ innerhalb von „11.04.2030“ gefunden wurde.

Die lokale Korrektur in `supabase/functions/_shared/customerRoadmap.mjs` verlangt jetzt eine vollständige Datumszeichenfolge im Original, die vollständig innerhalb der zitierten Passage liegt. Auch ein auf „1.04.2030“ verkürztes Zitat aus „21.04.2030“ wird zurückgewiesen. Ein passendes Datum an einer anderen, nicht zitierten Stelle genügt nicht.

Verifiziert wurden 15 zusätzliche Datumsfälle: acht unzulässige Verkürzungen oder falsche Zuordnungen werden abgewiesen; sieben gültige Fälle einschließlich der bisherigen Punkt- und ISO-Schreibweisen, eines Datumsbereichs und normalisierter Zeilenumbrüche bleiben erlaubt. Der bestehende Fahrplantest einschließlich Word-Ausgabe, der Vergleich über 52 Themen/104 synthetische Unterlagen und der komplexe Belegtest bestanden. Anschließend bestand `npm run build` vollständig mit Exit 0 und abgeschlossener Routenübersicht.

Die Prüfung belegt die technische Übereinstimmung des zitierten Datums, keine rechtliche Fristberechnung und keine tatsächliche Modellantwort.

Der vorhandene Entwicklungsstand wurde wieder aufgenommen. Im Arbeitsbrowser war weiterhin die ASH-Anmeldeseite sichtbar. Die sichere Anmeldeanfrage wurde nicht abgeschlossen; es entstand keine bestätigte Eigentümersitzung. Deshalb bleiben der persönliche Live-/KI-Durchlauf und die fachliche Abnahme offen. Eine erneute Rechtevergabe ist nicht erforderlich.

Diese Korrektur ist noch nicht veröffentlicht. Vercel meldete bei der Nachprüfung den Produktionsstand `5515c5f` als `READY`; die neue Fristkorrektur ist darin nicht enthalten. Es wurden keine echten Kundendaten importiert, keine Nachrichten versandt und keine Zugangskontrollen verändert.
