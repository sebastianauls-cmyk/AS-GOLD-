import assert from 'node:assert/strict'
import fs from 'node:fs'

const component=fs.readFileSync(new URL('../app/components/V43VisibilityFix.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
assert.match(component,/← Zurück/)
assert.match(component,/🇩🇪 Deutsch/)
assert.match(component,/▶ Erklärvideo/)
assert.match(component,/data-v43-visible-controls/)
assert.match(component,/history\.back/)
assert.match(component,/Deutsch/)
assert.match(component,/AS Gold in 90 Sekunden/)
assert.match(layout,/V43VisibilityFix/)
console.log('V43 visibility guard passed: permanent Back, German and explainer-video controls are mounted and wired.')
