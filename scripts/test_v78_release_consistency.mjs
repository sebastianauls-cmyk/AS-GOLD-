import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_VERSION, withAppVersion } from '../app/modules/release/appRelease.mjs'
import { supportedLanguages } from '../app/modules/language/v36Languages.mjs'
import { getLegalPage, legalPageIds, localizablePageIds } from '../app/modules/compliance/v31LegalTranslations.mjs'

const read=path=>fs.readFileSync(path,'utf8')
const languageKeys=supportedLanguages.map(language=>language.key)

assert.equal(APP_VERSION,'V78','release version must be changed only in the central release module')
assert.deepEqual(localizablePageIds,['testen'],'only the non-binding tester guide may use localized LegalDocument content')

for(const language of languageKeys){
  const testerPage=getLegalPage('testen',language)
  const baseTitle=testerPage?.title||'AS Gold sicher ausprobieren'
  const displayedTitle=withAppVersion(baseTitle)
  assert.match(displayedTitle,new RegExp(`(?:^|\\s|·)${APP_VERSION}(?:$|\\s)`),`${language}: tester heading must inherit ${APP_VERSION}`)
  assert.equal((displayedTitle.match(new RegExp(APP_VERSION,'g'))||[]).length,1,`${language}: version must appear exactly once in the heading`)
  for(const pageId of legalPageIds.filter(pageId=>pageId!=='testen')){
    assert.equal(getLegalPage(pageId,language),null,`${language}/${pageId}: legal content must stay German`)
  }
}

for(const path of ['app/testen/page.js','app/modules/tester/TesterGuide.js','app/modules/compliance/v31LegalTranslations.mjs']){
  const source=read(path).replaceAll('AS_Gold_Synthetischer_Testfall_V29.pdf','AS_Gold_Synthetischer_Testfall.pdf')
  assert.doesNotMatch(source,/\bV\d+\b/,`${path}: user-facing release numbers must come from appRelease.mjs`)
}

const legalDocument=read('app/modules/compliance/LegalDocument.js')
assert.match(legalDocument,/localizable=false/)
assert.match(legalDocument,/localizable\?getLegalPage\(pageId,language\):null/)
assert.match(legalDocument,/if\(!localizable\)return/)
assert.match(legalDocument,/if\(localizable\)localStorage\.setItem/)

console.log(`${APP_VERSION} release consistency passed: ${languageKeys.length} languages inherit one version and all legal pages stay German.`)
