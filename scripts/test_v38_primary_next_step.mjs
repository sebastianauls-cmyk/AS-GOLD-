import assert from 'node:assert/strict'
import fs from 'node:fs'
import { prioritizeNextStep } from '../app/modules/lib/nextStepEngine.mjs'

const component=fs.readFileSync(new URL('../app/modules/cases/PrimaryNextStep.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
const directCases=fs.readFileSync(new URL('../app/modules/cases/CaseWorkspace.js',import.meta.url),'utf8')
assert.match(component,/Ihr nächster Schritt/);assert.match(component,/exactly|genau|priority|prior/i);assert.match(component,/assessments/);assert.match(component,/missing/)
for(const lang of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg']) assert.match(component,new RegExp(`\\b${lang}:\\{`))
assert.doesNotMatch(layout,/V38PrimaryNextStep/);assert.match(component,/PrimaryNextStepCard/);assert.match(component,/analyzeDeadlines/);assert.doesNotMatch(component,/MutationObserver|document\.createElement|querySelector|innerHTML/);assert.match(directCases,/PrimaryNextStepCard language=\{language\}/)
const acuteWithMissing=prioritizeNextStep({language:'de',missing:true,deadlineStatus:'immediate',deadlineAction:'Frist prüfen'});assert.equal(acuteWithMissing.kind,'deadline');assert.equal(acuteWithMissing.when,'Jetzt / heute');assert.match(acuteWithMissing.action,/Frist|frist/i);assert.match(acuteWithMissing.action,/Unterlagen|Information/i)
const highWithMissing=prioritizeNextStep({language:'de',missing:true,deadlineStatus:'high',deadlineAction:'Frist prüfen'});assert.equal(highWithMissing.kind,'missing')
console.log('V80 primary next-step guard passed against canonical version-neutral modules.')
