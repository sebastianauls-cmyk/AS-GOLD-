import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'
const share=fs.readFileSync('app/modules/tester/TesterShareButton.js','utf8')
const adapter=fs.readFileSync('app/components/TesterShareButton.js','utf8')
const guide=fs.readFileSync('app/modules/tester/TesterGuide.js','utf8')
const gate=fs.readFileSync('app/modules/tester/PromoTesterGate.js','utf8')
const page=fs.readFileSync('app/testen/page.js','utf8')
const release=fs.readFileSync('app/modules/release/appRelease.mjs','utf8')
assert.match(share,/navigator\.share/);assert.match(share,/navigator\.clipboard\.writeText/);assert.match(share,/https:\/\/wa\.me\/\?text=/);assert.match(share,/https:\/\/app-gold-workspace\.vercel\.app\/testen/)
assert.equal((share.match(/button:'[^']+'/g)||[]).length,11,'tester sharing must include all eleven app languages')
assert.match(share,/\bvi:/);assert.match(adapter,/modules\/tester\/TesterShareButton/);assert.match(guide,/APP_VERSION/);assert.match(guide,/AS Workspace Gold sicher ausprobieren/);assert.match(guide,/<TesterShareButton\/>/);assert.match(gate,/TesterGuide/);assert.match(gate,/\/api\/tester\/promo/);assert.match(page,/PromoTesterGate/);assert.doesNotMatch(page,/TesterGuide|TesterPaused|TesterShareButton/)
assert.match(APP_VERSION,/^V\d+$/,'central app release must expose a valid version')
assert.match(release,/export const APP_VERSION=APP_RELEASE\.version/,'tester sharing must follow the central release source instead of a hard-coded version')
console.log(`${APP_VERSION} tester-sharing guard passed: sharing remains available only inside the promo-unlocked TesterGuide; the public tester route itself exposes no share control.`)
