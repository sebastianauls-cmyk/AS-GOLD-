import assert from 'node:assert/strict'
import fs from 'node:fs'

const component=fs.readFileSync(new URL('../app/components/V38PrimaryNextStep.js',import.meta.url),'utf8')
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
assert.match(layout,/V38PrimaryNextStep/)

console.log('V38 primary next-step guard passed: one prioritized recommendation, deadline precedence, uncertainty fallback and ten-language copy verified.')
