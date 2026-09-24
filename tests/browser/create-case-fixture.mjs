import {mkdir,readFile,writeFile} from 'node:fs/promises'
if(process.env.ASH_BROWSER_LOCAL!=='true'||process.env.VERCEL)throw new Error('This fixture is only allowed in an isolated local browser build.')
for(const name of ['case','document']){
  const target=new URL('../../app/qa-'+name+'-flow/',import.meta.url)
  await mkdir(target,{recursive:true})
  await writeFile(new URL('page.js',target),await readFile(new URL('fixtures/'+name+'-flow.js',import.meta.url)))
}
