# ASH · Test einer komplexen Fallakte

Stand: 18. September 2026. Ergebnis: lokale Korrekturen geprüft, noch nicht veröffentlicht. Kein vollständiger produktiver End-to-End-Nachweis.

## Testgrundlage

Acht vollständig erfundene Dokumente in zwei getrennten Vorgängen: Betriebsunterbrechung/Versicherung und Wiederherstellung/Vermieter. Namen, Kennungen, Daten und Beträge aus Kundenunterlagen wurden nicht übernommen. Die fachlichen Prüffragen einer komplexen Fallakte wurden als Vergleichsmaßstab nachgebildet.

Die Daten und zehn fachlichen Abnahmekriterien stehen in `app/modules/testing/complexCaseFixture.mjs`. Die Kriterien sind eine Prüfliste für einen späteren echten KI-Durchlauf, keine vorgegebenen KI-Ergebnisse.

## Nachgewiesene Fehler und Korrekturen

| Prüfung | Vorher | Lokal korrigiert |
| --- | --- | --- |
| „Die Übergabe ist nicht bestätigt.“ | Grün | Gelb |
| „Die Forderung wurde nicht vollständig gezahlt.“ | Grün | Gelb |
| Bestätigter Reparaturumfang, noch nicht beauftragt | Grün | Gelb |
| Dokument ohne Originaldatum | Upload erschien wie Dokument-/Ereignisdatum | Ausdrücklich „Hochgeladen“, Originaldatum unbekannt |
| Dokument ohne jedes Datum | Aus Timeline entfernt | Bleibt als undatiert sichtbar |

Die Datumsherkunft wird auch in der Quellenliste und in den Daten der professionellen Übergabe gekennzeichnet. Die neuen Datumsbeschriftungen liegen für alle elf App-Sprachen vor. Die automatische Schlüsselwort-Ampel bleibt eine konservative deutschsprachige Hilfestellung, keine umfassende semantische oder rechtliche Bewertung.

## Ausgeführte Prüfungen

- `npm run test:complex-case`: bestanden; einschließlich tatsächlicher React-Ausgabe der Ampel und Timeline, ungültiger Datumswerte, relativer/historischer Fristen, Fall- und Eigentümertrennung sowie Belegzuordnung.
- `npm run build`: gesamte konfigurierte Vorprüfung und Build-Prüfkette bestanden, Next.js-Produktionsbuild erfolgreich.
- Bestehende Datenbanktests für Belegführung und Kundenfahrplan bestanden in der lokalen Testdatenbank. Das beweist keinen produktiven Datenbankzugriff.
- Ein älterer Test erwartete die Datumslogik direkt im UI-Quelltext. Nach Auslagerung wurde er auf die echte Funktion umgestellt; die ursprüngliche Anforderung, keinen rohen Upload-Zeitstempel als Dokumentbeschreibung zu verwenden, bleibt geprüft.
- Der neue Vergleichstest ist Bestandteil der Build-Vorprüfung.

## KI-Regeln ergänzt, Wirkung noch offen

Dokumentanalyse und Kundenfahrplan verwenden nun gemeinsame Belegregeln: Forderung, Anerkenntnis, Überweisung, Verrechnung und Fremdkosten unterscheiden; Teilfälle nicht vermischen; Angebot nicht mit Fertigstellung verwechseln; fehlende Seiten und ausgeschlossene Arbeiten offenlegen; Zugangs- und Originaldatum nicht erfinden; Schadensminderung nicht ohne Beleg als Wiedereröffnung auslegen. Die Regeln verlangen Quellen, Annahmen und konkrete offene Fragen.

Diese Ergänzung ist eine Vorgabe an das Modell, kein Nachweis korrekter Modellantworten. Zitatübereinstimmung allein beweist ebenfalls nicht, dass eine Schlussfolgerung inhaltlich zutrifft.

## Grenzen und nächster Abnahmeschritt

- Die produktive Startseite war öffentlich erreichbar; im geöffneten Browser war kein angemeldeter Testarbeitsbereich verfügbar. Keine Anmeldung, Freischaltung oder Schutzsperre wurde umgangen.
- Für einen lokalen Modellaufruf war kein KI-Schlüssel konfiguriert. Der produktive Konfigurationsstand wurde daraus nicht abgeleitet.
- Der Cloud-Browser sperrte die lokale Adresse mit `ERR_BLOCKED_BY_CLIENT`. Daher kein visueller oder interaktiver Browsernachweis für die Änderungen; React-Renderprüfung und Produktionsbuild sind bestanden.
- Kein Upload, OCR-/KI-Aufruf, Speichern einer produktiven Testakte, E-Mail-Abruf, automatisches Zuordnen neuer Antworten oder Benachrichtigen wurde in dieser Runde produktiv nachgewiesen.
- Keine Änderungen veröffentlicht, keine externen Nachrichten versandt, keine echten Kundendaten übertragen. Datenschutz-, Zugangs-, Versand- und Veröffentlichungsfreigaben bleiben unverändert.

Für die vollständige Abnahme ist eine angemeldete Sitzung des bereits bestätigten persönlichen Eigentümerkontos erforderlich: die acht synthetischen Texte über den regulären Dokumentweg erfassen, Originaltexte kontrollieren und speichern, je Teilfall einen Kundenfahrplan erzeugen und gegen alle zehn Abnahmekriterien vergleichen. Anschließend eine neue Unterlage hinzufügen und prüfen, dass die vorherige Bewertung als veraltet markiert wird. Unzulässige grüne Erledigungen, erfundene Zahlungen, Fristen oder Quellen sind Ablehnungsgründe. Ein späterer E-Mail-Integrationstest ist ein eigener, ausdrücklich freizugebender Schritt.

## Erweiterung auf weitere Gesprächsquellen

Auf den Folgeauftrag wurden 52 Themenbereiche mit 104 weiteren synthetischen Texten ergänzt. Grundlage sind der sichtbare Kontext, ergänzende Verlaufsrecherche und die frühere Fallübersicht mit 33 Positionen; ein vollständiger Chat-Export liegt nicht vor. Die unspezifische Sammelposition dieser Übersicht bleibt offen. Vorgehen, Testaufruf und weiterhin offene fachliche Abnahme stehen in `docs/history-case-tests.md`.

Zusätzlich korrigiert: Angaben wie „angeblich genehmigt“, „sei bewilligt“, „wird später bestätigt“, reine Eingangsbestätigungen und Teilzahlungen können die lokale Dokument-Ampel nicht mehr allein auf Grün setzen. Fallführung und Belegübersicht filtern bei vorhandener Eigentümerkennung sowohl Dokumente als auch Bewertungen nach dieser Kennung. Das sind lokal reproduzierte und geprüfte Korrekturen; ein produktiver Datenabfluss wurde nicht festgestellt oder behauptet.

## Ergänzende Build-Nachprüfung

Am lokalen Commit `70bd27a` bestanden die vollständige konfigurierte Prüfkette und der Standardbuild mit Turbopack. Ein zusätzlicher sauberer Neubau ohne alte Build-Dateien erzeugte ebenfalls alle 29 Seiten und die abschließende Routenübersicht. Vier Seiten wurden aus dem frischen lokalen Produktionsbuild mit HTTP 200 ausgeliefert. Build-Konfiguration und Anwendungscode blieben unverändert.

Der Zugang zur produktiven App wurde im Browser erneut geprüft; sie zeigte die Anmeldung. Die sichere Anmeldung wurde nicht abgeschlossen. Daher bleibt der angemeldete KI-/Live-Test offen. Ein Test des bisherigen Live-Stands ersetzt zudem keine Abnahme der noch unveröffentlichten Änderungen. Keine Kundendaten übertragen, keine Testakte produktiv angelegt und nichts veröffentlicht.

## Eigentümerkonto und veröffentlichte Funktionen

Die lesende Projektprüfung vom 19. September 2026 bestätigt Sebastian Auls als aktiven, freigegebenen Eigentümer. Seine wirksamen Rechte enthalten dauerhaften Eigentümerzugang und vollständige Fallanalyse. Die KI-Verarbeitung sowie die aktuellen Datenschutz- und Bedingungsversionen sind im Konto bereits freigegeben. Die Rechtefrage ist damit geklärt; ein weiteres Testkonto oder eine Rechteänderung ist nicht erforderlich.

Die veröffentlichten Funktionen `gold-document-analysis` v11 und `gold-case-roadmap` v2 sind aktiv, enthalten aber die neue lokale Erweiterung `CASE_EVIDENCE_RULES` noch nicht. Ihr aktiver Status belegt keinen erfolgreichen Modellaufruf. Beide verlangen eine gültige Benutzersitzung; die vorhandene Projektverbindung stellt diese nicht her. Offen bleibt die angemeldete Sitzung im Arbeitsbrowser für den tatsächlichen KI-Test.

## Fortsetzung am 19. September 2026 – exakter Fristabgleich

Bei der weiteren Prüfung wurde ein konkreter Fehler reproduziert: Für das Original „Bitte antworten Sie bis 11.04.2030.“ akzeptierte der Fahrplan die falsche Frist „2030-04-01“. Ursache war ein Teilzeichenfolgen-Abgleich, bei dem „1.04.2030“ innerhalb von „11.04.2030“ gefunden wurde.

Die lokale Korrektur in `supabase/functions/_shared/customerRoadmap.mjs` verlangt jetzt eine vollständige Datumszeichenfolge im Original, die vollständig innerhalb der zitierten Passage liegt. Auch ein auf „1.04.2030“ verkürztes Zitat aus „21.04.2030“ wird zurückgewiesen. Ein passendes Datum an einer anderen, nicht zitierten Stelle genügt nicht.

Verifiziert wurden 15 zusätzliche Datumsfälle: acht unzulässige Verkürzungen oder falsche Zuordnungen werden abgewiesen; sieben gültige Fälle einschließlich der bisherigen Punkt- und ISO-Schreibweisen, eines Datumsbereichs und normalisierter Zeilenumbrüche bleiben erlaubt. Der bestehende Fahrplantest einschließlich Word-Ausgabe, der Vergleich über 52 Themen/104 synthetische Unterlagen und der komplexe Belegtest bestanden. Anschließend bestand `npm run build` vollständig mit Exit 0 und abgeschlossener Routenübersicht.

Die Prüfung belegt die technische Übereinstimmung des zitierten Datums, keine rechtliche Fristberechnung und keine tatsächliche Modellantwort.

Der vorhandene Entwicklungsstand wurde wieder aufgenommen. Im Arbeitsbrowser war weiterhin die ASH-Anmeldeseite sichtbar. Die sichere Anmeldeanfrage wurde nicht abgeschlossen; es entstand keine bestätigte Eigentümersitzung. Deshalb bleiben der persönliche Live-/KI-Durchlauf und die fachliche Abnahme offen. Eine erneute Rechtevergabe ist nicht erforderlich.

Diese Korrektur ist noch nicht veröffentlicht. Vercel meldete bei der Nachprüfung den Produktionsstand `5515c5f` als `READY`; die neue Fristkorrektur ist darin nicht enthalten. Es wurden keine echten Kundendaten importiert, keine Nachrichten versandt und keine Zugangskontrollen verändert.
