import {mkdir,readFile,writeFile} from 'node:fs/promises'
if(process.env.ASH_BROWSER_LOCAL!=='true'||process.env.VERCEL)throw new Error('This fixture is only allowed in an isolated local browser build.')
const target=new URL('../../app/qa-case-flow/',import.meta.url)
await mkdir(target,{recursive:true})
await writeFile(new URL('page.js',target),await readFile(new URL('fixtures/case-flow.js',import.meta.url)))
