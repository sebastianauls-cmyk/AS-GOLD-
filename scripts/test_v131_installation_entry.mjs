import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8')
const install=read('app/modules/public/InstallAppButton.js')
const languages=read('app/modules/public/PublicLanguageModules.js')
const header=read('app/modules/public/PublicHeader.js')
const auth=read('app/modules/auth/AuthSurface.js')
const css=read('app/globals.css')

assert.match(languages,/<InstallAppButton language=\{language\} surface="public"\/>/,'install entry must sit directly in the public welcome area')
assert.doesNotMatch(header,/<InstallAppButton/,'install entry must not be hidden among small navigation actions')
assert.match(auth,/screen==='login'\|\|screen==='register'/,'login and registration must expose installation')
assert.match(install,/beforeinstallprompt/,'native Chromium installation prompt must remain supported')
assert.match(install,/iPad\|iPhone\|iPod/,'iOS instructions must be device-aware')
assert.match(install,/ChatGPT\|FBAN\|FBAV\|Instagram\|WhatsApp/,'in-app browsers must receive an external-browser instruction')
assert.match(install,/if\(installed\)return null/,'installation controls must disappear in standalone mode')
assert.match(css,/\.installAppFloatingButton\{display:none\}/,'floating installation control must be scoped to compact viewports')
assert.match(css,/@media\(max-width:760px\)[\s\S]*\.installAppFloatingButton\{position:fixed/,'installation action must stay reachable while mobile users scroll')
assert.match(css,/body:has\(\.installAppFloatingButton\) \[data-persistent-back\]/,'installation and return controls must not overlap')

console.log('V131 installation-entry guard passed: prominent welcome action, mobile floating control, platform guidance and auth visibility are active.')
