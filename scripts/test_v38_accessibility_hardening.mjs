import assert from 'node:assert/strict'
import fs from 'node:fs'

const component=fs.readFileSync(new URL('../app/modules/navigation/AccessibilityHardening.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')

assert.match(component,/focus-visible/)
assert.match(component,/outline:3px/)
assert.match(component,/min-height:44px/)
assert.match(component,/prefers-reduced-motion:reduce/)
assert.match(component,/overflow-wrap:anywhere/)
assert.match(component,/textarea\{resize:vertical/)
assert.match(component,/v38DeadlineWarningCard/)
assert.match(component,/v38PrimaryNextStep/)
assert.match(layout,/modules\/navigation\/AccessibilityHardening/)
assert.match(layout,/<AccessibilityHardening\/>/)

console.log('V80 accessibility hardening guard passed against canonical navigation module.')
