# AS Gold Workspace

Rekonstruierte, vollständige Quellcode-Basis der laufenden AS-Gold-Anwendung.

## Verbindlicher Versionsstand
- Gesamt- und Produktstand: **V23**.
- Repository, Vercel-Preview und Produktionsfreigabeprüfung beziehen sich verbindlich auf V23.
- Die frühere Bezeichnung „V17“ war lediglich die interne Nummer eines technischen Quellcode-Sicherungspakets und ist nicht die Produktversion.

## Stand
- Öffentliche Produkt- und Preisübersicht
- Kostenloser Einstieg bis Gold Business
- Registrierung / Anmeldung über Supabase
- Dashboard, Fälle, Kunden, Dokumente, Freigaben
- Dokument-Upload in privaten Supabase Storage
- Exporte: PDF, DOCX, XLSX, PPTX, CSV, TXT
- Tarifabhängige Exportfreigaben
- Upgrade-Vorschau mit 1/3/6/12 Monaten
- 0/5/10/15 % Mehrmonatsvorteil
- anteilige Upgrade-Differenz bis zum Ende der laufenden Periode
- keine automatische Verlängerung
- Bezahlfunktion bewusst deaktiviert

## Sicherungsregel
Jeder freigegebene funktionierende Stand wird nach Test sowohl auf Vercel bereitgestellt als auch versioniert im Google-Drive-Ordner „App intern gold / AS Gold Quellcode-Sicherungen“ gesichert.

## Mehrsprachigkeit – V3

Aktive UI-/Ausgabesprachen:
- Deutsch (Standard)
- Englisch
- Türkisch
- Polnisch
- Ukrainisch
- Russisch
- Arabisch

Die Sprache der App und die Ausgabesprache sind getrennte Einstellungen. Die rechtliche Grundlage bleibt unabhängig von der Sprache Deutschland / deutsches Recht.
Arabisch aktiviert automatisch RTL-Darstellung. Weitere Sprachpakete können über den zentralen `languages`-Katalog und das `ui`-Wörterbuch in `app/page.js` ergänzt werden, ohne Tarif-, Datenbank- oder Rechtslogik zu verändern.

Nächste vorbereitete Kandidaten nach Nutzungsbedarf: Rumänisch, Italienisch, Bulgarisch, Kroatisch und Griechisch.

## V5 – vollständigerer Mehrsprachenstand (29.08.2026)
- UI-Texte in öffentlichen und angemeldeten Bereichen auf DE/EN/TR/PL/UK/RU/AR umgestellt.
- Status-, Ampel-, Laufzeit- und Upgrade-Texte lokalisiert.
- Tarifbeschreibungen für alle sechs Bezahl-/Einstiegsstufen in allen 7 Sprachen ergänzt.
- App-Sprache und Ausgabesprache bleiben getrennt.
- Arabisch nutzt RTL-Darstellung.
- Deutscher Markt / deutsche Rechtsgrundlage bleibt unabhängig von der Sprache verbindlich sichtbar.
- Zahlungsfunktion bleibt deaktiviert.

## V6 – Sprachmeldungen und Monatsdarstellung
- System-/Erfolg-/Fehlermeldungen für DE/EN/TR/PL/UK/RU/AR lokalisiert.
- Dokumentlimit- und Export-Sperrmeldungen lokalisiert.
- Upgrade-Bestätigung wird nicht mehr aus einer deutschsprachigen Backend-Nachricht übernommen.
- Monatsdarstellung für Deutsch/Englisch korrigiert; weitere Sprachen behalten ihre sprachneutralen/abgekürzten Formen.
- JavaScript-Syntaxprüfung erfolgreich.
- Produktionsversion wird dadurch noch nicht ersetzt; Preview-Build bleibt Voraussetzung.

## V13 – Marktreife / Transparenz & Kontrolle
- Fallansicht erklärt jetzt „Warum dieses Ergebnis?“ anhand zugeordneter Dokumente, Sachstand, fehlender Grundlagen, Ampelstatus und nächstem Schritt.
- Ohne Dokumentgrundlage wird ausdrücklich „nicht sicher bewertbar“ angezeigt statt einer scheinbar sicheren Aussage.
- Dashboard zeigt Tarif-/Zahlungsstatus sowie klare Hinweise zu Datenkontrolle und Audit-Nachvollziehbarkeit.
- Noch nicht belastbar vorhandene Kontoaktionen (z. B. finale Lösch-/Audit-Backendfunktionen) werden nicht als funktionierende Buttons vorgetäuscht.
- Bezahlfunktion bleibt deaktiviert.


## V14 – Nutzerkontrolle & Kontosicherheit (29.08.2026)
- echter Kontodaten-Export als JSON aus den aktuell geladenen Kunden-, Fall-, Dokument- und Freigabedaten
- Passwort-zurücksetzen über Supabase Auth aus dem Login
- lokale Gerätehistorie für wichtige Aktionen (bewusst als lokale Historie gekennzeichnet, nicht als vollständiger Server-Audit)
- wichtige lokale Aktionen: Kundenanlage, Dokumentupload/-öffnung, Exporte und Kontodatenexport
- keine Schein-Löschfunktion; serverseitige Lösch- und vollständige Audit-Funktionen bleiben als offene Marktreife-Punkte gekennzeichnet
- Bezahlfunktion unverändert deaktiviert

## V15 – Serverseitiger Audit-Trail & Löschkontrolle (29.08.2026)

- Neue Supabase-Tabelle `audit_events` mit RLS: Nutzer können nur eigene Audit-Einträge lesen und neue eigene Einträge erzeugen; Update/Delete für normale Nutzer gesperrt.
- Neue Supabase-Tabelle `deletion_requests` mit RLS: Löschanträge werden nachvollziehbar gespeichert; normale Nutzer können offene eigene Anträge nur zurücknehmen, nicht löschen oder als erledigt markieren.
- Kontolöschung ist bewusst kein Sofort-Löschen: Abhängigkeiten und mögliche gesetzliche Aufbewahrungspflichten müssen vor endgültiger Löschung geprüft werden.
- UI zeigt serverseitige Audit-Einträge getrennt von lokaler Gerätehistorie.
- Audit-Einträge werden für Dokumentupload/-öffnung, Exporte, Kontodatenexport, Kundenanlage und Upgrade-Anfragen erzeugt.
- Sicherheitscheck: bestehende Warnungen zu älteren SECURITY-DEFINER-Funktionen sowie deaktivierter Leaked-Password-Protection festgestellt; diese Alt-Funktionen wurden nicht blind verändert und bleiben eigener Prüfschritt.
- Bezahlfunktion weiterhin deaktiviert. Produktionsversion unverändert.

## V16 – Sicherheitsgrenze der Upgrade-RPCs (29.08.2026)
- Öffentliche RPCs `gold_current_term_status`, `gold_upgrade_quote` und `gold_request_upgrade` sind jetzt SECURITY INVOKER.
- Privilegierte Implementierung liegt im nicht öffentlich exponierten `private`-Schema.
- `anon` erhält keinen Zugriff auf diese Funktionen; Ausführung ist auf angemeldete Nutzer beschränkt.
- Supabase Security Advisor danach erneut geprüft: die drei SECURITY-DEFINER-Warnungen im öffentlichen Schema sind beseitigt.
- Verbleibender Security-Advisor-Punkt: Schutz vor bekannten kompromittierten Passwörtern ist in Supabase Auth noch nicht aktiviert und muss vor Marktstart eingeschaltet werden.
- Die öffentlich erreichbaren Edge-Funktionen `gold-app` und `gold-install` bleiben absichtlich ohne JWT-Zwang, weil sie die Login-/Installationsoberfläche ausliefern; geschützte Datenzugriffe erfolgen weiterhin über Auth/RLS.
- Bezahlfunktion bleibt deaktiviert.

## V23 – Sicherheitsupdate Build-Basis (29.08.2026)
- Next.js von 15.5.2 auf 15.5.24 angehoben (Maintenance-LTS Sicherheitsstand laut Next.js Security Release vom 25.08.2026).
- Keine Änderung an Zahlungsaktivierung: Zahlung bleibt deaktiviert.
- Produktionsstand bleibt unverändert.
- GitHub-Zugriff am 29.08.2026 erfolgreich hergestellt; der geprüfte V23-Stand wird vollständig im Repository versioniert.
- Lokaler Produktions-Build mit Next.js 15.5.24 erfolgreich.
- Vollständige Vercel-Preview mit allen benötigten Source-Dateien erfolgreich gebaut.
- Browser-Grundtest bestanden: öffentliche Startseite, Registrierungsansicht, Zurück-Navigation und Sprachwechsel DE/EN reagieren; keine App-Browserfehler festgestellt.
- Anmeldung und Registrierung besitzen eine zugängliche Klartextanzeige für Passwortfelder; beide Registrierungsfelder lassen sich unabhängig umschalten, einschließlich lokalisierter RTL-Darstellung.
- Die privilegierte interne Funktion zur Änderung von Tarifberechtigungen ist nicht mehr für normale angemeldete Nutzer ausführbar; nur die vertrauenswürdige Backend-Rolle behält Zugriff.
- Die Exportprotokollierung besitzt jetzt die benötigten nutzergebundenen RLS-Rechte; unnötige `TRUNCATE`-, `TRIGGER`- und `REFERENCES`-Rechte wurden von Browserrollen entfernt und Clientfehler werden nicht mehr als Erfolg ausgegeben.
- Die mobile öffentliche Kopfzeile ordnet Marke, Sprachwahl, Registrierung und Anmeldung auf schmalen Displays in zwei klare Zeilen.
- Produktion wurde nicht verändert und ist weiterhin erreichbar.
- Noch offen vor einer Produktionsfreigabe: vollständiger End-to-End-Test mit einem angemeldeten Testkonto, Aktivierung des Schutzes vor kompromittierten Passwörtern, verbindliche Upload-Größen-/Dateitypgrenzen und abschließender Test auf einem echten Mobilgerät.
