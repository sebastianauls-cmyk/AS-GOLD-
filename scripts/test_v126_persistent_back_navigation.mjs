import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8')
const css=read('app/globals.css')
const publicLanguages=read('app/modules/public/PublicLanguageModules.js')
const authSurface=read('app/modules/auth/AuthSurface.js')
const controller=read('app/modules/workspace/WorkspaceController.js')
const v126Styles=css.slice(css.indexOf('/* V126:'))

assert.ok(APP_RELEASE.number>=126)
assert.equal(APP_VERSION,`V${APP_RELEASE.number}`)
assert.match(publicLanguages,/className="publicBackButton"/,'the public start page must retain its return-to-German control')
assert.match(authSurface,/className="backBtn full authBackBtn"/,'authentication pages must retain their return control')

for(const surface of ['ApprovalDetail','DocumentDetail','CaseDetail','CasesSurface','DocumentsSurface','ApprovalsSurface','PricingSurface','AccountSurface','ClientDetailSurface','ClientsSurface']){
  assert.match(controller,new RegExp(`<${surface}[\\s\\S]*?onBack=`),`${surface} must retain a contextual return action`)
}

assert.match(v126Styles,/\.publicBackButton,[\s\S]*?\.authBackBtn,[\s\S]*?\.appMain \.backBtn\{[\s\S]*?position:fixed/,'public, authentication and protected return controls must follow the viewport')
assert.match(v126Styles,/z-index:180/,'the floating return control needs a stable layer below the language overlay')
assert.match(v126Styles,/bottom:max\(12px,env\(safe-area-inset-bottom\)\)/,'the control must remain visible above mobile safe areas')
assert.match(v126Styles,/@media\(max-width:560px\)[\s\S]*?inset-inline-start:12px;[\s\S]*?inset-inline-end:12px/,'the mobile return control must stay fully inside the viewport')
assert.match(v126Styles,/body:has\(\.publicBackButton\) \.legalFooter/,'the footer must reserve room for the floating public return control')
assert.match(v126Styles,/@media print[\s\S]*?display:none!important/,'navigation controls must not be printed into exported pages')

console.log('V126 navigation guard passed: public, authentication and protected return buttons remain visible while scrolling on desktop and mobile.')
