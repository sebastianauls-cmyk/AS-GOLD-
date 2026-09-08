import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8')
const css=read('app/globals.css')
const v127Styles=css.slice(css.indexOf('/* V127:'))

assert.ok(APP_RELEASE.number>=127)
assert.equal(APP_VERSION,`V${APP_RELEASE.number}`)

for(const path of [
  'app/modules/public/PublicLanding.js',
  'app/modules/auth/AuthSurface.js',
  'app/modules/workspace/DashboardSurface.js',
  'app/modules/cases/WorkspaceCaseSurfaces.js',
  'app/modules/cases/CaseWorkspace.js',
  'app/modules/cases/ApprovalsSurface.js',
  'app/modules/cases/ApprovalWorkflowUi.js',
  'app/modules/documents/DocumentsSurface.js',
  'app/modules/pricing/PricingSurface.js',
  'app/modules/compliance/AccountSurface.js',
  'app/modules/compliance/LegalDocument.js',
  'app/modules/integrations/IntegrationHub.js',
  'app/passwort-aendern/page.js',
  'app/error.js',
  'app/global-error.js',
  'app/not-found.js'
]){
  assert.match(read(path),/data-persistent-back/,`${path} must expose its return action as persistent navigation`)
}

const controller=read('app/modules/workspace/WorkspaceController.js')
assert.match(controller,/<DashboardSurface[\s\S]*?onBack=\{\(\)=>setScreen\('public'\)\}/,'the signed-in overview must also offer a route back to the public start page')
assert.match(read('app/reset-reparatur/page.js'),/data-persistent-back-group/,'the reset repair page must keep both safe return choices together without overlap')
assert.match(read('app/modules/language/LanguageSwitcher.js'),/className="flagLanguageMenuBack"/,'the language overlay must retain its own back control')
assert.match(css,/\.flagLanguageMenu \.flagLanguageMenuBack\{position:sticky/,'the language-menu back control must follow scrolling inside its overlay')

assert.match(v127Styles,/\[data-persistent-back\]\{[\s\S]*?position:fixed/,'all declared page return controls must follow the viewport')
assert.match(v127Styles,/inset-inline-start:max\(12px,env\(safe-area-inset-left\)\)/,'desktop and tablet controls must respect the safe area')
assert.match(v127Styles,/bottom:max\(12px,env\(safe-area-inset-bottom\)\)/,'return controls must remain above the lower safe area')
assert.match(v127Styles,/\[data-persistent-back-group\]\{[\s\S]*?position:fixed/,'multi-choice recovery navigation must move as one non-overlapping group')
assert.match(v127Styles,/@media\(max-width:560px\)[\s\S]*?\[data-persistent-back\]\{[\s\S]*?width:auto;[\s\S]*?max-width:calc\(100vw - 20px\)/,'the mobile return control must remain compact instead of blocking the full viewport width')
assert.match(v127Styles,/\[data-persistent-back\]\.backBtn\{[\s\S]*?inset-inline-end:auto;[\s\S]*?width:auto/,'protected workspace buttons must override the older full-width mobile rule')
assert.match(v127Styles,/body:has\(\[data-persistent-back\]\) \.legalFooter/,'long pages must reserve space below the floating control')
assert.match(v127Styles,/@media print[\s\S]*?\[data-persistent-back\][\s\S]*?display:none!important/,'persistent navigation must not appear in printed exports')

console.log('V127 navigation guard passed: every public, protected, legal, recovery and error surface keeps a compact return action reachable while scrolling.')
