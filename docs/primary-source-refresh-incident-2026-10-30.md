# Primärquellen-Refresh: Ausfall und Wiederanlauf, 30.10.2026

Untersuchter Stand: `main` = `f33501b06e725957460da8bbc72e5e670045eb67`.
Alle Uhrzeiten in dieser Datei sind UTC; Deutschland liegt an diesen Tagen eine Stunde voraus.

## Befund und Laufvergleich

| Lauf / Beginn | Runner | Tatsächlicher Abruf | Ergebnis |
| --- | --- | --- | --- |
| [39570022037](https://github.com/sebastianauls-cmyk/AS-GOLD-/actions/runs/39570022037), 21.10. 08:32 | Ubuntu 24.04, westcentralus | Drei Timeouts bei EStG § 19; IPv4 curl 28, IPv6 curl 6 | failure |
| [39925147989](https://github.com/sebastianauls-cmyk/AS-GOLD-/actions/runs/39925147989), 23.10. 08:30 | Ubuntu 24.04, centralus | Dasselbe Fehlerbild | failure |
| [40542545172](https://github.com/sebastianauls-cmyk/AS-GOLD-/actions/runs/40542545172), 27.10. 16:36 | Ubuntu 24.04, westus3 | Dasselbe Fehlerbild | failure |
| [40665644613](https://github.com/sebastianauls-cmyk/AS-GOLD-/actions/runs/40665644613), 28.10. 09:37 | Ubuntu 26.04, westus3 | 52/52 abgerufen und veröffentlicht | success |
| [40853488710](https://github.com/sebastianauls-cmyk/AS-GOLD-/actions/runs/40853488710), 29.10. 09:55 | Ubuntu 26.04, westus3 | 52/52 abgerufen; Commit `097f919` | success |
| [40921110482](https://github.com/sebastianauls-cmyk/AS-GOLD-/actions/runs/40921110482), 29.10. 17:25 | Ubuntu 26.04, westus | Tagesbestand bereits vollständig; kein Netzwerkabruf | success, zulässiger Skip |
| [41037264667](https://github.com/sebastianauls-cmyk/AS-GOLD-/actions/runs/41037264667), 30.10. 09:58 | Ubuntu 26.04, northcentralus | Drei Timeouts bei EStG § 19; IPv4 curl 28, IPv6 curl 6 | failure |
| [41094914195](https://github.com/sebastianauls-cmyk/AS-GOLD-/actions/runs/41094914195), 30.10. 17:00 | Ubuntu 26.04, eastus2 | Dasselbe Fehlerbild | failure |
| [41096561907](https://github.com/sebastianauls-cmyk/AS-GOLD-/actions/runs/41096561907), 30.10. 17:11 | Ubuntu 26.04, eastus | Erneut drei Timeouts; CLI endet mit 1; Commit-Schritt übersprungen | **success trotz fehlgeschlagenem Abruf** |

Im angefragten Lauf beginnen die Abrufe um 09:58:17. Wiederholungen folgen um 09:58:36 und 09:58:57; um 09:59:20 endet das Skript mit Exit 1. Es scheitert bereits die erste gemeinsame Host-Probe, bevor die übrigen 51 Vorschriften gestartet werden. Der Diagnoseabruf einer anderen Vorschrift (BGB § 631) scheitert ebenfalls. Der Commit-Schritt wurde nicht ausgeführt. Die neun vorhandenen Offline-Tests waren erfolgreich.

Der überspringende Lauf vom 29.10. unter demselben Commit belegt keine funktionierende Verbindung. Der echte Vollabruf desselben Tages lief aber auf demselben Runner-Image `ubuntu-26.04`, Version `20261025.179.1`, wie der Ausfall vom 30.10. Ein allgemeiner Image- oder Parserfehler ist damit nicht belegt. Frühere Wechsel auf macOS und zurück waren bereits am 08.10. erfolglos erprobt worden (Workflow-Historie); diese Versuche werden nicht wiederholt.

## Netzwerk und DNS

Belegt ist eine wiederkehrende Verbindungsstörung zwischen mehreren GitHub/Azure-Runnern und dem amtlichen Host. Die Protokolle enthalten keinen HTTP-Fehler oder Parserfehler. Timeout 28 allein trennt die Phasen DNS, TCP und TLS nicht sicher. Ohne damalige DNS-Antworten, Verbindungszeiten und Gegenprobe aus einem anderen Netz lässt sich die historische Ursache nicht eindeutig dem Quellserver, einem vorgeschalteten Filter, dem Routing oder dem Runner-Resolver zuordnen.

Eine unabhängige Gegenprobe am 30.10. gegen Google Public DNS über HTTPS lieferte `Status: 0` und die CNAME-Kette zu `www.gesetze-im-internet.edge.juris.de`, mit A-Adresse `195.74.94.216`. Die AAAA-Abfrage lieferte ebenfalls `Status: 0`, aber keinen IPv6-Adressdatensatz. Das ist kein allgemeines NXDOMAIN und erklärt, weshalb ein erzwungener IPv6-Abruf keinen Host auflösen kann. Diese spätere DNS-Beobachtung ersetzt keine historische DNS-Aufzeichnung des GitHub-Runners.

Über den HTTPS-Proxy dieser separaten Arbeitsumgebung war die amtliche URL per GET mit Status 200 erreichbar. Anschließend wurden mit dem **unveränderten** `scripts/refresh_primary_sources.py` alle 52 Vorschriften zwischen **18:55:49 und 18:56:53** vollständig abgerufen und validiert; Ausgabe in ein isoliertes temporäres Ziel. Alle 52 Inhaltshashes stimmen mit dem Repository-Bestand überein. Der Gesamthash der sortierten `url + " " + content_sha256`-Zeilen (UTF-8, durch LF getrennt, kein abschließendes LF) lautet in beiden Beständen:

`88ee9aace86e37bba80c235b375197035c52a18e3280ac6aaa6abe76e064b079`

Damit ist weder eine durchgehende globale Nichterreichbarkeit der Quelle noch eine Änderung der extrahierten Texte nachgewiesen. Die GitHub-Verbindung ist damit noch nicht als wiederhergestellt bestätigt. Der lokale Systemresolver dieser isolierten Umgebung ist kein brauchbarer Gegenbeweis für GitHub-DNS, weil die erfolgreichen HTTPS-Abfragen über einen Proxy erfolgen. Es werden weder IP-Adressen fest verdrahtet noch TLS-Prüfungen umgangen.

## Aktualität und Sicherheitsgrenze

Im untersuchten `main` enthalten JSON und MJS identische, vollständige 52/52 Datensätze. URLs, Titel, Textlängen, SHA-256, Prüfzeiten, Weiterleitungsziel und Vollständigkeitskennzeichen bestehen die vorhandene Katalogvalidierung. Gespeicherte Prüfzeiten: **29.10.2026 09:56:06 bis 09:56:12 UTC**. Die unabhängige Gegenprüfung hat diese Repository-Dateien nicht verändert.

`verifiedResearch.mjs::primarySourceCatalogue` akzeptiert den aktuellen und den vorherigen UTC-Kalendertag, nicht pauschal 48 Stunden. Ohne veröffentlichten Vollabruf werden diese Datensätze ab **31.10.2026 00:00 UTC / 01:00 MEZ** nicht mehr als Fallback angeboten. Ein gezielter Test bestätigt 52 Einträge unmittelbar davor und 0 danach. Das belegt technische Abrufaktualität und Textidentität, keine eigenständige juristische Bewertung der Vorschriften.

## Konkrete Workflow-Korrektur

Commit [`99ddf382`](https://github.com/sebastianauls-cmyk/AS-GOLD-/commit/99ddf3820c29a4c16dc9ddfcea6eea9f2a3ef1e7) führte am 30.10. um 17:10 UTC `continue-on-error: true` ein. Der folgende Lauf zeigt die dadurch entstandene falsche Erfolgsmeldung praktisch. Alte Dateien zu behalten ist richtig; daraus einen erfolgreichen Refresh zu machen, ist falsch.

Der Patch entfernt diese Fehlerunterdrückung und den redundanten Testschritt nach einem Ausfall. `failure() && steps.refresh.outcome == 'failure'` erhält die bereits vorhandene Verbindungsdiagnose auch nach einem harten Fehler. Der Commit-Schritt bleibt an einen erfolgreichen Refresh gebunden. Abrufskript, Wiederholungen, Schedule, Cache-Inhalte und Altersgrenze bleiben unverändert.

GitHub dokumentiert [continue-on-error](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idstepscontinue-on-error) und die [implizite success()-Bedingung](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions). Für Diagnosebedingungen nach einem harten Fehler ist die explizite Statusfunktion erforderlich.

## Wiederanlauf

1. Patch prüfen und übernehmen. Danach einen **neuen** `workflow_dispatch` auf dem aktuellen `main` starten. Nicht den historischen Lauf mit `097f919` erneut ausführen: `main` ist weitergelaufen; ein dort neu erzeugter Snapshot-Commit würde beim normalen Push ohne Fast-Forward scheitern. Kein Force-Push und kein Zurücksetzen von `main`.
2. Die bestehende Probe mit drei begrenzten Versuchen beibehalten. Erfolg verlangt entweder einen bereits vollständig validierten Bestand desselben UTC-Tags (klar als Skip) oder einen neuen Vollabruf 52/52 mit erfolgreichem Push beider Dateien. Bei einem Push-Konflikt einen neuen Lauf auf aktuellem `main` ausführen, nicht einen älteren Snapshot über einen jüngeren schreiben.
3. Nach Fehlschlag bleibt der Lauf rot. Die vier bestehenden Cron-Termine (03:17, 05:17, 07:17, 11:17 UTC) und `workflow_dispatch` erlauben neue Versuche auf frischen Runnern. Geplante GitHub-Ausführungen können verspätet eintreffen oder ausfallen; die bestehenden Termine garantieren keine Aktualisierung vor der Cache-Grenze.
4. Vor Ablauf der Altersgrenze einen vollständigen Wiederanlauf prüfen. Bleibt GitHub unerreichbar, obwohl eine andere kontrollierte Umgebung die amtliche Quelle erreicht, dort den unveränderten Refresher auf einem frischen Checkout ausführen und die **beiden vollständig validierten Dateien gemeinsam** über einen überprüfbaren Commit veröffentlichen. Die unabhängige Gegenprobe oben bestätigt, dass dieser Abrufweg derzeit funktioniert; sie veröffentlicht selbst keinen Bestand. Erst ein veröffentlichter vollständiger Bestand stellt die Aktualität für die Anwendung wieder her.
5. Bei wiederholtem Ausfall für die Eingrenzung A/AAAA-Antworten, aufgelöste IP, DNS-/TCP-/TLS-Zeiten und einen GET derselben URL aus GitHub und einem zweiten Netz zeitnah vergleichen. Einen anderen dauerhaften Runner erst nach erfolgreichem Volltest einrichten. Fehlende AAAA-Einträge, ein anderer Betriebssystemname oder ein einmal grüner Skip rechtfertigen keine vermeintliche DNS-Reparatur.

Unvollständige Abrufe, alte Kopien und erfolgreiche Offline-Tests dürfen niemals neue Prüfzeiten oder einen erfolgreichen Abrufstatus erzeugen. Kein Verlängern der Altersgrenze, kein bloßes Umschreiben von `checked_at`, keine ungeprüfte Ersatzquelle.

## Prüfung des Patches

- Neue Workflow-Sicherheitsprüfung scheitert auf dem unveränderten `main` am vorhandenen `continue-on-error`; nach dem Patch sind **11/11 Python-Tests erfolgreich**.
- Neuer CLI-Integrationstest: vollständiger Netzausfall und Teilabruf liefern Exit ungleich 0 und lassen beide Dateien bytegleich; vollständiger Wiederanlauf veröffentlicht 52/52; ein anschließender Tages-Skip bewahrt die neuen Originalprüfzeiten ohne Netzwerkzugriff.
- Bestehender Anwendungstest `runRentalSourceFallbackChecks()` besteht: echte gespeicherte Texte bleiben bei simulierten Timeouts erhalten, manipulierte Hashes und abgelaufene Texte werden verworfen.
- UTC-Ablaufgrenze und `git diff --check` geprüft. Kein vollständiger Frontend-Build für diese auf Workflow und Python-Tests begrenzte Änderung erforderlich.
