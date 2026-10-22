# Wiederverwendung bereits verarbeiteter KI-Schritte

Stand: 21.10.2026

Ein späterer Fehler oder eine neue Worker-Veröffentlichung soll identische, bereits erfolgreich verarbeitete Generierungsschritte nicht erneut beim KI-Anbieter abrechnen lassen. Der Worker speichert deshalb nach erfolgreicher Schrittvalidierung die vollständige Modellantwort verschlüsselt für höchstens 24 Stunden. Pro Nutzer und Fall werden höchstens 48 Antworten vorgehalten.

Der Schlüssel bindet Nutzer, Fall, Dokumentenfingerabdruck, Auftragsoptionen, Schritt und vollständige Modellanfrage einschließlich Anweisungen, Modell, Schema und Ausgabegrenzen. Ein Treffer wird erneut durch die aktuellen Validatoren verarbeitet. Die Speicherung ist keine fachliche Freigabe. Korrekturen und unabhängige Gegenprüfungen werden aus diesem Speicher nie wiederverwendet.

Seit 21.10. werden auch abgeschlossene Suchantworten für eine vollständig identische, datierte Rechercheanfrage wiederverwendet. Datum, Fragen, erlaubte Domains, bereits gelesene und nicht erreichbare URLs bleiben Teil des Schlüssels. Wiederverwendet werden die gefundenen Adressen; ihre Quellentexte werden bei einem neuen Auftrag erneut eingelesen und geprüft. Der vorhandene zeitlich begrenzte Originalquellen-Fallback bleibt kenntlich. Neue Inhalte, Zieladressen, Prüftage oder andere Quellenmerkmale verändern weiterhin die nachfolgenden Modellanfragen. Nur die Abruf-Uhrzeit wird in Generierungsanfragen auf das beobachtete Datum gekürzt. Die genaue neue Uhrzeit bleibt im gespeicherten Quellennachweis erhalten. Die Ergebnisprüfung verzeichnet wiederverwendete Suchantworten ausdrücklich.

Die Datenbank verlangt eine aktuelle Auftragsfreigabe, gültige Einmal-Lease und bestehende Fallberechtigung. Speichern setzt zusätzlich einen passenden abgerechneten Anbieterbeleg voraus. Nutzer können weder Tabelle noch RPCs lesen. Widerruf, Zugriffsänderung, Sperre, ausdrücklicher Abbruch, erfolgreiche Fertigstellung und Ablauf löschen die entsprechenden Daten. Der vorhandene Dispatcher entfernt abgelaufene Antworten auch bei pausierter Verarbeitung. Kein Cache-Treffer verlängert seine Aufbewahrung.

Die bestehenden Auftrags-, Tages-, Token-, Such- und Laufzeitgrenzen bleiben unverändert. Ein Treffer erzeugt keine neue Modellreservierung; der ursprüngliche Verbrauch bleibt erhalten. Speicherfehler stoppen vor einem bezahlten Ersatzaufruf. Vorhandene historische Modellantworten werden nicht nachträglich eingespielt.

## Gezielter Nachweis

`npm run test:case-response-cache` verwendet den echten Worker, echte lokale SQL-Migrationen und Verschlüsselung mit simulierten Anbieterantworten sowie gesperrtem Netzwerk. Nach einem späteren Prüfungsfehler und Wechsel der Veröffentlichung benötigt der identische Wiederanlauf vier statt neun simulierte Anbieteraufrufe: fünf Generierungsschritte werden wiederverwendet, alle vier unabhängigen Prüfungen erfolgen erneut. Dies ist keine Euro-Ersparnisberechnung und kein bestandener Live-KI-Test.

Zusätzlich geprüft: geänderte Originale, Modell, Anweisung und Sprache; erneute Validierung älterer Antworten; fehlender Anbieterbeleg; verweigerter Nutzerzugriff; falsche Lease; ausgeschöpftes Budget vor einer echten Prüfung; beschädigte Verschlüsselung; Löschung und Ablauf. Die bestehenden Hintergrund- und vollständigen Falltests sowie die HTTP-Authentifizierungsprüfung bestehen ebenfalls mit simuliertem Anbieter.

Der neue Fall mit tatsächlichem Quellenabruf benötigt beim identischen Wiederanlauf vier statt zehn simulierte Modellaufrufe. Alle vier unabhängigen Prüfungen bleiben erhalten. Der Test weist einen neuen Quellenabruf und die Wiederverwendung bei unverändertem Inhalt nach. Bei geändertem Quellentext wird die inhaltliche Analyse neu ausgeführt. Ein geändertes Datum, Thema oder eine andere Domainliste verhindert die Wiederverwendung der Suche. Damit wird erstmals der zuvor ungetestete Wiederanlauf mit Recherche abgedeckt.

Der Betriebsstopp wird zusätzlich unmittelbar bei der Modellreservierung geprüft. Eine bereits vor der Pause ausgegebene Lease darf danach keinen weiteren Aufruf autorisieren. Bereits gesendete Anfragen lassen sich dadurch nicht rückgängig machen. Der lokale Test sperrt sowohl neue Aufträge als auch einen schon beanspruchten Auftrag und bestätigt null neue Reservierungen und null Anbieteraufrufe. Das ist ein Ein/Aus-Kostenstopp, keine positive Euro-Obergrenze. Eine solche Obergrenze bleibt wegen unbekannter/verspäteter Abrechnung und möglicher zusätzlicher Anbieter-Suchaktionen offen.

Auslieferungsreihenfolge: bestehende Migrationen einschließlich `validated_case_response_cache`, danach `20261021080719_bounded_case_reuse.sql`, dann `gold-case-worker`. Der Server-Einstieg aktiviert `reuseValidatedResponses:true`; ältere Aufrufer bleiben kompatibel. Eine Auslieferung startet keinen Fall und keinen Modellaufruf. Historische fehlgeschlagene Aufträge werden nicht neu gestartet.
