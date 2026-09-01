import assert from 'node:assert/strict'
import fs from 'node:fs'

const component=fs.readFileSync(new URL('../app/components/V47SimplifiedPublicStart.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')

assert.match(component,/Fall starten/)
assert.match(component,/Bereits registriert\? Anmelden/)
assert.match(component,/Was ist passiert\?/)
assert.match(component,/Mehr als eine normale KI/)
assert.match(component,/Dokumente zusammenführen und zuordnen/)
assert.match(component,/Fristen, Risiken und offene Punkte sichtbar machen/)
assert.match(component,/Arbeit & Kündigung/)
assert.match(component,/Behörden & Leistungen/)
assert.match(component,/Verkehr & Bußgeld/)
assert.match(component,/Verträge & Forderungen/)
assert.match(component,/Versicherung & Schäden/)
assert.match(component,/Wohnen & Miete/)
assert.match(component,/Familie & Erbe/)
assert.match(component,/Sonstiger Vorgang/)
assert.match(component,/asgold-language-order-stack/)
assert.match(component,/\.publicTop \.nav>nav\{display:none!important\}/)
assert.match(component,/#asgold-v43-visible-controls\{display:none!important\}/)
assert.match(component,/document\.getElementById\('fallarten'\)/)
assert.match(layout,/V47SimplifiedPublicStart/)

console.log('V47 simplified-start guard passed: problem-first categories, visible normal-AI differentiation, language pair and one primary start action are protected.')
