import assert from 'node:assert/strict'
import fs from 'node:fs'
import {analyzeDeadlines,deadlineUrgency,extractDeadlineDates,parseGermanDate} from '../app/lib/v38DeadlineIntelligence.mjs'

const now=new Date('2026-09-01T10:00:00Z')

assert.equal(parseGermanDate('Bitte bis zum 03.09.2026 antworten.').toISOString().slice(0,10),'2026-09-03')
assert.equal(parseGermanDate('Ungültig 31.02.2026'),null)
assert.equal(deadlineUrgency(new Date('2026-09-02T12:00:00Z'),now).level,'immediate')
assert.equal(deadlineUrgency(new Date('2026-09-07T12:00:00Z'),now).level,'high')
assert.equal(deadlineUrgency(new Date('2026-09-20T12:00:00Z'),now).level,'normal')

const urgent=analyzeDeadlines({text:'Ihre Stellungnahme muss bis 03.09.2026 eingehen.',now})
assert.equal(urgent.status,'immediate')
assert.equal(urgent.primary.source,'document')
assert.equal(urgent.primary.confidence,'high')
assert.match(urgent.primary.basis,/Fristbezug/)
assert.match(urgent.consequence,/prüf/)

const ordinaryDate=analyzeDeadlines({text:'Die Besprechung findet am 03.09.2026 statt.',now})
assert.equal(ordinaryDate.status,'uncertain')
assert.equal(ordinaryDate.primary,null)

const documentDate=analyzeDeadlines({text:'Stellungnahme vom 03.09.2026. Inhalt folgt.',now})
assert.equal(documentDate.status,'uncertain')
assert.equal(documentDate.primary,null)

const dueDate=analyzeDeadlines({text:'Der Betrag ist fällig am 06.09.2026.',now})
assert.equal(dueDate.status,'high')
assert.equal(dueDate.primary.date,'2026-09-06')

const mixed=extractDeadlineDates('Dokumentdatum 01.09.2026. Besprechung am 02.09.2026. Ihre Antwort muss spätestens bis 05.09.2026 eingehen.')
assert.equal(mixed.length,1)
assert.equal(mixed[0].date.toISOString().slice(0,10),'2026-09-05')

const caseWins=analyzeDeadlines({text:'Weitere Besprechung am 20.09.2026.',caseDeadline:'2026-09-05',now})
assert.equal(caseWins.primary.date,'2026-09-05')
assert.equal(caseWins.primary.source,'case')

const multipleDeadlines=analyzeDeadlines({text:'Zahlung bis 08.09.2026. Stellungnahme bis 04.09.2026.',now})
assert.equal(multipleDeadlines.primary.date,'2026-09-04')
assert.equal(multipleDeadlines.candidates,2)

const noDeadline=analyzeDeadlines({text:'Dieses Schreiben enthält kein konkretes Fristdatum.',now})
assert.equal(noDeadline.status,'uncertain')
assert.equal(noDeadline.primary,null)
assert.match(noDeadline.message,/Keine sichere Frist/)
assert.match(noDeadline.consequence,/Keine Rechtsfolge behauptet/)

const card=fs.readFileSync(new URL('../app/components/V38DeadlineCardEnhancer.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
assert.match(card,/Fristen-Warnung/)
assert.match(card,/Mögliche Folge/)
assert.match(card,/Jetzt tun/)
assert.match(card,/data-v38-deadline-card/)
assert.match(card,/data-v38-deadline-mode/)
assert.match(card,/readDocumentText/)
assert.match(card,/documentReviewForm/)
assert.match(card,/documentBasis/)
assert.match(card,/cImmediate/)
assert.match(card,/cUncertain/)
assert.match(card,/de:.*Fristen-Warnung/)
for(const language of ['en','fr','tr','pl','ru','ar','fa','ro','bg']) assert.match(card,new RegExp(`${language}:\\{`))
assert.match(layout,/V38DeadlineCardEnhancer/)

console.log('V38 deadline intelligence guard passed: semantic deadline cues, false-positive rejection, document-view wiring, localized consequences, prioritization and uncertainty verified.')
