import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { supportedLanguages } from '../app/modules/language/languageRegistry.mjs'
import { getLegalPage, legalPageIds, legalShellCopy, localizablePageIds } from '../app/modules/compliance/legalTranslations.mjs'
import { privacyDashboardCopy, withdrawalCopy } from '../app/modules/compliance/privacyInteractionTranslations.mjs'

const languageKeys=supportedLanguages.map(language=>language.key)
assert.equal(languageKeys.length,11,'the public app must keep all eleven languages')
assert.deepEqual(localizablePageIds,legalPageIds,'every legal page must be localizable')

for(const language of languageKeys){
  assert.ok(legalShellCopy[language],`${language}: legal navigation shell missing`)
  assert.ok(withdrawalCopy[language],`${language}: electronic withdrawal form missing`)
  assert.ok(privacyDashboardCopy[language],`${language}: privacy controls missing`)
  if(language==='de') continue
  for(const pageId of legalPageIds){
    const page=getLegalPage(pageId,language)
    assert.ok(page,`${language}/${pageId}: full legal translation missing`)
    assert.ok(page.title?.trim(),`${language}/${pageId}: translated title missing`)
    assert.ok(page.intro?.trim(),`${language}/${pageId}: translated introduction missing`)
    assert.ok(page.sections?.length,`${language}/${pageId}: translated sections missing`)
    assert.ok(page.sections.every(section=>section.title?.trim()),`${language}/${pageId}: translated section heading missing`)
  }
}

const documentSource=await readFile(new URL('../app/modules/compliance/LegalDocument.js',import.meta.url),'utf8')
assert.match(documentSource,/localizable=true/,'legal pages must localize by default')
assert.match(documentSource,/getLegalPage\(pageId,language\)/,'legal page must resolve the complete language catalog')
assert.match(documentSource,/rtlLanguages\.has\(activeLanguage\)/,'Arabic and Farsi must retain RTL rendering')
assert.match(documentSource,/legalTranslationNote/,'translated legal pages must show the authoritative-language notice')

const integrationsSource=await readFile(new URL('../app/modules/integrations/IntegrationHub.js',import.meta.url),'utf8')
assert.match(integrationsSource,/LegalFooter language=\{language\}/,'the workspace integration footer must follow the selected language')

console.log(`V137: ${legalPageIds.length} legal surfaces translated in ${languageKeys.length} app languages; German remains the authoritative source.`)
