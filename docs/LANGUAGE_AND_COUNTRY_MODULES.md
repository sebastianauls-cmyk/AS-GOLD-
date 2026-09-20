# Sprach- und Ländermodule erweitern

Stand V154: 11 freigeschaltete Sprachen und 14 eingerichtete Länder. Das ist keine weltweite oder für jedes Rechtsgebiet vollständige Abdeckung. Sprache, Herkunftsland und Land des Falls bleiben unabhängig.

## Neue Sprache

1. Metadaten (Schlüssel, Eigenname, Locale, Schreibrichtung und Flaggen) in `app/modules/language/languageRegistry.mjs` ergänzen. `outputLanguage.js` übernimmt diese Liste automatisch.
2. Vollständiges Übersetzungspaket ergänzen: Oberfläche, öffentliche Erklärung und Beispiele, Rechtsvergleich, Fehler, Einwilligungen und Ausgaben. Die bestehenden Pakete dürfen nicht still als fertig übersetzte neue Sprache ausgegeben werden.
3. Ausgabe-/Sprachnamen in den drei Edge Functions `gold-document-analysis`, `gold-case-roadmap` und `gold-legal-comparison` ergänzen; auch `ROADMAP_LANGUAGES` in `_shared/customerRoadmap.mjs` und die lokalisierten Recherche-Fallbacks ergänzen.
4. Die erlaubten Sprachwerte in der Datenbank per versionierter Migration erweitern (insbesondere `legal_comparisons` und `case_roadmaps`). Keine Zugriffsregel verändern. Backend vor der Freischaltung im Client veröffentlichen.
5. Sprach-, Länder-, Übersetzungs- und Browsertests ausführen. Eine neue Sprache muss mit allen eingerichteten Ländern, zwei unabhängigen Ausgabesprachen und gegebenenfalls RTL funktionieren.

`buildLanguageModules()` erstellt für jede Sprache die Unterstruktur sämtlicher eingerichteter Länder. Die Zuordnung einer Sprache zu einem Land richtet niemals ein neues Rechtsmodul ein. Der Erweiterungstest verwendet Spanisch ausschließlich als Testmodul; Spanisch ist damit nicht in der Produktion freigeschaltet.

## Neues Land

1. Länder-Metadaten und übersetzte Ländernamen in `countryRegistry.mjs` und `countryLabels.mjs` ergänzen.
2. In `gold-legal-comparison` einen amtlichen Quellenkatalog und Hinweise zur Zuständigkeit einrichten. Weitere Länderlisten der Dokumentanalyse sowie der Länderprüfung synchron halten.
3. Aktuelle Primärquellen für die konkrete Frage tatsächlich abrufen und deren Aussagen prüfen. Suchtreffer, Übersetzung oder ein vorhandenes Landesmodul allein sind kein Beleg für eine Rechtsbehauptung.
4. Bundesstaaten, Regionen, Rechtswahl, zuständige Gerichte, Stichtage und fehlende Fakten ausdrücklich berücksichtigen. Fehlende Abdeckung bleibt offen.

Die Ergebnisanzeige unterstützt die nachgewiesenen Prüfprotokolle V138 und V141. Ein nicht eingerichtetes Land darf in der Rechtsvergleichsanzeige nicht als Deutschland erscheinen. Die Kurzansicht zeigt Regeln beider Seiten, praktische Bedeutung, Quellenstand und die tatsächlich gespeicherte Ergebnissprache.

## Abnahme

`npm run build` führt die vorhandenen Funktions- und Integrationsprüfungen aus. `tests/browser` prüft die öffentliche Erklärung in Chromium und WebKit; diese Tests sind kein fachlicher Nachweis eines realen Rechtsvergleichs. Die simulierte Serverprüfung prüft zusätzlich die Übergabe des V141-Ergebnisses an die echte Anzeige-Normalisierung. Ein vollständiger neuer Sprach- oder Länderstand braucht außerdem eine fachliche und sprachliche Abnahme.
