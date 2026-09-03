import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { APP_RELEASE, APP_VERSION, withAppVersion } from '../app/modules/release/appRelease.mjs'
import { PRODUCT_BRAND, PRODUCT_DESCRIPTOR, PRODUCT_NAME } from '../app/modules/brand/productBrand.mjs'
import { supportedLanguages } from '../app/modules/language/v36Languages.mjs'
import { getLegalPage, legalPageIds, localizablePageIds } from '../app/modules/compliance/v31LegalTranslations.mjs'

const read=file=>fs.readFileSync(file,'utf8')
const languageKeys=supportedLanguages.map(language=>language.key)
function walk(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{const target=path.join(directory,entry.name);if(entry.isDirectory())return walk(target);return /\.(?:js|mjs)$/.test(entry.name)?[target]:[]})}

assert.match(APP_VERSION,/^V\d+$/,'release version must come from the central release module')
assert.equal(APP_VERSION,APP_RELEASE.version)
assert.equal(Number(APP_VERSION.slice(1)),APP_RELEASE.number)
assert.equal(PRODUCT_NAME,'AS Workspace Gold')
assert.equal(PRODUCT_DESCRIPTOR,'Der digitale Fall- und Dokumentenmanager')
assert.equal(PRODUCT_BRAND.workspace,'Workspace')
assert.equal(PRODUCT_BRAND.edition,'Gold')
assert.deepEqual(localizablePageIds,['testen'],'only the non-binding tester guide may use localized LegalDocument content')

for(const language of languageKeys){
  const testerPage=getLegalPage('testen',language)
  const baseTitle=testerPage?.title||`${PRODUCT_NAME} sicher ausprobieren`
  const displayedTitle=withAppVersion(baseTitle)
  assert.match(displayedTitle,new RegExp(`(?:^|\\s|·)${APP_VERSION}(?:$|\\s)`),`${language}: tester heading must inherit ${APP_VERSION}`)
  assert.equal((displayedTitle.match(new RegExp(APP_VERSION,'g'))||[]).length,1,`${language}: version must appear exactly once in the heading`)
  assert.match(baseTitle,/AS Workspace Gold/,`${language}: tester heading must use the central public brand`)
  for(const pageId of legalPageIds.filter(pageId=>pageId!=='testen')) assert.equal(getLegalPage(pageId,language),null,`${language}/${pageId}: legal content must stay German`)
}

for(const file of ['app/testen/page.js','app/modules/tester/TesterGuide.js','app/modules/compliance/v31LegalTranslations.mjs']){
  const source=read(file).replaceAll('AS_Gold_Synthetischer_Testfall_V29.pdf','AS_Gold_Synthetischer_Testfall.pdf')
  assert.doesNotMatch(source,/\bV\d+\b/,`${file}: user-facing release numbers must come from appRelease.mjs`)
}
for(const file of walk('app')) assert.doesNotMatch(read(file),/AS Gold|AS GOLD|AS%20Gold/,`${file}: obsolete public brand must not return`)

const publicHeader=read('app/modules/public/PublicHeader.js')
const protectedShell=read('app/modules/workspace/ProtectedWorkspaceShell.js')
const layout=read('app/layout.js')
const manifest=read('app/manifest.js')
assert.match(publicHeader,/<ProductBrand showDescriptor/)
assert.match(protectedShell,/<ProductBrand\/?>/)
assert.match(layout,/PRODUCT_DESCRIPTOR/)
assert.match(manifest,/PRODUCT_NAME/)
assert.match(read('public/as-gold-icon.svg'),/aria-label="AS Workspace Gold"/)
assert.match(read('supabase/functions/gold-withdrawal/index.ts'),/AS Workspace Gold – Eingangsbestätigung/)

const legalDocument=read('app/modules/compliance/LegalDocument.js')
assert.match(legalDocument,/localizable=false/)
assert.match(legalDocument,/localizable\?getLegalPage\(pageId,language\):null/)
assert.match(legalDocument,/if\(!localizable\)return/)
assert.match(legalDocument,/if\(localizable\)localStorage\.setItem/)
console.log(`${APP_VERSION} release and brand consistency passed: ${PRODUCT_NAME}, ${languageKeys.length} languages, German legal pages.`)
