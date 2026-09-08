import assert from 'node:assert/strict'
import fs from 'node:fs'

const module=fs.readFileSync(new URL('../app/modules/integrations/IntegrationHub.js',import.meta.url),'utf8')
const optional=fs.readFileSync(new URL('../app/modules/optional/OptionalExtensions.js',import.meta.url),'utf8')
const statusRoute=fs.readFileSync(new URL('../app/api/integrations/status/route.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
const page=fs.readFileSync(new URL('../app/integrationen/page.js',import.meta.url),'utf8')
const optionalPage=fs.readFileSync(new URL('../app/erweiterungen/page.js',import.meta.url),'utf8')
const legacyPath=new URL('../app/components/V38IntegrationAvailabilityGuard.js',import.meta.url)

assert.match(module,/OptionalExtensions/)
assert.doesNotMatch(module,/\/api\/integrations\/google\/start|\/api\/integrations\/microsoft\/start/,'normal integration UI must not expose direct provider activation')
assert.match(optional,/Nur auf Wunsch freischalten/)
assert.match(optional,/Cloud-\/Ablage-Baustein anfragen/)
assert.match(optional,/Bezahl-Baustein anfragen/)
assert.match(statusRoute,/AS_OPTIONAL_INTEGRATIONS_ENABLED/)
assert.match(statusRoute,/optionalEnabled/)
assert.match(page,/IntegrationHub/)
assert.match(optionalPage,/OptionalExtensions/)
assert.doesNotMatch(layout,/V38IntegrationAvailabilityGuard/,'legacy integration DOM guard must not be mounted')
assert.equal(fs.existsSync(legacyPath),false,'legacy integration DOM guard must be removed after direct module replacement')

console.log('V38 optional-module guard passed: external integrations are request-only, separately gated and not exposed as direct actions in the standard product.')
