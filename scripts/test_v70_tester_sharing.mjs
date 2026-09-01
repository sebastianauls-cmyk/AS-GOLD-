import assert from 'node:assert/strict'
import fs from 'node:fs'
const share=fs.readFileSync('app/modules/tester/TesterShareButton.js','utf8')
const adapter=fs.readFileSync('app/components/TesterShareButton.js','utf8')
const guide=fs.readFileSync('app/modules/tester/TesterGuide.js','utf8')
const page=fs.readFileSync('app/testen/page.js','utf8')
assert.match(share,/navigator\.share/);assert.match(share,/navigator\.clipboard\.writeText/);assert.match(share,/https:\/\/wa\.me\/\?text=/);assert.match(share,/https:\/\/app-gold-workspace\.vercel\.app\/testen/)
assert.equal((share.match(/button:'[^']+'/g)||[]).length,11,'tester sharing must include all eleven app languages')
assert.match(share,/\bvi:/);assert.match(adapter,/modules\/tester\/TesterShareButton/);assert.match(guide,/AS Gold V72 sicher ausprobieren/);assert.match(guide,/<TesterShareButton\/>/);assert.match(page,/TesterGuide/);assert.doesNotMatch(page,/TesterPaused/)
console.log('V72 tester-sharing release guard passed: native sharing, WhatsApp and clipboard fallback are active through the modular tester route in all eleven languages.')
