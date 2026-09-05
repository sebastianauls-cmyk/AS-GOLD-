import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8')

assert.equal(APP_VERSION,'V110')

const legalRoutes=['cookies','datenschutz','datenschutzsteuerung','impressum','ki-transparenz','kontakt','nutzungsbedingungen','rechtliches','widerruf']
for(const route of legalRoutes){
  const page=read(`app/${route}/page.js`)
  assert.doesNotMatch(page,/title:\s*['"`][^'"`]*\|\s*AS Workspace Gold/ ,`${route} must let the root title template append the product name exactly once`)
}
const legalDocument=read('app/modules/compliance/LegalDocument.js')
assert.match(legalDocument,/legalBackBtn[\s\S]*?shell\.back/,'all legal pages need the shared localized route back to the app')

const changePassword=read('app/passwort-aendern/page.js')
assert.match(changePassword,/!checking&&!user[\s\S]*?← Zurück zur App/,'expired password sessions need a visible back route')
assert.match(changePassword,/!checking&&user[\s\S]*?← Zurück zum Arbeitsbereich/,'authenticated password changes need a visible back route')

const resetRepair=read('app/reset-reparatur/page.js')
assert.match(resetRepair,/← Neuen Reset-Link anfordern/)
assert.match(resetRepair,/← Zurück zur App/)
assert.match(resetRepair,/release=\$\{APP_VERSION\}/)
assert.doesNotMatch(resetRepair,/release=V\d+/)

for(const route of ['passwort-aendern','reset-reparatur']){
  const layout=read(`app/${route}/layout.js`)
  assert.match(layout,/export const metadata=/)
  assert.doesNotMatch(layout,/title:\s*['"`][^'"`]*\|\s*AS Workspace Gold/)
}

const controller=read('app/modules/workspace/WorkspaceController.js')
for(const surface of ['ApprovalDetail','DocumentDetail','CaseDetail','CasesSurface','DocumentsSurface','ApprovalsSurface','PricingSurface','AccountSurface','ClientDetailSurface','ClientsSurface']){
  assert.match(controller,new RegExp(`<${surface}[\\s\\S]*?onBack=`),`${surface} must remain reachable and reversible`)
}

console.log('V110 navigation/metadata regression passed: public utility routes, protected surfaces and title templates have explicit non-duplicated return paths.')
