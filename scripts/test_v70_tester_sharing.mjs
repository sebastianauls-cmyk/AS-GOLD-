import assert from 'node:assert/strict'
import fs from 'node:fs'

const share=fs.readFileSync(new URL('../app/components/TesterShareButton.js',import.meta.url),'utf8')
const page=fs.readFileSync(new URL('../app/testen/page.js',import.meta.url),'utf8')

assert.match(share,/navigator\.share/)
assert.match(share,/navigator\.clipboard\.writeText/)
assert.match(share,/https:\/\/wa\.me\/\?text=/)
assert.match(share,/https:\/\/app-gold-workspace\.vercel\.app\/testen/)
assert.equal((share.match(/button:'[^']+'/g)||[]).length,11)
assert.match(page,/AS Gold V71 testen und weiterleiten/)
assert.match(page,/<TesterShareButton\/>/)

console.log('V71 tester-sharing guard passed: native sharing, WhatsApp and clipboard fallback are available in all eleven languages.')
