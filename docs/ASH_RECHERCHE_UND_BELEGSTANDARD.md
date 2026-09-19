# ASH – verbindlicher Recherche- und Belegstandard

Vorgabe von Sebastian Auls am 19. September 2026: Es dürfen nur echte, belegte Recherchen verwendet werden; keine von der KI erfundenen Recherchen.

## Tatsachen und Quellen

- Eine Aussage benötigt einen passenden Originalbeleg oder tatsächlich abgerufenen Quelleninhalt. Modellwissen, eine plausible Formulierung und ein erfundener oder lediglich genannter Link sind kein Recherchenachweis.
- Aussagen aus Kundenunterlagen bleiben Aussagen ihrer jeweiligen Urheber. Sie werden nicht allein durch Übernahme in eine Analyse zu unabhängig verifizierten Tatsachen oder geltendem Recht.
- Fehlende Belege führen zu einer konkret benannten offenen Frage. Keine erfundenen Gesetze, Urteile, Studien, Preise, Fristen, Beträge, Absenderrollen oder vorgenommenen Handlungen.
- Dokumentanalyse und Fahrplan führen keine externe Recherche aus. Sie müssen einen erforderlichen externen Nachweis als offen benennen und dürfen ihn nicht aus Modellwissen ergänzen.
- Die Rechtsraumrecherche verlangt eine abgeschlossene Websuche, passende amtliche Quellen, den tatsächlichen Abruf lesbaren Quelleninhalts und eine Gegenprüfung der Aussagen gegen diesen Inhalt. Abrufzeit, endgültige URL, Textauszug und dessen SHA-256 werden gespeichert. Kürzungen bleiben gekennzeichnet. Nicht lesbare, nicht zulässige oder nicht tragende Quellen begründen keine Behauptung.
- Frühere Rechercheergebnisse ohne diesen Nachweis bleiben als erneut zu prüfen erkennbar. Ihre ungeprüften Aussagen werden nicht als aktuelles Rechercheergebnis dargestellt. Der historische Datensatz wird dabei nicht gelöscht.

## Originaltreue und Handlung

- Digitale TXT-/CSV-Originaltexte werden unabhängig vom Modell dekodiert und unverändert übernommen. UTF-8 und ausdrücklich durch BOM gekennzeichnetes UTF-16 sind unterstützt. Eine nicht eindeutig lesbare Kodierung führt zu einer klaren Fehlermeldung.
- Bei anderen Dokumentformaten darf eine Transkription nicht leer sein oder durch Modellkommentar ersetzt werden; die Gegenprüfung bezieht die übergebene Datei ein. Das ist keine Garantie fehlerfreier Texterkennung.
- Eine bestätigte Teilaussage bleibt bestätigt, auch wenn ein späterer Satz eine andere Aussage einschränkt. Zitatgleichheit ersetzt keine inhaltliche Prüfung.
- Rot benötigt eine belegte dringliche Frist oder laufende konkrete Gefahr. Fehlende Unterlagen und der erste Arbeitsschritt begründen allein keine Dringlichkeit.
- Bei ungeklärter Absenderrolle, Gegenüber oder Zweck wird kein fertiges Antwortschreiben aus einer angenommenen Rolle erzeugt. Frühere Empfänger-/Betreffwerte dürfen nach erneuter Analyse nicht als vermeintlich bestätigte Daten stehen bleiben.

## Technische Durchsetzung in V138

1. Erzeugen, Originaltext übernehmen und Struktur-/Belegregeln prüfen.
2. Inhaltliche Gegenprüfung anhand derselben Originale beziehungsweise tatsächlich abgerufener Recherchetexte.
3. Für Dokumentanalyse und Fahrplan höchstens ein Korrekturlauf, danach erneut beide Prüfungen.
4. Keine Speicherung eines Analyseergebnisses, wenn die Gegenprüfung scheitert oder ausfällt. Der Rechtsraumvergleich wird bei unzureichender Quellenstützung ebenfalls nicht gespeichert.
5. Eigentümerprüfung, RLS, vorhandene Verarbeitungsfreigaben und Versandfreigaben bleiben verbindlich. Diese Prüfungen erteilen keine Versand-, Vertretungs- oder Veröffentlichungsvollmacht für Kundenangelegenheiten.

Die Modellgegenprüfung reduziert Fehler, ist aber selbst fehlbar. Sie ersetzt weder einen Originalbeleg noch eine unabhängige fachliche Abnahme. Synthetische Regressionen sind ausschließlich Tests und dürfen niemals als echte Fallrecherche ausgegeben werden.

## Wiederholbare Prüfung

- `npm run test:ai-evidence-quality`: 104 Originaltexte, Rollenbegrenzung, begrenzte Korrektur, fehlgeschlagene Gegenprüfung, Zeitbudget, echte Suchprovenienz, zulässige amtliche Abrufe und Kodierung.
- `npm run test:v136-roadmap`: bestehende Beleg-, Frist-, Eigentümer-, Ablauf- und Exportprüfungen.
- `npm run test:v131-legal-comparison`: Länder-/Quellenzuordnung, Umgang mit älteren ungeprüften Ergebnissen und bestehende Ausgaben.
- `scripts/build_ai_evaluation.mjs`: übernimmt die tatsächlichen Modellblöcke aus den produktiven Funktionen in eine getrennte synthetische Prüfung. Es werden keine zweiten Test-Prompts gepflegt und keine Kundenanmeldung nachgebildet.
- Echte Modell- und Rechercheprüfungen werden gesondert mit Response-IDs, Prüfausgaben und Bereitstellungsstand dokumentiert. Lokale Modellattrappen zählen nicht als echte KI-Abnahme.
