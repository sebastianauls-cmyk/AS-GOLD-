import fs from 'node:fs'

const path='scripts/test_v46_modular_boundaries.mjs'
let source=fs.readFileSync(path,'utf8')
const old="assert.doesNotMatch(workspace,/createClient\\(/)"
const replacement="assert.doesNotMatch(workspace,/from '@supabase\\/supabase-js'/)\nassert.doesNotMatch(workspace,/const supabase = createClient\\(/)"
if(source.includes(old)) source=source.replace(old,replacement)
if(!source.includes("assert.doesNotMatch(workspace,/const supabase = createClient\\(/)")) throw new Error('V46 precise Supabase-client guard missing')
fs.writeFileSync(path,source)
console.log('V46 service guard narrowed to the inline Supabase client only.')
