import fs from 'node:fs'

const path='app/modules/public/HeroCopyEnhancer.js'
let source=fs.readFileSync(path,'utf8')

source=source.replaceAll('export export const heroCopy={','export const heroCopy={')
source=source.replaceAll('export export const audienceCopy={','export const audienceCopy={')

fs.writeFileSync(path,source)
console.log('V46 public hero catalog exports normalized for repeatable refactor runs.')
