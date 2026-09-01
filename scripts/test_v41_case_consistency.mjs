import assert from 'node:assert/strict'
import fs from 'node:fs'
import { analyzeCaseConsistency } from '../app/lib/v41CaseConsistency.mjs'

const result=analyzeCaseConsistency({
  caseItem:{title:'Test',goal:'Zahlung prüfen',summary:'Zwei Schreiben liegen vor',deadline_at:'2026-09-10',next_action:'Antwort vorbereiten'},
  documents:[
    {title:'Schreiben A',extracted_text:'Die Forderung beträgt 1.000,00 EUR. Zahlung bis 10.09.2026.'},
    {title:'Schreiben B',extracted_text:'Die Forderung beträgt 1.250,00 EUR. Zahlung bis 12.09.2026.'}
  ],
  assessments:[{traffic_light:'yellow',next_step:'Beträge prüfen'}]
})
assert.equal(result.gaps.length,0)
assert.ok(result.deviations.some(x=>x.concept==='forderung'&&x.type==='amount'))
assert.ok(result.deviations.some(x=>x.concept==='zahlung'&&x.type==='date'))
assert.ok(result.score<100)

const gaps=analyzeCaseConsistency({caseItem:{},documents:[{title:'X',extracted_text:''}],assessments:[{traffic_light:'red',next_step:''}]})
for(const key of ['goal','summary','deadline','next_action','unread_documents','red_without_next']) assert.ok(gaps.gaps.includes(key))

const component=fs.readFileSync(new URL('../app/components/V41CaseConsistency.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']) assert.match(component,new RegExp(`\\b${language}:\\{`))
assert.match(component,/Nicht automatisch als Widerspruch gewertet/)
assert.match(component,/data-v41-consistency/)
assert.match(component,/from\('documents'\)/)
assert.match(component,/from\('assessments'\)/)
assert.match(layout,/V41CaseConsistency/)
console.log('V71 case consistency guard passed: evidence gaps, cautious cross-document deviations, score and 11-language UI verified.')
