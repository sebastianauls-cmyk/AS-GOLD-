import assert from 'node:assert/strict'
import fs from 'node:fs'
import {buildProfessionalHandoff,handoffPriority} from '../app/lib/v40ProfessionalHandoff.mjs'

const full=buildProfessionalHandoff({title:'Testfall',goal:'Zahlung',summary:'Sachstand',deadline:'03.09.2026',nextAction:'Antworten',documents:[{title:'Schreiben',date:'2026-09-01'}],assessments:[{trafficLight:'red',title:'Frist',reasoning:'kurz',nextStep:'prüfen'}],timeline:[{date:'2026-09-03',title:'Frist'},{date:'2026-09-01',title:'Schreiben'}]})
assert.equal(full.ready,true)
assert.equal(full.timeline[0].date,'2026-09-01')
assert.equal(handoffPriority(full.assessments),'red')
const incomplete=buildProfessionalHandoff({summary:'Nur Sachstand'})
assert.equal(incomplete.ready,false)
assert.ok(incomplete.missing.includes('documents'))
assert.ok(incomplete.missing.includes('assessments'))

const component=fs.readFileSync(new URL('../app/components/V40ProfessionalHandoff.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']) assert.match(component,new RegExp(`\\b${language}:\\{`))
assert.match(component,/Professionelle Übergabe/)
assert.match(component,/data-v40-handoff/)
assert.match(component,/jspdf/)
assert.match(component,/docx/)
assert.match(component,/Keine zusätzliche Datenübermittlung/)
assert.match(layout,/V40ProfessionalHandoff/)
console.log('V71 professional handoff guard passed: readiness, priority, local PDF\/DOCX export, privacy note and 11-language UI verified.')
