import fs from 'node:fs'

const path='scripts/test_v46_modular_boundaries.mjs'
let source=fs.readFileSync(path,'utf8')
source=source.replace("assert.match(layout,/modules\\/cases\\/V42ActionableGaps/)\n",'')
fs.writeFileSync(path,source)
console.log('V46 removed obsolete guard requiring global V42 layout mount.')
