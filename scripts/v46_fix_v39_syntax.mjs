import fs from 'node:fs'

const path='app/modules/cases/V39CaseTimelineAutoAssessment.js'
let source=fs.readFileSync(path,'utf8')
const line=/  if\(local\)\{const \[,d,m,y\]=local;return [^\n]+\n/
if(!line.test(source)) throw new Error('generated V39 local-date line missing')
source=source.replace(line,"  if(local){const [,d,m,y]=local;return [y,m.padStart(2,'0'),d.padStart(2,'0')].join('-')}\n")
fs.writeFileSync(path,source)
console.log('V39 generated date syntax normalized')
