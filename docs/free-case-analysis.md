# Kostenloser interner Analysemodus

Interne, aktive und freigegebene Chef-/Teamkonten öffnen Fälle zunächst im kostenlosen Modus. Die Berechtigungen stammen aus dem vorhandenen `current_gold_access`-Ergebnis. Kundentarife und Datenbankrechte werden nicht verändert.

Die Auswertung arbeitet im Browser ausschließlich mit den bereits geladenen, zum Fall und Eigentümer gehörenden Dokumenttexten. Sie sendet keine KI-Anfrage, startet keinen Hintergrundauftrag und ruft keine automatische Dokumenterkennung auf. Die vorhandenen KI-Budgets und Verarbeitungssperren bleiben wirksam. Ein Wechsel zur bisherigen KI-Auswertung ist ausdrücklich und benötigt anschließend deren bisherige Einwilligung.

Der erste Umfang ist eine deutschsprachige Dokumentprüfung: Textbestand, klar erkennbare EUR-Tabellen, Brutto-/Netto-Rechenproben, Summen und ausdrücklich angegebene Bruchteile sowie zitierte offene Angaben und genannte Kalenderdaten. Rechenproben arbeiten in Cent. Unklare Spalten erhalten keine erfundenen Personennamen. Unbekannte Abzüge und nicht unterstützte Tabellen werden nicht als erfolgreich geprüft ausgegeben. Ein fehlendes Zugangsdatum erzeugt insbesondere keine berechnete Widerspruchsfrist.

Bei negativen Abzugszeilen bleibt die Brutto-/Netto-Prüfung ausdrücklich offen: Ein Minuszeichen allein unterscheidet keinen vorzeichenbehafteten Abzug von einer Erstattung. Anzeige und Export erklären diese Grenze mit der Originalzeile. Teilungen runden positive und negative halbe Cent symmetrisch vom Nullpunkt weg, entsprechend dem vorhandenen exakten Rechenmodul. Eindeutige Verneinungen wie „Es fehlen keine Unterlagen“ erzeugen keine offene Angabe; ein tatsächlich ungeklärter Punkt in einem weiteren Satzteil bleibt erkennbar.

Die Anzeige und Word/PDF-Exporte kennzeichnen den Umfang: keine KI-Analyse, keine neue Rechtsrecherche, keine rechtliche Gesamtbewertung. Grün bedeutet nur vorhandenen Text bzw. eine passende Rechenprobe. Dokumenttexte können selbst bereits fehlerhaft oder früher maschinell extrahiert worden sein; deshalb bleiben Fundstellen zum Abgleich sichtbar.

Ergebnisse bleiben für die aktuelle Ansicht im Arbeitsspeicher. Ändern sich die Quellen, wird das alte Ergebnis einschließlich Export verborgen. Beim erneuten Öffnen eines Falls wird mit einem Klick aus den gespeicherten Texten neu gerechnet. Word/PDF können heruntergeladen werden. Kein Ergebnis überschreibt einen KI-Fahrplan oder markiert den Fall als erledigt.

Grenzen: 30 Dokumente und 120.000 Zeichen je Dokument. Überschreitungen werden sichtbar gemeldet; bei gekürzten Dokumenten findet keine Rechenprüfung statt. Oberfläche und Bericht sind auf Deutsch bzw. Englisch verfügbar; die Texterkennungsregeln dieser ersten Version sind ausdrücklich für Deutsch und deutsche EUR-Zahlenformate bestimmt.

Die ausschließlich erfundene Sarah-Testakte liefert acht Rechenproben: zwei Auszahlungsbeträge, zwei Bruttosummen, zwei Teilungen durch 120 und zwei Beitragssummen. Eine absichtlich um 100 EUR geänderte Auszahlung wird als Abweichung erkannt. Keine API-Anfrage ist dafür erforderlich. Das ersetzt nicht den bisher ausstehenden vollständigen KI-Fallabschluss.

Prüfung: `node scripts/test_free_case_analysis.mjs` sowie zwei Browserfälle in der bestehenden isolierten Fallansicht. Die Browserfälle prüfen kostenlosen Standardmodus, null Funktionsaufrufe, Downloads, geänderte Quellen und mobile Darstellung. Produktionsdaten werden dabei nicht verändert.
