import assert from 'node:assert/strict'
import fs from 'node:fs'

const module=fs.readFileSync(new URL('../app/modules/integrations/IntegrationHub.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
const page=fs.readFileSync(new URL('../app/integrationen/page.js',import.meta.url),'utf8')
const legacyPath=new URL('../app/components/V38IntegrationAvailabilityGuard.js',import.meta.url)

assert.match(module,/\/api\/integrations\/status/)
assert.match(module,/configured\.google/)
assert.match(module,/configured\.microsoft/)
assert.match(module,/function ProviderAction/)
assert.match(module,/aria-disabled="true"/)
assert.match(module,/Anbieterfreigabe für AS Workspace Gold noch nicht abgeschlossen/)
assert.match(module,/Passwörter von Gmail oder Microsoft werden nicht in AS Workspace Gold gespeichert/)
assert.match(page,/IntegrationHub/)
assert.doesNotMatch(layout,/V38IntegrationAvailabilityGuard/,'legacy integration DOM guard must not be mounted')
assert.equal(fs.existsSync(legacyPath),false,'legacy integration DOM guard must be removed after direct module replacement')
assert.doesNotMatch(module,/querySelectorAll|addEventListener\('click',preventUnavailable\)/,'availability must be rendered directly, not patched into the DOM')

console.log('V38 replacement guard passed: integration availability is rendered directly by the integrations module with no post-render DOM patching.')
