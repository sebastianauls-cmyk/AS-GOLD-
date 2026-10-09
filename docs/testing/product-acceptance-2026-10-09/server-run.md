# Energieabnahme am 9. Oktober 2026

## Erster echter Serverlauf

Der ausdrücklich freigegebene synthetische Fall wurde am 9. Oktober 2026 um 15:52:34 UTC über die bestehende autorisierte Serverwarteschlange gestartet. Die allgemeine Verarbeitung blieb pausiert; ausschließlich dieser Fall wurde weitergeleitet. Eigentümerberechtigung, vorhandene Verarbeitungsfreigabe, tägliche Kontingente, Modellbudget, signierte Arbeitsstände und sämtliche Qualitätsprüfungen blieben aktiv. Es wurde keine Benutzeranmeldung nachgebildet.

- Fall: `5d659c55-d310-4890-ba1b-b3b28f8dffd7`
- Auftrag: `6160994c-8b47-4dcb-b283-b57305ab6872`
- Unveränderte Quellengrundlage: `77b097811ac23af80201f97e8f726fd213db5fca5cc812928d3dd6fecedb6ac1`
- Abbruch: 16:05:13 UTC, `review_unresolved`, nach einer begrenzten Korrektur und erneuter Gegenprüfung.
- Verbrauchsbelege: 18 abgeschlossene Modellaufrufe, 720225 Eingabetoken und 29172 Ausgabetoken. Dies ist keine Geldkostenberechnung.
- Kein Kundenfahrplan gespeichert; keine Word- oder PDF-Ausgabe eines freigegebenen Ergebnisses vorhanden.

Die Gegenprüfung beanstandete in `analysis.topics[4]` eine unzureichend qualifizierte Aussage zur möglichen Entbehrlichkeit einer Mahnung. Die Rechnung nennt lediglich den Zahlungstermin 16. Oktober 2026. Eine wirksame kalendermäßige Bestimmung und deren Grundlage waren dadurch nicht nachgewiesen. Die schon vor dem Lauf festgelegte Abnahmebedingung 5 ist damit nicht erfüllt.

## Gezielte Korrektur

Die gemeinsame Quellenzuordnungsregel erhält eine ausdrückliche Unterscheidung zwischen dem vom Aussteller genannten Zahlungsziel und einer durch Belege gestützten rechtlichen Wirkung. Mögliche Folgen benötigen ihre konkreten Bedingungen; ein bloßes „kann“ genügt nicht. Die Regel verlangt keine pauschale Ungültigkeit des Termins und erfindet keine fehlenden Verträge.

Die Regel erreicht Erstellung, Abstimmung bereits berechneter Ergebnisse, begrenzte Korrektur und unabhängige Gegenprüfung. Die vorhandenen Tests prüfen diese Übertragung innerhalb der echten Ablaufsteuerung mit simulierten Modellantworten. Sie sind kein Nachweis der inhaltlichen Qualität einer echten Modellantwort. Ein neuer echter Lauf mit unveränderten Ausgangsunterlagen bleibt erforderlich.

Rechtsquellen zur Einordnung des Prüffunds, abgerufen am 9. Oktober 2026:

- https://www.gesetze-im-internet.de/bgb/__286.html
- https://www.vis.bayern.de/recht/verbrauchervertraege/verzug.htm

## Offene Abnahme

Der Browserzugriff blieb durch die Schutzfunktion der Browserübergabe blockiert. Anmeldung, Bedienung und tatsächliche Downloadschaltflächen werden durch einen Serverlauf oder einen lokalen Aufruf des unveränderten Produkt-Exportcodes nicht als geprüft behandelt. Die acht ursprünglichen Abnahmebedingungen und beide Originaldateien bleiben unverändert.

## Zweiter echter Lauf und Korrektur des Prüfumfangs

Der zweite Auftrag `f91e3e07-978b-4358-9edd-7da5591388f9` lief mit Worker 50 vom 9. Oktober 2026 16:14:41 UTC bis 16:22:52 UTC. Die unveränderte Quellengrundlage war dieselbe. Nach 12 abgeschlossenen Modellaufrufen (348629 Eingabetoken, 17081 Ausgabetoken) stoppte die erste Gegenprüfung mit `review_unresolved`: Der Prüfabschnitt beanstandete den fehlenden ausdrücklichen Hinweis auf deutsches Recht als Arbeitsgrundlage. Es wurde wiederum kein Ergebnis gespeichert.

Der allgemeine Einleitungstext wurde dem Analyse-Prüfabschnitt bisher nicht als Kontext mitgegeben. Daher konnte ein solcher Abschnitt eine globale Kennzeichnung nicht zuverlässig beurteilen. Die Korrektur ergänzt einen lokalisierten, serverseitig aus den Falleinstellungen abgeleiteten Hinweis vor der unabhängigen Gegenprüfung. Fremde, gemischte oder unbekannte Länderauswahlen erhalten keinen deutschen Hinweis. Wiederholte Validierung verdoppelt den Hinweis nicht; die Originalunterlagen bleiben unverändert. Jeder Prüfabschnitt erhält den tatsächlichen Überblickstext und vorhandene Einschränkungen als Kontext. Die vollständige Übersicht behält ihre eigene Pflichtprüfung.

Erweiterte Regressionstests prüfen den gespeicherten Hinweis, seine Einbeziehung in alle Prüfabschnitte, Idempotenz und die unterstützten Ausgabesprachen. Der vollständige `test_complete_case.mjs`-Ablauf prüft weiterhin Quellen, Arithmetik, begrenzte Korrektur, Cache-Invalidierung und sämtliche Pflichtprüfungen mit simulierten Modellantworten. Ein erneuter echter Lauf und die eigentliche Browser-Abnahme sind noch offen.
