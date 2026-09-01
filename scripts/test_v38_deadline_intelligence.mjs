import assert from 'node:assert/strict'
import {analyzeDeadlines,deadlineUrgency,parseGermanDate} from '../app/lib/v38DeadlineIntelligence.mjs'

const now=new Date('2026-09-01T10:00:00Z')

assert.equal(parseGermanDate('Bitte bis zum 03.09.2026 antworten.').toISOString().slice(0,10),'2026-09-03')
assert.equal(parseGermanDate('Ungültig 31.02.2026'),null)
assert.equal(deadlineUrgency(new Date('2026-09-02T12:00:00Z'),now).level,'immediate')
assert.equal(deadlineUrgency(new Date('2026-09-07T12:00:00Z'),now).level,'high')
assert.equal(deadlineUrgency(new Date('2026-09-20T12:00:00Z'),now).level,'normal')

const urgent=analyzeDeadlines({text:'Ihre Stellungnahme muss bis 03.09.2026 eingehen.',now})
assert.equal(urgent.status,'immediate')
assert.equal(urgent.primary.source,'document')
assert.equal(urgent.primary.confidence,'medium')
assert.match(urgent.consequence,/prüf/)

const caseWins=analyzeDeadlines({text:'Weitere Besprechung am 20.09.2026.',caseDeadline:'2026-09-05',now})
assert.equal(caseWins.primary.date,'2026-09-05')
assert.equal(caseWins.primary.source,'case')

const noDeadline=analyzeDeadlines({text:'Dieses Schreiben enthält kein konkretes Fristdatum.',now})
assert.equal(noDeadline.status,'uncertain')
assert.equal(noDeadline.primary,null)
assert.match(noDeadline.message,/Keine sichere Frist/)
assert.match(noDeadline.consequence,/Keine Rechtsfolge behauptet/)

console.log('V38 deadline intelligence guard passed: prioritization, uncertainty and conservative consequence wording verified.')
