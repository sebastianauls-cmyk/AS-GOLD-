import assert from 'node:assert/strict'
import fs from 'node:fs'

const guard=fs.readFileSync(new URL('../app/components/V38IntegrationAvailabilityGuard.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
const page=fs.readFileSync(new URL('../app/integrationen/page.js',import.meta.url),'utf8')

assert.match(guard,/location\.pathname!=='\/integrationen'/)
assert.match(guard,/\/api\/integrations\/status/)
assert.match(guard,/status\.configured\.google/)
assert.match(guard,/status\.configured\.microsoft/)
assert.match(guard,/aria-disabled/)
assert.match(guard,/data-v38-integration-unavailable/)
assert.match(guard,/event\.preventDefault\(\)/)
assert.match(guard,/Google-Verbindung noch nicht freigeschaltet/)
assert.match(guard,/Microsoft-Verbindung noch nicht freigeschaltet/)
assert.match(layout,/V38IntegrationAvailabilityGuard/)
assert.match(page,/Anbieterfreigabe für AS Gold noch nicht abgeschlossen/)
assert.match(page,/Passwörter von Gmail oder Microsoft werden nicht in AS Gold gespeichert/)

console.log('V38 integration availability guard passed: unavailable OAuth providers cannot create dead-end navigation and remain transparently labeled.')
