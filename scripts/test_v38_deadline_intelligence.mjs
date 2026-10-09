import assert from 'node:assert/strict'
import fs from 'node:fs'
import {analyzeDeadlines,deadlineUrgency,extractDeadlineDates,parseGermanDate} from '../app/modules/lib/deadlineIntelligence.mjs'

const now=new Date('2026-09-01T10:00:00Z')
assert.equal(parseGermanDate('Bitte bis zum 03.09.2026 antworten.').toISOString().slice(0,10),'2026-09-03')
assert.equal(parseGermanDate('Ungültig 31.02.2026'),null)
assert.equal(deadlineUrgency(new Date('2026-09-02T12:00:00Z'),now).level,'immediate')
assert.equal(deadlineUrgency(new Date('2026-09-07T12:00:00Z'),now).level,'high')
assert.equal(deadlineUrgency(new Date('2026-09-20T12:00:00Z'),now).level,'normal')
const urgent=analyzeDeadlines({text:'Ihre Stellungnahme muss bis 03.09.2026 eingehen.',now});assert.equal(urgent.status,'immediate');assert.equal(urgent.primary.source,'document');assert.equal(urgent.primary.confidence,'high');assert.match(urgent.primary.basis,/Fristbezug/);assert.match(urgent.consequence,/prüf/)
const ordinaryDate=analyzeDeadlines({text:'Die Besprechung findet am 03.09.2026 statt.',now});assert.equal(ordinaryDate.status,'uncertain');assert.equal(ordinaryDate.primary,null)
const documentDate=analyzeDeadlines({text:'Stellungnahme vom 03.09.2026. Inhalt folgt.',now});assert.equal(documentDate.status,'uncertain');assert.equal(documentDate.primary,null)
const dueDate=analyzeDeadlines({text:'Der Betrag ist fällig am 06.09.2026.',now});assert.equal(dueDate.status,'high');assert.equal(dueDate.primary.date,'2026-09-06')
const mixed=extractDeadlineDates('Dokumentdatum 01.09.2026. Besprechung am 02.09.2026. Ihre Antwort muss spätestens bis 05.09.2026 eingehen.');assert.equal(mixed.length,1);assert.equal(mixed[0].date.toISOString().slice(0,10),'2026-09-05')
const caseWins=analyzeDeadlines({text:'Weitere Besprechung am 20.09.2026.',caseDeadline:'2026-09-05',now});assert.equal(caseWins.primary.date,'2026-09-05');assert.equal(caseWins.primary.source,'case')
const multipleDeadlines=analyzeDeadlines({text:'Zahlung bis 08.09.2026. Stellungnahme bis 04.09.2026.',now});assert.equal(multipleDeadlines.primary.date,'2026-09-04');assert.equal(multipleDeadlines.candidates,2)
const noDeadline=analyzeDeadlines({text:'Dieses Schreiben enthält kein konkretes Fristdatum.',now});assert.equal(noDeadline.status,'uncertain');assert.equal(noDeadline.primary,null);assert.match(noDeadline.message,/Keine sichere Frist/);assert.match(noDeadline.consequence,/Keine Rechtsfolge behauptet/)

// A confirmed past receipt must not overtake a separate, actual payment date.
const receiptDate=new Date('2026-10-08T12:00:00Z')
const receipt='Wir bestätigen den Eingang Ihrer Teilzahlung von 300,00 EUR am 05.10.2026.'
for(const text of [receipt,'Der Eingang Ihres Antrags am 05.10.2026 ist bestätigt.','Eingang: 05.10.2026.']){
  assert.equal(analyzeDeadlines({text,now:receiptDate}).primary,null,'a receipt date alone is not a deadline')
}
const paymentDate=analyzeDeadlines({text:receipt+' Bitte zahlen Sie den noch offenen Rechnungsbetrag bis zum 16.10.2026.',now:receiptDate})
assert.equal(paymentDate.primary.date,'2026-10-16')
assert.equal(paymentDate.status,'normal')
assert.equal(paymentDate.candidates,1)
assert.equal(analyzeDeadlines({text:receipt,caseDeadline:'2026-10-05',now:receiptDate}).status,'overdue','an explicit case deadline must remain active')
for(const text of ['Bitte bestätigen Sie den Eingang bis spätestens 16.10.2026.','Eingang der Unterlagen bis 16.10.2026.','Ihre Stellungnahme muss bis 16.10.2026 eingehen.']){
  assert.equal(analyzeDeadlines({text,now:receiptDate}).primary.date,'2026-10-16','explicit receipt deadlines remain recognized')
}

// Regression from an actual synthetic browser upload: the billing period
// must not overtake the supplier's payment date as an overdue deadline.
for(const label of ['Abrechnungszeitraum','Abrechnungsperiode','Leistungszeitraum','Verbrauchszeitraum','Versicherungszeitraum','Bewilligungszeitraum','Vertragslaufzeit','Zeitraum']){
  const period=`${label}: 01.08.2025 bis 31.07.2026`
  assert.equal(analyzeDeadlines({text:period,now:receiptDate}).primary,null,`${label} is a period, not a deadline`)
  const bill=analyzeDeadlines({text:`${period}\nIn der Rechnung genannter Zahlungstermin: 16.10.2026`,now:receiptDate})
  assert.equal(bill.primary.date,'2026-10-16');assert.equal(bill.candidates,1)
}
for(const label of ['Zahlungstermin','Zahlungsfrist','Zahlungsziel','Fälligkeitsdatum','Fälligkeit']){
  assert.equal(analyzeDeadlines({text:`${label}: 16.10.2026`,now:receiptDate}).primary.date,'2026-10-16')
  const wrapped=analyzeDeadlines({text:`${label}:\n16.10.2026`,now:receiptDate})
  assert.equal(wrapped.primary.date,'2026-10-16')
  assert.equal(wrapped.primary.context,`${label}:\n16.10.2026`,'line-wrapped source evidence remains verbatim')
}
for(const period of ['Abrechnungszeitraum:\n01.08.2025 bis 31.07.2026','Abrechnungszeitraum: 01.08.2025\nbis 31.07.2026','Abrechnungszeitraum:\r\nvom 01.08.2025 bis einschließlich\r\n31.07.2026']){
  assert.equal(analyzeDeadlines({text:period,now:receiptDate}).primary,null,'a PDF line break must not turn a period into a deadline')
  assert.equal(analyzeDeadlines({text:`${period}\nZahlungstermin:\n16.10.2026`,now:receiptDate}).primary.date,'2026-10-16')
}
assert.equal(analyzeDeadlines({text:'Abrechnungszeitraum 01.08.2025 bis 31.07.2026, bitte zahlen Sie bis 16.10.2026.',now:receiptDate}).primary.date,'2026-10-16','a separate deadline in the same sentence remains active')
assert.equal(analyzeDeadlines({text:'Unterlagen zum Abrechnungszeitraum bitte bis 16.10.2026 einreichen.',now:receiptDate}).primary.date,'2026-10-16','a period keyword must not suppress an actual deadline')
assert.equal(analyzeDeadlines({text:'Besprechung vom 03.10.2026 bis 05.10.2026.',now:receiptDate}).primary,null)
assert.equal(analyzeDeadlines({text:'Frist bis 05.10.2026.',now:receiptDate}).status,'overdue','actual overdue deadlines remain visible')

const card=fs.readFileSync(new URL('../app/modules/cases/DeadlineCard.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
const directCases=fs.readFileSync(new URL('../app/modules/cases/CaseWorkspace.js',import.meta.url),'utf8')
assert.match(card,/Fristen-Warnung/);assert.match(card,/Mögliche Folge/);assert.match(card,/Jetzt tun/);assert.match(card,/data-v38-deadline-card/);assert.match(card,/data-v38-deadline-mode/);assert.match(card,/DeadlineWarningCard/);assert.doesNotMatch(card,/MutationObserver|document\.createElement|querySelector|innerHTML/)
assert.match(directCases,/DeadlineWarningCard language=\{language\} caseDeadline=\{item\.deadline_at/);assert.match(directCases,/DeadlineWarningCard language=\{language\} text=\{draft\.extracted_text\}/)
assert.match(card,/documentBasis/);assert.match(card,/cImmediate/);assert.match(card,/cUncertain/);assert.match(card,/de:.*Fristen-Warnung/)
for(const language of ['en','fr','tr','pl','ru','ar','fa','ro','bg']) assert.match(card,new RegExp(`${language}:\\{`))
assert.doesNotMatch(layout,/V38DeadlineCardEnhancer/)
console.log('V80 deadline intelligence guard passed against canonical version-neutral modules.')
