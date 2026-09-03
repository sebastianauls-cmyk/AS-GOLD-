import assert from 'node:assert/strict'
import fs from 'node:fs'
import {autoDocumentAssessment,sortTimelineEntries} from '../app/modules/lib/v39CaseIntelligence.mjs'
const red=autoDocumentAssessment('Zahlungsaufforderung. Die Widerspruchsfrist ist versäumt.',{status:'immediate',primary:{date:'2026-09-03'}});assert.equal(red.trafficLight,'red');assert.match(red.reason,/Frist 2026-09-03/);assert.match(red.nextStep,/sofort/i)
const green=autoDocumentAssessment('Der Antrag wurde bewilligt und bestätigt.',{status:'uncertain',primary:null});assert.equal(green.trafficLight,'green')
const unknown=autoDocumentAssessment('',null);assert.equal(unknown.trafficLight,'yellow');assert.equal(unknown.confidence,'low')
const timeline=sortTimelineEntries([{date:'2026-09-10',title:'B'},{date:'2026-09-03',title:'A'}]);assert.deepEqual(timeline.map(entry=>entry.title),['A','B'])
const component=fs.readFileSync(new URL('../app/modules/cases/CaseTimelineAutoAssessment.js',import.meta.url),'utf8')
const compatibility=fs.readFileSync(new URL('../app/components/V39CaseTimelineAutoAssessment.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
const directCases=fs.readFileSync(new URL('../app/modules/cases/CaseWorkspace.js',import.meta.url),'utf8')
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg']) assert.match(component,new RegExp(`\\b${language}:\\{`))
assert.match(component,/Automatische Dokument-Ampel/);assert.match(component,/Vorläufig – Original prüfen/);assert.match(component,/Fall-Timeline/);assert.match(component,/data-v39-auto-assessment/);assert.match(component,/data-v39-timeline/);assert.match(component,/analyzeDeadlines/);assert.match(compatibility,/modules\/cases\/V39CaseTimelineAutoAssessment/);assert.doesNotMatch(layout,/V39CaseTimelineAutoAssessment/);assert.match(component,/DocumentAutoAssessment/);assert.match(component,/CaseTimeline/);assert.doesNotMatch(component,/MutationObserver|document\.createElement|querySelector|innerHTML|setInterval/);assert.match(directCases,/DocumentAutoAssessment language=\{language\}/);assert.match(directCases,/CaseTimeline language=\{language\}/)
console.log('V80 case intelligence guard passed against version-neutral domain modules.')
