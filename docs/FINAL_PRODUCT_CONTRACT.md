# ASH Workspace Gold – Verbindlicher Produkt- und Releasevertrag

Stand: 30.10.2026

Diese Datei beschreibt den verbindlichen Abschlusszustand des Produkts. Sie ist kein Marketingtext, sondern eine technische Produktgrenze. Änderungen an diesen Regeln müssen absichtlich erfolgen und durch die Release-Gates abgesichert werden.

## 1. Produktziel

ASH Workspace Gold soll aus Dokumenten und Angaben einen kontrollierten Fall machen: Sachstand, Chronologie, Fristen, Ampel, Widersprüche, Beweislücken, Quellenstatus, nächste Schritte, vorbereitete Schreiben, Freigaben und Exporte.

Nicht das Chatten mit einzelnen Dokumenten ist das Kernprodukt, sondern die nachvollziehbare Bearbeitung eines gesamten Vorgangs.

## 2. Aktive Leistungsstufen

Es gibt genau drei aktive Bezahlstufen:

- Gold Start – 19,90 EUR / 30 Tage
- Gold Professional – 89,90 EUR / 30 Tage
- Gold Business – 499,90 EUR / 30 Tage

Legacy-Stufen wie Klar, Analyse und Komplett dürfen nur als inaktive historische Datensätze bestehen bleiben und nicht wieder als aktive öffentliche Tarife erscheinen.

### Start
Für einzelne überschaubare Vorgänge. Muss Ordnung, kompakten Sachstand, erkennbare Fristen/Red Flags und einen sinnvollen nächsten Schritt liefern. Darf keine vollständige komplexe Mehrdokumentenstrategie vortäuschen.

### Professional
Kernprodukt für anspruchsvolle Fälle. Muss mehrere Dokumente im Fallkontext zusammenführen und mindestens Chronologie, Ampel, Widersprüche, Beweislücken, Fristen, Quellenstatus, Prioritäten, konkrete nächste Schritte und vorbereitete Schreiben bzw. Ausgaben unterstützen.

### Business
Professional plus Organisation. Muss mehrere Kunden/Fälle, Freigaben, Audit-Nachvollziehbarkeit und wiederkehrende Arbeitsabläufe unterstützen. Integrationen dürfen nur als aktiv beworben werden, wenn die jeweilige externe Verbindung tatsächlich konfiguriert ist.

## 3. Verbindliche Sicherheits- und Freigaberegeln

- Keine externe Kundenkommunikation ohne ausdrückliche Freigabe.
- Vor einer Freigabe muss eine sichtbare Vorschau existieren.
- Bei mehreren möglichen Empfängern darf nicht geraten werden.
- Quellenprüfung ist ein Workflowstatus und niemals eine Erfolgswahrscheinlichkeit.
- Nicht belegte Tatsachen dürfen nicht als gesichert dargestellt werden.
- Fehlende oder widersprüchliche Grundlagen bleiben sichtbar.
- Reale Kundendaten gehören nicht in synthetische Testfälle.
- Externe E-Mail-Konten werden nur nach ausdrücklicher Verbindung verwendet.

## 4. Produktionsabnahme

Ein Produktionsstand gilt technisch nur dann als freigabefähig, wenn gleichzeitig bestehen:

- finales Release-Gate
- Tarif-Abnahmetests Start / Professional / Business
- Verifikation
- synthetische Tester
- PDF-/Beweisprüfung
- öffentlicher Browserlauf
- Produktions-Gast-Smoke-Test
- produktives Vercel-Deployment READY
- keine bekannten reproduzierbaren Runtime-Blocker

Der Produktions-Gast-Smoke-Test prüft die echte Live-App kostenfrei einmal täglich mit genau einer synthetischen Gast-Sitzung: anonyme Anmeldung, Fallerstellung, Persistenz und Wiederöffnung. Cross-Device-Verhalten (Desktop/Android/iPhone) wird im getrennten Browser-Gate geprüft, damit die Produktionsprüfung die bewusst begrenzte Gastquote nicht selbst aufbraucht. Für die Quote zählen nur tatsächlich freigeschaltete Gastzugänge; abgewiesene anonyme Auth-Identitäten dürfen die 24-Stunden-Grenze nicht verlängern.

## 5. Externe Konfigurationen – ausdrücklich nicht als fertig vortäuschen

### Google / Microsoft E-Mail
Die Integrationspfade sind technisch vorbereitet. Ohne die jeweiligen OAuth-Zugangsdaten sind sie nicht aktiv. Die UI muss in diesem Zustand klar melden, dass die Verbindung noch nicht konfiguriert ist.

### Live-Zahlungen
Checkout-Code und SumUp-Anbindung sind vorbereitet, aber Live-Zahlungen bleiben technisch gesperrt, solange keine gesonderte rechtliche und betriebliche Freigabe erfolgt.

### Supabase Leaked-Password-Protection
Der Supabase Security Advisor meldet den Schutz gegen bekannte kompromittierte Passwörter derzeit als deaktiviert. Dieser Punkt liegt in der externen Auth-Konfiguration und darf nicht als behoben dokumentiert werden, solange er dort nicht aktiviert wurde.

## 6. Änderungsregel bis zur Marktreife

Bis zur formalen Produktfreigabe gilt: Fertigstellung vor Erweiterung.

Keine neuen Module, keine neue Tarifstruktur und keine kosmetischen Nebenprojekte, solange reproduzierbare Fehler, Abnahmelücken oder Sicherheitsblocker offen sind.

Jede produktkritische Änderung muss:
1. im Quellcode nachvollziehbar sein,
2. durch einen automatischen Test oder Release-Gate abgedeckt sein,
3. in Produktion erneut geprüft werden.

## 7. Bewusste Produktgrenzen

ASH Workspace Gold ersetzt keine verbindliche Rechtsberatung und keine externe Vertretung. Ergebnisse sind nachvollziehbare Arbeits- und Entscheidungsgrundlagen und müssen vor verbindlicher Verwendung geprüft und – bei externer Kommunikation – ausdrücklich freigegeben werden.
