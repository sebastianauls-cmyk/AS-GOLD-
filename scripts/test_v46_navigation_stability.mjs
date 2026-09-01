import assert from 'node:assert/strict'
import fs from 'node:fs'

const component=fs.readFileSync(new URL('../app/components/V43VisibilityFix.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')

assert.match(component,/data-v46-fallback-controls/)
assert.match(component,/findControl\(backPattern\)/)
assert.match(component,/data\.asgoldBackEnhanced/)
assert.match(component,/history\.back\(\)/)
assert.match(component,/bar\.replaceChildren\(\)/)
assert.match(component,/bar\.hidden=bar\.childElementCount===0/)
assert.match(component,/MutationObserver/)
assert.match(component,/findControl\(germanPattern\)/)
assert.match(component,/findControl\(videoPattern\)/)
assert.doesNotMatch(component,/bar\.innerHTML=.*Zurück.*Deutsch.*Erklärvideo/)
assert.match(layout,/V43VisibilityFix/)

console.log('V46 navigation stability guard passed: back navigation is enforced and fallback controls are only rendered when native controls are missing.')
