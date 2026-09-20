import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { PRODUCT_BRAND, PRODUCT_NAME } from '../app/modules/brand/productBrand.mjs'

const read=file=>fs.readFileSync(file,'utf8')
const walk=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
  const target=path.join(directory,entry.name)
  if(entry.isDirectory())return walk(target)
  return /\.(?:js|mjs|ts|tsx)$/.test(entry.name)?[target]:[]
})

assert.equal(APP_VERSION,'V152')
assert.equal(PRODUCT_NAME,'ASH Workspace Gold')
assert.equal(PRODUCT_BRAND.shortName,'ASH Workspace')
assert.equal(PRODUCT_BRAND.monogram,'ASH')

for(const file of walk('app')){
  const source=read(file)
  assert.doesNotMatch(source,/\bAS Workspace(?: Gold)?\b|\bAS Gold\b|\bAS GOLD\b|AS%20Workspace%20Gold|AS%20Gold/,`${file}: old public brand must not remain`)
}

const logo=read('app/modules/workspace/AppLogo.js')
const icon=read('public/ash-workspace-gold-icon.svg')
const legacyIcon=read('public/as-gold-icon.svg')
const manifest=read('app/manifest.js')
const layout=read('app/layout.js')

assert.match(logo,/>ASH<\/text>/)
assert.match(icon,/aria-label="ASH Workspace Gold"/)
assert.match(legacyIcon,/aria-label="ASH Workspace Gold"/)
assert.match(manifest,/PRODUCT_BRAND\.shortName/)
assert.match(manifest,/ash-workspace-icon-192\.png/)
assert.match(manifest,/ash-workspace-icon-512\.png/)
assert.match(manifest,/ash-workspace-icon-512-maskable\.png/)
assert.match(layout,/ash-workspace-gold-icon\.svg/)
assert.match(layout,/ash-workspace-icon-180\.png/)

for(const [size,file] of [[180,'public/ash-workspace-icon-180.png'],[192,'public/ash-workspace-icon-192.png'],[512,'public/ash-workspace-icon-512.png'],[512,'public/ash-workspace-icon-512-maskable.png']]){
  const png=fs.readFileSync(file)
  assert.equal(png.toString('ascii',1,4),'PNG',`${file}: must be PNG`)
  assert.equal(png.readUInt32BE(16),size,`${file}: wrong width`)
  assert.equal(png.readUInt32BE(20),size,`${file}: wrong height`)
}

assert.ok(fs.existsSync('public/testdaten/ASH_Workspace_Gold_Synthetischer_Testfall_V29.pdf'))
assert.equal(fs.existsSync('public/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf'),false)

console.log(`${APP_VERSION} ASH Workspace Gold brand guard passed: name, logo, PWA assets, metadata and downloads are consistent.`)
