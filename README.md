# AS Workspace Gold Workspace – V125

Rekonstruierte, vollständige Quellcode-Basis der laufenden AS-Gold-Anwendung.

## Verbindlicher Versionsstand
- Gesamt- und Arbeitsstand: **V125** unter `https://app-gold-workspace.vercel.app`.
- V125 ersetzt den Stripe-Testpfad durch SumUp Hosted Checkout. Der Server akzeptiert ausschließlich einen als Sandbox bestätigten SumUp-Händler, prüft jede Rückmeldung erneut über die SumUp-API und hält Live-Zahlungen technisch gesperrt.
- V124 ergänzte den ersten serverseitig abgesicherten Test-Checkout mit festen Laufzeiten, ohne automatische Verlängerung und mit optionalem Promo-Code.
- Ein gültiger 100-%-Promo-Code gewährt den vorgesehenen Tester-Zugang direkt ohne Checkout; Teilrabatte reduzieren den serverseitig berechneten Zahlbetrag.
- Live-Zahlungen bleiben bis zur gesonderten rechtlichen und betrieblichen Freigabe technisch gesperrt.
- V123 ermöglicht bei zweisprachigen Anschreiben jede unterstützte Kombination aus Ausgangs- und Zielsprache.
- V33 ordnet alle Sprachoptionen vertikal und vollständig sichtbar an und macht die Zurück-Navigation auf jeder betroffenen Oberfläche eindeutig erkennbar.
- V32 ersetzt systemabhängige Emoji-Flaggen durch echte SVG-Landesflaggen und kennzeichnet App- und Ausgabesprache in der oberen App-Leiste eindeutig.
- V31 ergänzt V30 um flaggenbasierte Sprachwahl, automatisch lokalisierte Rechtsseiten und sicher serverseitig validierte Promo-Codes.
- V29 übernimmt den vollständigen V28-Funktionsstand, repariert die Repository-Quelldatei und ergänzt Abhängigkeits-, Header-, Export-, Passwort-, Audit- und Datenbankhärtungen.
- Frühere Versionsbezeichnungen bleiben nur als nachvollziehbare Entwicklungshistorie erhalten.

## Stand
- Öffentliche Produkt- und Preisübersicht
- interaktive Fallauswahl für acht typische Anwendungsbereiche
- sichtbare Einordnung für Privatpersonen, Selbstständige, kleine Unternehmen und Teams mit dokumentenreichen Kundenfällen
- Kostenloser Einstieg bis Gold Business
- Registrierung / Anmeldung über Supabase
- Dashboard, Fälle, Kunden, Dokumente, Freigaben
- mobiler Kernablauf von Fallanlage über Dokumentprüfung bis zur ausdrücklichen Freigabe
- Dokument-Upload in privaten Supabase Storage
- bewusst gestartete Analyse für PDF- und Bild-Testdateien; Vorschläge bleiben bis zur Prüfung und Speicherung vorläufig
- revisionsgebundene Freigaben mit sichtbarer Vorschau und ausdrücklicher Bestätigung
- Exporte: PDF, DOCX, XLSX, PPTX, CSV, TXT
- Tarifabhängige Exportfreigaben
- Upgrade-Vorschau mit 1/3/6/12 Monaten
- Promo-Code-Eingabe mit serverseitiger Gültigkeits-, Tarif-, Laufzeit- und Limitprüfung
- 0/5/10/15 % Mehrmonatsvorteil
- anteilige Upgrade-Differenz bis zum Ende der laufenden Periode
- keine automatische Verlängerung
- echte Bezahlfunktion bewusst deaktiviert; SumUp-Testzahlung nur nach vollständiger Sandbox-Konfiguration
- keine echten Kundendaten im kontrollierten Testbetrieb

## Sicherungsregel
Jeder freigegebene funktionierende Stand wird nach Test sowohl auf Vercel bereitgestellt als auch versioniert im Google-Drive-Ordner „App intern gold / AS Workspace Gold Quellcode-Sicherungen“ gesichert.

## Mehrsprachigkeit – V32

Aktive UI-/Ausgabesprachen:
- Deutsch (Standard)
- Englisch
- Französisch
- Türkisch
- Polnisch
- Russisch
- Arabisch
- Farsi

Die Sprache der App und die Ausgabesprache sind getrennte Einstellungen und werden mit geräteunabhängigen SVG-Landesflaggen gewählt. Dadurch bleiben die Flaggen auch auf Geräten sichtbar, die Unicode-Flaggen nicht oder nur als Buchstaben darstellen. Englisch, Arabisch und Farsi zeigen mehrere zugehörige Landesflaggen. In der oberen App-Leiste sind „Sprache“ und „Ausgabesprache“ zusätzlich sichtbar beschriftet. Impressum, Datenschutz, Nutzungsbedingungen, Cookies, KI-Transparenz, Kontakt, Rechtliches, Testhinweise, Widerruf und Datenschutz-Steuerung wechseln automatisch mit der App-Sprache. Die deutsche Fassung bleibt ausdrücklich verbindlich.
Arabisch und Farsi aktivieren automatisch RTL-Darstellung. Der zentrale Sprachkatalog hält aktive Sprachen, Gebietsschemata und Schreibrichtung konsistent.

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
- Die vorläufige Upload-Testgrenze wurde auf 50 MB pro Datei angehoben. Sie entspricht der technischen Obergrenze des aktuellen Supabase-Free-Tarifs und ist ausdrücklich noch keine endgültige Produkt- oder Tarifgrenze.
- Die vollständige Soll-/Ist-Definition und die offenen Produktentscheidungen stehen in `docs/V23_APP_DEFINITION.md`.
- Noch offen vor einer Produktionsfreigabe: vollständige Definition und Implementierung des Kernablaufs, End-to-End-Test mit einem angemeldeten Testkonto, Aktivierung des Schutzes vor kompromittierten Passwörtern, endgültige Upload-Größen-/Dateitypgrenzen und abschließender Test auf einem echten Mobilgerät.

## V26 – gemeinsamer Veröffentlichungsstand (30.08.2026)

- V24-Fallakte, Fristen, Quellenbasis, Bewertungen, Kamera-/Dateiupload und korrigierbare Dokumentdaten zusammengeführt.
- V25-Freigabeablauf mit Vorschau-Revision, ausdrücklicher Zustimmung oder Ablehnung und Audit-Ereignissen übernommen.
- Geschützte Edge-Funktion `gold-ocr` wird ausschließlich von angemeldeten Nutzern und erst nach aktiver Testdatenbestätigung aufgerufen.
- Analyse unterstützt PDF, JPG, JPEG, PNG, WEBP und GIF bis 18 MB; der allgemeine Test-Upload bleibt vorläufig auf 50 MB begrenzt.
- Erkannter Text, Dokumentart, Datum, Fallzuordnung, Zusammenfassung und nächster Schritt werden nur als änderbarer Vorschlag angezeigt und erst durch bewusstes Speichern übernommen.
- Automatischer Versand, Zahlung, Abonnement und automatische Verlängerung bleiben deaktiviert.
- Details zu Freigabegrenzen und Verifikation stehen in `docs/V26_RELEASE_STATUS.md`.

## V27 – kundenfreundliche Fallauswahl (30.08.2026)

- Der vollständige V26-Stand mit V24-Fallakte, V25-Freigabeablauf und V26-Dokumentanalyse bleibt erhalten.
- Die öffentliche Startseite beantwortet verdichtet: für wen AS Workspace Gold gedacht ist, bei welchen Vorgängen es hilft, welche typischen Fälle passen und welches Ergebnis Nutzer erhalten.
- Acht Fallarten werden als kompakte Auswahl gezeigt; Detailinformationen erscheinen erst nach Auswahl statt gleichzeitig.
- Der Ablauf wird in drei Schritten erklärt: Fallart wählen, Unterlagen hinzufügen, Ergebnis prüfen.
- Transparenzregeln bleiben vollständig erreichbar, sind aber zugunsten einer ruhigen Startseite zunächst eingeklappt.
- Kostenloser Einstieg, deaktivierte Zahlung und fehlende automatische Verlängerung bleiben sichtbar.
- Die mobile Kopfzeile und Fallauswahl wurden für schmale Displays ergänzt.
- V27 ist unter `https://app-gold-workspace.vercel.app` produktiv im kontrollierten Testbetrieb veröffentlicht.
- Der öffentliche Desktop-Browserlauf ist bestanden: acht Fallarten, Registrierung, Passwort-Sichtbarkeit, Zurück-Navigation, sieben Sprachwechsel einschließlich Arabisch/RTL, Transparenzregeln und alle sechs Tarifempfehlungen funktionieren ohne App-Browserfehler.
- Der physische Test auf einem echten Mobilgerät sowie der authentifizierte End-to-End-Test mit einem isolierten Testkonto bleiben eigene Freigabeschritte.
- Details stehen in `docs/V27_IMPLEMENTATION_STATUS.md`.

## V28 – Datenschutz, Rechtstexte und Widerruf (30.08.2026)

- Dauerhaft erreichbarer Rechtsbereich mit Impressum, Datenschutz, Nutzungsbedingungen, Cookies/Browser-Speicher, KI-Transparenz, Kontakt und zentraler Übersicht.
- Registrierung verlangt zwei getrennte, nicht vorausgewählte Bestätigungen: Rechtstexte und ausschließliche Verwendung synthetischer bzw. wirksam anonymisierter Testdaten.
- Uploads benötigen eine zulässige Datenklassifizierung und eine zusätzliche Testdatenbestätigung; echte personenbezogene Daten und Art.-9-Daten bleiben im kontrollierten Test gesperrt.
- KI-Analyse läuft nur nach aktueller Konto-Bestätigung und ausdrücklicher Freigabe des einzelnen Dokuments; jede Dokumentfreigabe wird serverseitig nach einem Versuch verbraucht.
- Eigene Datenschutz-Steuerung zeigt Kontostatus und kann Konto-KI-Verarbeitung sowie noch offene Dokumentfreigaben ausschalten.
- Öffentliche Zwei-Schritt-Funktion „Vertrag widerrufen“ / „Widerruf bestätigen“ speichert den Eingang privat und erzeugt sofort eine herunterladbare Textbestätigung.
- OpenAI-Aufruf nutzt `store: false`; Ergebnisse bleiben vorläufig und werden erst nach menschlicher Prüfung bewusst gespeichert.
- Zahlung, Abonnement, automatische Verlängerung und Verarbeitung echter Kundendaten bleiben deaktiviert.
- Vollständiger technischer und rechtlicher Freigabestatus: `docs/V28_RELEASE_STATUS.md`.

## V29 – Sicherheits-, Integritäts- und Testerhärtung (30.08.2026)

- Beschädigten V28-Quelltext in `app/page.js` anhand des letzten vollständigen V27-Stands und zweier exakter 500-Zeichen-Anker rekonstruiert; die fehlende, zwischen V27 und V28 unveränderte Übersetzungsstrecke wurde vollständig wiederhergestellt.
- Next.js auf 16.3.3, React/ReactDOM auf 19.2.8 und jsPDF auf 4.2.1 aktualisiert.
- Verwundbare bzw. nicht reparierbare XLSX-/PPTX-Abhängigkeiten entfernt; Office-Dateien werden lokal als formelsichere Open-XML-Pakete erzeugt und ohne Laufzeit-CDN heruntergeladen.
- Globale CSP-, Frame-, MIME-, Referrer-, Permissions-, COOP- und HSTS-Header ergänzt; der `X-Powered-By`-Header ist deaktiviert.
- Audit-Ereignisse laufen über eine serverseitig validierte Allowlist-RPC; direkte Browser-Inserts werden mit der V29-Migration entfernt.
- Lokale Gerätehistorie speichert keine Kunden-, Fall-, Betreff- oder Dateinamen mehr und bereinigt vorhandene Detailfelder beim nächsten Laden.
- Registrierung verlangt clientseitig mindestens 12 Zeichen sowie Groß-/Kleinbuchstaben, Zahl und Sonderzeichen; die entsprechende Supabase-Servereinstellung bleibt ein gesonderter Konfigurationsschritt.
- Vier vom Supabase Performance Advisor gemeldete Fremdschlüsselspalten sind jetzt indexiert; danach verbleiben keine Hinweise auf unindexierte Fremdschlüssel.
- Lokaler und Vercel-Produktions-Build, Office-Exportprüfungen, Live-HTTP-Header-Test und öffentliche Kernseiten erfolgreich; `npm audit` meldet 0 bekannte Schwachstellen.
- Produktionsdeployment `dpl_KrZ3Wqa8MzS7yVEszGSANojGeGSP` ist `READY`; die Audit- und Indexmigrationen sind produktiv angewendet und verifiziert.
- Details und verbleibende Freigabeschritte stehen in `docs/V29_SECURITY_STATUS.md`.
- GitHub-Quellstand wieder vollständig baubar; versehentlich gespeicherte Protokoll- und Kürzungsreste entfernt und fehlende V27-Textblöcke wiederhergestellt.
- Öffentliche Testanleitung unter `/testen` mit klarer Vier-Schritt-Führung und ausdrücklicher Echtdaten-Sperre.
- Vollständig synthetisches, visuell und technisch geprüftes Muster-PDF für Upload, Erkennung, Fristen, Beträge und Freigabe.
- Registrierung verlangt mindestens 12 Zeichen, Buchstabe, Zahl, Sonderzeichen, Zeichenvielfalt und keine erkennbaren Namens-/E-Mail-Bestandteile.
- Supabase-Leaked-Password-Protection bleibt wegen des aktuellen Free-Tarifs eine dokumentierte Marktstart-Sperre; es wurde kein kostenpflichtiger Tarifwechsel ausgelöst.
- Details und offene Freigabegrenzen: `docs/V29_IMPLEMENTATION_STATUS.md`.

## V30 – Französisch, Farsi und bereinigte Sprachwahl (30.08.2026)

- Aktive UI- und Ausgabesprachen sind jetzt exakt Deutsch, Englisch, Französisch, Türkisch, Polnisch, Russisch, Arabisch und Farsi.
- Ukrainisch wurde aus aktiven Sprachkatalogen, Auswahlfeldern und Laufzeit-Fallbacks entfernt.
- Französisch und Farsi decken öffentliche Seite, Registrierung/Anmeldung, Arbeitsbereich, Fall- und Dokumentabläufe, Freigaben, Datenschutz, Tariftexte, Systemmeldungen und Exporte ab.
- Farsi setzt wie Arabisch automatisch `lang` und `dir=rtl`; alle übrigen Sprachen bleiben links-nach-rechts.
- Automatischer Katalogtest prüft die vollständige Struktur und Platzhalterparität der französischen und Farsi-Texte sowie das Fehlen ukrainischer Laufzeit-Einträge.
- Browserlauf bestätigt beide neuen Sprachen, RTL, acht Sprachoptionen und eine fehlerfreie Browserkonsole.
- Produktionsdeployment `dpl_8Ax4jwzJ5vQS2etKCJAQqcubG6HK` ist unter `https://app-gold-workspace.vercel.app` `READY`; öffentliche Kernseiten, Sprachpakete und Sicherheitsheader wurden live geprüft.
- Zahlung, Abonnement, automatische Verlängerung und echte Kundendaten bleiben unverändert deaktiviert bzw. gesperrt.
- Details und Verifikation: `docs/V30_IMPLEMENTATION_STATUS.md`.
