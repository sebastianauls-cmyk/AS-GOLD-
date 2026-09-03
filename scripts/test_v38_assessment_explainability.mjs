import assert from 'node:assert/strict'
import fs from 'node:fs'

const component=fs.readFileSync(new URL('../app/modules/cases/AssessmentExplainability.js',import.meta.url),'utf8')
const compatibility=fs.readFileSync(new URL('../app/components/V38AssessmentExplainability.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
const directCases=fs.readFileSync(new URL('../app/modules/cases/CaseWorkspace.js',import.meta.url),'utf8')
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg']) assert.match(component,new RegExp(`\\b${language}:\\{`),`missing ${language} explainability copy`)
assert.match(component,/why:'Warum\?'/);assert.match(component,/basis:'Grundlage'/);assert.match(component,/uncertainty:'Unsicherheit'/);assert.match(component,/missing:'Fehlende Informationen'/);assert.match(component,/AssessmentExplainability/);assert.doesNotMatch(component,/MutationObserver|document\.createElement|querySelector|appendChild/);assert.match(directCases,/AssessmentExplainability language=\{language\}/);assert.match(component,/Noch nicht separat erfasst/);assert.match(compatibility,/modules\/cases\/V38AssessmentExplainability/);assert.doesNotMatch(layout,/V38AssessmentExplainability/)
console.log('V80 assessment explainability guard passed against version-neutral domain modules.')
