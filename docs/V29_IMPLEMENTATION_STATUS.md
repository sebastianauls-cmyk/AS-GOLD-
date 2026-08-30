# AS Gold V29 - sicherer Testerbetrieb und Quellstand-Reparatur

Stand: 30. August 2026

## Ergebnis

V29 stellt den vollstaendig baubaren V28-Quellstand wieder her und macht den
kontrollierten Test fuer externe Tester praktisch nutzbar. Dazu gehoeren eine
oeffentliche Testanleitung, ein geprueftes synthetisches Muster-PDF und deutlich
staerkere Passwortanforderungen in der Registrierung.

V29 bleibt ein kostenloser Testbetrieb. Zahlungen, Abonnements, automatische
Verlaengerungen und echte personenbezogene Kundendaten bleiben deaktiviert bzw.
gesperrt.

## Behobene Quellstand-Abweichung

- In `app/page.js` waren im GitHub-Hauptstand zwei Ausgabezeilen eines
  Arbeitsprotokolls und ein abgeschnittener mehrsprachiger Quellblock gespeichert.
- Die laufende V28-Produktion war davon nicht betroffen, aber ein neuer Build aus
  GitHub waere fehlgeschlagen.
- Die unbeschaedigten V27-Sprach-, Transparenz-, Empfehlungs- und Fallauswahltexte
  wurden exakt wieder eingesetzt.
- Die V28-Datenschutz-, Rechts-, Widerrufs- und Freigabefunktionen bleiben
  unveraendert erhalten.
- Der vollstaendige Produktions-Build erzeugt wieder alle Routen fehlerfrei.

## Testerfuehrung

- Neue oeffentliche Seite `/testen` mit einem klaren Vier-Schritt-Ablauf.
- Deutliche Sperre fuer echte Namen, Anschriften, Vertraege, Gesundheitsdaten,
  Ausweise, Bankdaten und sonstige Daten realer Personen.
- Testcheckliste fuer Registrierung, Mobilansicht, Sprachen, Fallanlage, Upload,
  KI-Vorschlag, manuelle Korrektur, Freigabe, Export und Datenkontrollen.
- Rueckmeldeweg ohne Uploadinhalte oder Zugangsdaten.
- Testseite ist von Startseite und Footer erreichbar.

## Synthetische Musterdatei

- Datei: `public/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf`
- Alle Namen, Nummern, Betraege, Daten und Ereignisse sind frei erfunden.
- Enthaltene Prueffelder: Absender, Empfaenger, zwei Referenzen, Dokumentdatum,
  Frist, Einzelbetraege, Gesamtbetrag, Sachverhalt, Beweisstatus und offener Punkt.
- PDF-Generator ist reproduzierbar unter
  `scripts/generate_v29_test_pdf.py` abgelegt.
- PDF-Pruefung: A4, eine Seite, nicht verschluesselt, kein JavaScript, vollstaendig
  extrahierbarer Text und visuell ohne Ueberlagerung oder abgeschnittene Inhalte.

## Passwortschutz

- Registrierung verlangt nun mindestens 12 Zeichen.
- Erforderlich sind Buchstabe, Zahl, Sonderzeichen und mindestens acht
  unterschiedliche Zeichen.
- Name, laengere E-Mail-Bestandteile und eine lokale Liste haeufiger
  Testpasswoerter werden abgewiesen.
- Die Anforderungen und die Uebereinstimmung beider Eingaben werden live und
  barrierearm angezeigt; die Registrierung bleibt bis zur vollstaendigen
  Erfuellung deaktiviert.
- Die serverseitige Supabase-Funktion fuer bekannte kompromittierte Passwoerter
  bleibt eine Marktstart-Sperre: Sie ist laut aktueller Supabase-Dokumentation erst
  ab dem Pro-Tarif verfuegbar. Das Projekt befindet sich im Free-Tarif; V29 loest
  deshalb keinen kostenpflichtigen Tarifwechsel aus.

## Verifikation vor Veroeffentlichung

- `npm ci`: erfolgreich.
- `npm run test:v29-password`: sechs Positiv-/Negativfaelle erfolgreich.
- `npm run build`: erfolgreich mit Next.js 15.5.24.
- 14 statische Routen erzeugt, einschliesslich `/testen`.
- Verwundbare Exportabhaengigkeiten bereinigt: `jsPDF` auf 4.2.1 aktualisiert und
  das nicht mehr sicher wartbare `xlsx` durch `write-excel-file` 4.1.1 ersetzt.
- Die von Next.js 15 mitgebrachte verwundbare PostCSS-Version wird kompatibel auf
  8.5.26 ueberschrieben; der vollstaendige Produktions-Build bleibt erfolgreich.
- PDF mit Poppler gerendert, Text extrahiert und visuell kontrolliert.
- Supabase-Projektstatus: `ACTIVE_HEALTHY`.
- Supabase Auth: E-Mail-Bestaetigung aktiv; anonyme Anmeldung deaktiviert.
- Supabase Security Advisor: Warnung zur deaktivierten Leaked-Password-Protection
  bleibt nachvollziehbar offen.

## Weiter offene Freigaben

1. Authentifizierter End-to-End-Test nach Klick auf einen echten
   E-Mail-Bestaetigungslink.
2. Physischer Test auf mindestens einem realen Android- und einem iOS-Geraet.
3. Supabase Pro oder eine andere belastbare serverseitige Loesung fuer die
   Pruefung kompromittierter Passwoerter vor Marktstart entscheiden.
4. AV-Vertraege, Unterauftragsverarbeiter, Drittlandbewertung und gegebenenfalls
   Datenschutz-Folgenabschaetzung dokumentieren.
5. Rechtstexte vor Bezahl- oder Echtdatenbetrieb fachanwaltlich pruefen lassen.

## Freigabegrenze

V29 ist fuer externe Produkttests mit dem bereitgestellten Muster-PDF oder anderen
vollstaendig synthetischen Daten vorgesehen. Es ist keine Freigabe fuer reale
Kundenfaelle, besonders sensible Daten oder zahlungspflichtige Angebote.
