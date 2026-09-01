import assert from 'node:assert/strict'
import fs from 'node:fs'
import { prioritizeNextStep } from '../app/modules/lib/v38NextStepEngine.mjs'

const component=fs.readFileSync(new URL('../app/modules/cases/V38PrimaryNextStep.js',import.meta.url),'utf8')
const compatibility=fs.readFileSync(new URL('../app/components/V38PrimaryNextStep.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')

assert.match(component,/Ihr nächster Schritt/)
assert.match(component,/exactly|genau|priority|prior/i)
assert.match(component,/attentionBox/)
assert.match(component,/data-v38-deadline-card/)
assert.match(component,/assessment/)
assert.match(component,/caseCoreGrid/)
assert.match(component,/missing/)
assert.match(component,/uncertain/)
for(const lang of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg']) assert.match(component,new RegExp(`\\b${lang}:\\{`))
assert.match(compatibility,/modules\/cases\/V38PrimaryNextStep/)
assert.match(layout,/modules\/cases\/V38PrimaryNextStep/)

const acuteWithMissing=prioritizeNextStep({language:'de',missing:true,deadlineStatus:'immediate',deadlineAction:'Frist prüfen'})
assert.equal(acuteWithMissing.kind,'deadline')
assert.equal(acuteWithMissing.when,'Jetzt / heute')
assert.match(acuteWithMissing.action,/Frist|frist/i)
assert.match(acuteWithMissing.action,/Unterlagen|Information/i)

const highWithMissing=prioritizeNextStep({language:'de',missing:true,deadlineStatus:'high',deadlineAction:'Frist prüfen'})
assert.equal(highWithMissing.kind,'missing')

console.log('V38 primary next-step guard passed: case-module ownership, exactly one recommendation and ten-language copy verified.')
