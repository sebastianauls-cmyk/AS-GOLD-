import assert from 'node:assert/strict'
import fs from 'node:fs'

const enhancer=fs.readFileSync(new URL('../app/components/HeroCopyEnhancer.js',import.meta.url),'utf8')

assert.doesNotMatch(enhancer,/<div class="eyebrow">\$\{copy\.title\}<\/div>/)
assert.equal((enhancer.match(/<h2[^>]*>\$\{copy\.title\}<\/h2>/g)||[]).length,1)

console.log('V69 duplication guard passed: the audience section shows its heading only once.')
