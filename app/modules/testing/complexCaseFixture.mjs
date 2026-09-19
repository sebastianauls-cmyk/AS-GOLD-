// Fully fictional regression data. No names, identifiers, amounts or dates from
// customer records. Two separate cases deliberately share a logical incident.
export const complexCaseToday = new Date('2026-07-10T12:00:00Z')
export const complexTestCases = [
  {id:'fixture-insurance',owner_id:'fixture-owner',title:'TEST · Betriebsunterbrechung',goal:'Zahlungen und offene Forderungen trennen',summary:'Frei erfundener Gastronomiebetrieb nach einem Sachschaden.',next_action:'Abrechnung anhand der Belege prüfen'},
  {id:'fixture-property',owner_id:'fixture-owner',title:'TEST · Wiederherstellung der Räume',goal:'Leistungsumfang und Übergabe klären',summary:'Separater Vermieter-/Reparaturvorgang desselben fiktiven Betriebs.',next_action:'Auftrag, Anschlussarbeiten und Übergabe nachweisen'}
]
function doc(id,caseIndex,title,document_date,extracted_text) {
  return {id,case_id:complexTestCases[caseIndex].id,owner_id:'fixture-owner',title,document_date,extracted_text,data_classification:'synthetic',created_at:'2026-07-09T10:00:00Z',updated_at:'2026-07-09T10:00:00Z'}
}
export const complexTestDocuments = [
  doc('fixture-payment',0,'TEST · Abrechnung','2026-05-07',
    'Schreiben vom 07.05.2026. Abschlagszahlung: 4.800,00 EUR. Weitere Überweisung: 7.320,00 EUR. Beitragsverrechnung: 180,00 EUR. Abgerechnet sind 12.300,00 EUR. Die Überweisungen ergeben 12.120,00 EUR. Sachverständigenkosten: 2.300,00 EUR; Zahlung an den Sachverständigen, nicht an den Betrieb.'),
  doc('fixture-demand',0,'TEST · Vorläufige Nachforderung','2026-05-12',
    'Schreiben vom 12.05.2026, weitergeleitet am 20.06.2026. Vorläufig gefordert werden zusätzlich 31.500,00 EUR Betriebsunterbrechung und 42.000,00 EUR Inventar, zusammen 73.500,00 EUR. Die Forderung wurde nicht vollständig gezahlt. Ein Anerkenntnis liegt nicht vor. Bitte antworten Sie innerhalb von zehn Tagen nach Zugang; das Zugangsdatum ist nicht bekannt.'),
  doc('fixture-report',0,'TEST · Gutachten-Auszug','2026-04-20',
    'Gutachten vom 20.04.2026. Vorgelegt sind nur die Seiten 3 bis 9 von 9; Seiten 1 und 2 fehlen. Rechenansatz: 160.000,00 EUR Sollumsatz minus 80.000,00 EUR Istumsatz = 80.000,00 EUR; davon 62,5 Prozent = 50.000,00 EUR; abzüglich 37.700,00 EUR ersparte Kosten = 12.300,00 EUR. Die Monatsaufstellung enthält beide Randmonate des Zeitraums 11.02.2023 bis 11.02.2024; Tagesabgrenzung prüfen.'),
  doc('fixture-mitigation',0,'TEST · Erklärung zu Umsätzen','2026-05-15',
    'Der Restaurantbetrieb wurde am 18.06.2023 geschlossen. Spätere Umsätze stammen laut Betreiber aus einem mobilen Verkaufswagen zur Schadenminderung. Daraus folgt keine bestätigte Wiedereröffnung des Restaurants. Mietbelege für den Verkaufswagen fehlen.'),
  doc('fixture-old-deadline',0,'TEST · Historische Antwortfrist','2026-05-17',
    'Wir bitten um Ihre Antwort bis 29.05.2026. Ob fristgerecht geantwortet wurde, ist nicht bekannt.'),
  doc('fixture-tender',1,'TEST · Leistungsverzeichnis','2026-07-03',
    'Leistungsverzeichnis vom 03.07.2026. Der technische Umfang der Lüftungsreparatur ist bestätigt. Angebot noch ohne Preise; die Arbeiten sind noch nicht beauftragt. Elektroanschluss und Steuerung sind nicht enthalten. Fertigstellung und Übergabe sind nicht bestätigt.'),
  doc('fixture-lease',1,'TEST · Unvollständiger Nachtrag','2025-11-04',
    'Nachtrag, nur Seite 5 von 5 vorgelegt. Unterschrift des Mieters vom 04.11.2025; Unterschriftenfeld des Vermieters leer. Seiten 1 bis 4 fehlen. Daraus allein folgt keine Aussage über den vollständigen Vertrag oder seine Wirksamkeit.'),
  doc('fixture-undated',1,'TEST · Undatierte Notiz',null,
    'Die Übergabe ist nicht bestätigt. Ein Datum dieser Notiz ist nicht bekannt.')
]

// Review oracle, NOT precomputed AI output. These points must be checked again
// against an actual model run once an authorised test session is available.
export const complexCaseAcceptance = [
  'Zwei getrennte Anspruchsgegner/Teilfälle; keine fremden Fallunterlagen einbeziehen.',
  '12.120,00 EUR Überweisungen, 180,00 EUR Verrechnung und 12.300,00 EUR Abrechnung unterscheiden; keine Doppelzählung.',
  '73.500,00 EUR sind eine vorläufige zusätzliche Forderung, kein Anerkenntnis und keine Zahlung.',
  '2.300,00 EUR Sachverständigenkosten sind keine Zahlung an den Betrieb.',
  'Fehlende Gutachten- und Vertragsseiten benennen; keine vollständige Prüfung behaupten.',
  'Ein Leistungsverzeichnis belegt weder Beauftragung noch Fertigstellung oder Übergabe; ausgeschlossene Anschlussarbeiten bleiben offen.',
  'Originaldatum, Weiterleitung und Upload getrennt halten; undatierte Notiz nicht als neues Ereignis ausgeben.',
  'Ohne Zugangsnachweis kein Kalenderdatum aus einer relativen Frist errechnen; historische Frist nicht als neue Frist behandeln.',
  'Umsätze aus Schadenminderung nicht mit Wiedereröffnung verwechseln; Mietbelege bleiben offen.',
  'Teilzahlungen, alternative Anspruchsgegner und Zeiträume nicht addieren, ohne Überschneidungen zu prüfen.'
]
