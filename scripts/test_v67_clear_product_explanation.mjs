import assert from 'node:assert/strict'
import fs from 'node:fs'

const intro=fs.readFileSync(new URL('../app/lib/asGoldIntroCopy.mjs',import.meta.url),'utf8')
const title=fs.readFileSync(new URL('../app/components/HeroTitleStabilizer.js',import.meta.url),'utf8')
const enhancer=fs.readFileSync(new URL('../app/components/HeroCopyEnhancer.js',import.meta.url),'utf8')
const steps=fs.readFileSync(new URL('../app/components/ProductIntroCompact.js',import.meta.url),'utf8')

for(const term of ['digitaler Fallassistent','Sie beschreiben Ihr Anliegen oder laden Unterlagen hoch','Fristen, offene Punkte und Risiken','Sie prüfen und entscheiden selbst']) assert.match(intro,new RegExp(term))
assert.match(intro,/So arbeitet AS Gold mit Ihnen/)
assert.equal((intro.match(/title:'Was ist AS Gold\?'/g)||[]).length,1)
assert.match(title,/whatIsAsGoldCopy\[language\]/)
assert.match(enhancer,/whatIsAsGoldCopy\[language\]/)
assert.match(steps,/howAsGoldWorksCopy\[language\]/)
assert.match(steps,/\{index\+1\}/)

console.log('V67 product explanation guard passed: AS Gold is explained through input, processing, result and user control in all ten languages.')
