// Keep the ordinary network/subprocess guard. Permit only Poppler's local
// text extraction for the existing synthetic PDF export regression.
import childProcess from 'node:child_process'
import {syncBuiltinESMExports} from 'node:module'
import os from 'node:os'
import path from 'node:path'
const extract=childProcess.spawnSync
await import('./noNetwork.mjs')
const denied=childProcess.spawnSync
childProcess.spawnSync=(command,args,options={})=>{
  const expected=path.join(os.tmpdir(),'ash-pdf-test-')
  const valid=command==='pdftotext'&&Array.isArray(args)&&args.length>0&&args.every(arg=>
    typeof arg==='string'&&(['-v','-raw','-f','-l','1','2','-'].includes(arg)||
      (path.resolve(arg)===arg&&arg.startsWith(expected)&&arg.endsWith('.pdf'))))&&
    Object.keys(options).every(key=>key==='encoding')&&options.encoding==='utf8'
  if(!valid)return denied()
  return extract(command,args,{encoding:'utf8',shell:false,timeout:10000})
}
syncBuiltinESMExports()
