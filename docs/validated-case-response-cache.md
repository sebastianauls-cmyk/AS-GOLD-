# Wiederverwendung bereits verarbeiteter KI-Schritte

Stand: 19.10.2026

Ein späterer Fehler oder eine neue Worker-Veröffentlichung soll identische, bereits erfolgreich verarbeitete Generierungsschritte nicht erneut beim KI-Anbieter abrechnen lassen. Der Worker speichert deshalb nach erfolgreicher Schrittvalidierung die vollständige Modellantwort verschlüsselt für höchstens 24 Stunden. Pro Nutzer und Fall werden höchstens 48 Antworten vorgehalten.

Der Schlüssel bindet Nutzer, Fall, Dokumentenfingerabdruck, Auftragsoptionen, Schritt und vollständige Modellanfrage einschließlich Anweisungen, Modell, Schema und Ausgabegrenzen. Ein Treffer wird erneut durch die aktuellen Validatoren verarbeitet. Die Speicherung ist keine fachliche Freigabe. Recherche, Korrektur und unabhängige Gegenprüfung werden aus diesem Speicher nie wiederverwendet.

Die Datenbank verlangt eine aktuelle Auftragsfreigabe, gültige Einmal-Lease und bestehende Fallberechtigung. Speichern setzt zusätzlich einen passenden abgerechneten Anbieterbeleg voraus. Nutzer können weder Tabelle noch RPCs lesen. Widerruf, Zugriffsänderung, Sperre, ausdrücklicher Abbruch, erfolgreiche Fertigstellung und Ablauf löschen die entsprechenden Daten. Der vorhandene Dispatcher entfernt abgelaufene Antworten auch bei pausierter Verarbeitung. Kein Cache-Treffer verlängert seine Aufbewahrung.

Die bestehenden Auftrags-, Tages-, Token-, Such- und Laufzeitgrenzen bleiben unverändert. Ein Treffer erzeugt keine neue Modellreservierung; der ursprüngliche Verbrauch bleibt erhalten. Speicherfehler stoppen vor einem bezahlten Ersatzaufruf. Vorhandene historische Modellantworten werden nicht nachträglich eingespielt.

## Gezielter Nachweis

`npm run test:case-response-cache` verwendet den echten Worker, echte lokale SQL-Migrationen und Verschlüsselung mit simulierten Anbieterantworten sowie gesperrtem Netzwerk. Nach einem späteren Prüfungsfehler und Wechsel der Veröffentlichung benötigt der identische Wiederanlauf vier statt neun simulierte Anbieteraufrufe: fünf Generierungsschritte werden wiederverwendet, alle vier unabhängigen Prüfungen erfolgen erneut. Dies ist keine Euro-Ersparnisberechnung und kein bestandener Live-KI-Test.

Zusätzlich geprüft: geänderte Originale, Modell, Anweisung und Sprache; erneute Validierung älterer Antworten; fehlender Anbieterbeleg; verweigerter Nutzerzugriff; falsche Lease; ausgeschöpftes Budget vor einer echten Prüfung; beschädigte Verschlüsselung; Löschung und Ablauf. Die bestehenden Hintergrund- und vollständigen Falltests sowie die HTTP-Authentifizierungsprüfung bestehen ebenfalls mit simuliertem Anbieter.

Auslieferungsreihenfolge: Migration `20261019020357_validated_case_response_cache.sql`, dann `gold-case-worker`. Der Server-Einstieg aktiviert `reuseValidatedResponses:true`; ältere Aufrufer bleiben kompatibel. Eine Auslieferung startet keinen Fall und keinen Modellaufruf.
