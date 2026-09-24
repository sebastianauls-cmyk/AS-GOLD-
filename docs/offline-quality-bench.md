# Lokaler Prüfstand ohne KI-Aufruf

Der Prüfstand prüft feste Anforderungen an unterschiedliche Fallarten, bevor weitere Modellaufrufe Geld kosten. Er nutzt die produktiven Beleg-, Berechnungs-, Fahrplan- und Fortschrittsfunktionen. Ein separater Prüfauftrag benennt pro Fall die erwarteten Ergebnisse und nächsten Handlungen.

```sh
npm run test:offline
npm run test:offline -- --case insurance
npm run test:offline -- --json
```

Der Prüflauf benötigt Node 24 und die vorhandene Projektinstallation. Er verwendet weder einen API-Schlüssel noch Supabase-Zugang. `fetch`, HTTP(S), TCP/TLS, DNS, UDP, WebSocket und gestartete Hilfsprozesse werden vor dem Import der App-Funktionen gesperrt. Vier absichtliche Sperrproben werden getrennt von unerwarteten Netzwerkversuchen gezählt. Das ist ein Schutz gegen versehentliche Dienstaufrufe in vertrauenswürdigen Tests, keine Sandbox für fremden ausführbaren Code.

## Feste Prüffälle

| ID | Fall | Unabhängig festgelegtes Soll |
| --- | --- | --- |
| `invoice` | Werkstattrechnung | 1.200 − 300 = 900 EUR; Reparaturauftrag beschaffen; Abweichungen konkret klären |
| `deposit` | Mietkaution | 1.500 − 250 = 1.250 EUR; Abzüge bleiben ohne Nachweise ungeklärt |
| `insurance` | Versicherungsabrechnung | 2.500 − 1.800 = 700 EUR; Vertragsgrundlage und Kürzung erläutern; themenfremde Quelle zurückweisen |
| `salary` | Lohnabrechnung | 2.850 − 310 − 570 = 1.970 EUR; Zahlenabgleich trotz offener Steuermerkmale möglich |
| `authority` | Behördenpost | Ausdrücklich verlängerte Frist 20.10.2026; Vorbereitung, Einreichung und Antwortprüfung vollständig verbinden |
| `energy` | Energieabrechnung | 1.500 × 0,32 + 120 − 600 = 0 EUR; auch Nullsaldo ausgeben; Zählerstand gesondert prüfen |
| `bilingual` | Englische Erklärung/deutscher Brief | 4.500 − 1.500 = 3.000 EUR; Originalzitate deutsch; Referenzbrief deutsch; eigentliche Anfrage vollständig übersetzt |
| `family` | Zwei Begünstigte, interne Simulation | Beide Nettozahlungen 27.930/28.421 EUR; bedingte statische Szenarien 21.600/32.400 EUR; keine ausgelassene Antwort oder simulierte Einreichung |

Alle Dokumente, Quellen, Referenzantworten und Personen sind **erfunden**. Die Quellen unter `fixtures.invalid` behaupten kein geltendes Recht. Einige negative Varianten rekonstruieren Fehlermuster aus bereits gemeldeten Produktionsprüfungen; sie sind ausdrücklich `reconstructed_reported_failure`, keine archivierten Originalantworten. Neue Quellenrecherche und echte fachliche Prüfung sind nicht durch diese Fixtures ersetzt.

## Was das Ergebnis aussagt

Die acht Referenzantworten müssen die produktive Prüfung und den separaten festen Prüfauftrag bestehen. 26 gezielte Fehlvarianten prüfen, ob falsche Rechnungen, fehlende Begünstigte, unbelegte Rechenwerte, themenfremde Quellen, unvollständige Übersetzungen, alte Fristen oder ausgelassene Handlungen erkannt werden. Eine Variante wird jetzt bereits im Produkt regelbasiert korrigiert, die übrigen 25 werden im lokalen Prüfauftrag beanstandet. Erledigung und Wiederöffnung werden zusätzlich über die tatsächlichen Fortschrittsfunktionen geprüft.

Der Bericht unterscheidet:

- **Referenz-/Gegenproben bestanden:** Die konkreten Regeln und Beispiele funktionieren lokal.
- **Produktions-Strukturprüfung:** Belegt u. a. Herkunft der Zitate und Rechenwerte. Ein formal gültiges Zitat kann dennoch zur falschen Frage gehören. `production_validation_gaps` benennt die synthetischen Fehlvarianten, für die der feste lokale Prüfauftrag zusätzlich benötigt wird. Diese Zahl ist keine Anzahl neu entdeckter Produktionsfehler.
- **Neue KI-Qualität: nicht gemessen / Produktabnahme: offen:** Der Test erzeugt keine neue Modellantwort. Auch ein grüner Prüflauf belegt keine vollständige fachliche Produktreife und keine generelle Richtigkeit über alle Sprachen und Länder.

Textregeln und Quellenzuordnungen sind bewusst fallbezogen. Sie entdecken die festgelegten Fehlermuster, können aber gültige andere Formulierungen beanstanden oder bisher unbekannte Fehler übersehen. Änderungen am Prüfauftrag brauchen eine begründete Prüfung gegen das Original; Erwartungen dürfen nicht einfach an eine falsche Antwort angepasst werden.

## Bereits vorhandene Antworten wiederverwenden

Eine lokal vorhandene JSON-Antwort **zu genau einem dieser Originalfälle** lässt sich wiederholt prüfen:

```sh
npm run test:offline -- --case insurance --response /privater/pfad/antwort.json --json
```

Unterstützt werden das vollständige Ergebnisobjekt und der gespeicherte Datensatz mit einem `result`-Objekt. Ein unpassender oder fehlerhafter Inhalt liefert einen Fehlerstatus. Der Befehl liest nur diese lokale Datei; er startet weder eine Analyse noch einen Datenbankabruf und speichert die Datei nicht im Repository. Für einen anderen Fall zuerst passende anonymisierte Originale und einen unabhängigen Prüfauftrag anlegen, einschließlich stabiler Themen-, Rechen- und Schrittkennungen. Echte Kundendaten und API-Schlüssel nicht in dieses öffentliche Repository aufnehmen.

Die zeitlich begrenzte verschlüsselte Arbeitsfortsetzung im Backend bleibt getrennt vom dauerhaften Regressionstest. Es werden keine privaten Arbeitsstände automatisch entschlüsselt oder veröffentlicht.

## Konkrete Produktkorrektur

Reproduziert wurde die Anweisung „Antworten aus Schritten 2 bis 4“ mit technischen Abhängigkeiten nur auf Schritt 2 und 4. Der Folgeschritt konnte deshalb ohne Antwort aus Schritt 3 freigegeben werden. `validateRoadmapResult` übernimmt jetzt vollständig und eindeutig formulierte nummerierte Wartebedingungen in die Abhängigkeiten. Der Test prüft fehlende mittlere Abhängigkeiten, englische/deutsche Formulierungen, andere Fallarten, Unveränderlichkeit der Eingabe und die tatsächliche Sperre im Fortschritt.

Die Ableitung gilt nur für vollständige, eindeutige Antwortlisten auf vorherige Schritte im Feld `waiting_for`, beispielsweise „Responses from steps 2 through 4“. Verneinungen, Alternativen, Ausnahmen, Datumsangaben und nicht unterstützte Formulierungen werden nicht interpretiert. Verweise auf den aktuellen oder spätere Schritte werden ebenfalls nicht in Voraussetzungen umgewandelt: Ein Schritt darf etwa die Antwort auf seine eigene Anfrage beschreiben. Technische Selbst- oder Zukunftsabhängigkeiten weist die bestehende Graphprüfung weiterhin zurück. Vorhandene Voraussetzungen bleiben erhalten. Allgemeine inhaltliche Fehler benötigen weiterhin fachliche Prüfung. Die Korrektur verursacht keinen zusätzlichen Modellaufruf.

## Kostenarmer weiterer Ablauf

1. Einen Fehler mit vorhandenen Originalen und vorhandener Antwort reproduzieren; erforderliches Soll unabhängig festhalten.
2. Betroffene Codefunktion korrigieren und nur die betroffenen lokalen Prüfungen ausführen. Vor Veröffentlichung gelten zusätzlich die Release-Prüfungen.
3. Änderungen an Berechnungen, Speicherung, Darstellung oder Export brauchen dafür keine neue vollständige KI-Fallanalyse.
4. Eine neue Modellantwort ist erst nötig, wenn das veränderte Generierungsverhalten beurteilt werden soll. Dafür einen kleinen passenden Referenzfall und ein vorher festgelegtes Kostenlimit verwenden; den geprüften anonymisierten Rücklauf dauerhaft als Regression aufnehmen.

Die bestehenden Verbrauchsgrenzen und die Kostenpause bleiben bestehen. Dieser Prüfstand schaltet keine automatischen kostenpflichtigen Tests frei.

## Ergänzung: Quellenabruf und verbundene Folgehandlungen

Der zusätzliche Prüflauf `sourceActionChecks.mjs` verwendet die produktive Recherche- und Korrektursteuerung mit ausschließlich simulierten Antworten. Vier Rechercheabläufe prüfen:

- Eine ausdrücklich ausgewählte URL mit `#Abschnitt` behält nach Normalisierung ihren Vorrang vor beiläufigen Suchtreffern.
- Das Abruflimit bleibt bei acht Quellen. Nicht angefragte Treffer werden als ungelesen geführt; sie sind keine Netzwerkfehler und lösen allein keine Recherchewiederholung aus.
- Eine fehlgeschlagene ausdrücklich ausgewählte Quelle wird nicht durch sieben erfolgreich gelesene beiläufige Treffer als erledigt behandelt. Bereits vorhandene Quellen werden nicht nochmals angefragt.
- Eine im nächsten Rechercheabschnitt nachträglich gelesene Quelle beseitigt den offenen Abrufstatus; alte Fehlerkennzeichen lösen keine weitere Recherche aus.

Ein rekonstruierter Versicherungsfall prüft anschließend einen Quellenfehler mit einer davon abhängigen falschen Handlungsanweisung. Die einmalige gezielte Korrektur darf nun auch die ausdrücklich mit dieser Fallfrage verbundenen vorhandenen Schritte ändern, soweit sie innerhalb der unveränderten Grenze von acht Abschnitten/20.000 Zeichen liegen. Unveränderte Schritte sollen unverändert zurückgegeben werden. Neue Schritte, unzugewiesene Abschnitte und weitere Korrekturschleifen bleiben ausgeschlossen. Die Gegenprobe lässt die falsche Handlung absichtlich stehen: Die anschließende Prüfung stoppt dann ohne freigegebenes Ergebnis und ohne zweite Korrektur.

Das belegt die verbesserte Quellenauswahl und die Möglichkeit einer konsistenten begrenzten Korrektur. Es belegt nicht, dass ein echtes Modell künftig jede Quellenbedeutung und jede Folgehandlung richtig erkennt.
