import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8')
const landing=read('app/modules/public/PublicLanding.js')
const publicLanguages=read('app/modules/public/PublicLanguageModules.js')
const css=read('app/globals.css')
const v130Styles=css.slice(css.indexOf('/* V130:'))

assert.ok(APP_RELEASE.number>=130)
assert.equal(APP_VERSION,`V${APP_RELEASE.number}`)
assert.match(landing,/<PublicHeader[\s\S]*?\/>\s*<button className="publicPageBackButton" data-persistent-back/,'the public back button must be rendered outside and after the filtered header')
assert.match(landing,/window\.scrollTo\(\{top:0,left:0,behavior:reducedMotion\?'auto':'smooth'\}\)/,'the public return action must lead back to the top of the page')
assert.match(landing,/prefers-reduced-motion: reduce/,'the scrolling behavior must respect reduced-motion preferences')
assert.doesNotMatch(publicLanguages,/className="publicBackButton" data-persistent-back/,'the language reset must not masquerade as the page return control')
assert.match(publicLanguages,/language!==['"]de['"]\|\|outputLanguage!==['"]de['"]/,'the separate German reset should only appear when a language actually needs resetting')
assert.match(v130Styles,/\.publicPageBackButton\[data-persistent-back\]\{[\s\S]*?position:fixed/,'the public page return control must stay attached to the viewport')
assert.match(v130Styles,/\.publicTop \.publicBackButton\{[\s\S]*?position:static/,'the language reset must remain inside the header instead of creating a second floating control')

console.log('V130 navigation guard passed: the public start-page back button remains visible while scrolling and returns to the page start.')
