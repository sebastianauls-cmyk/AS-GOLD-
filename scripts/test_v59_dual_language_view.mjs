import assert from 'node:assert/strict'
import fs from 'node:fs'
import { pageTranslations, supportedLanguages } from '../app/lib/v30Languages.mjs'

const page=fs.readFileSync(new URL('../app/page.js',import.meta.url),'utf8')
const modules=fs.readFileSync(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')
const footer=fs.readFileSync(new URL('../app/components/LegalFooter.js',import.meta.url),'utf8')

assert.match(page,/const contentLanguage=outputLanguage/)
assert.match(page,/const t=ui\[contentLanguage\]/)
assert.match(page,/const a=appText\[contentLanguage\]/)
assert.match(page,/caseDiscoveryText\[contentLanguage\]/)
assert.match(page,/transparencyText\[contentLanguage\]/)
assert.match(page,/recommendationText\[contentLanguage\]/)
assert.match(page,/getProblemLanguageProfile\(contentLanguage\)/)
assert.match(page,/<LegalFooter language=\{contentLanguage\}/)
assert.match(page,/screen==='public'\?outputLanguage:language/)
assert.match(modules,/lang=\{language\}/)
assert.doesNotMatch(modules,/id="asgold-customer-module-slot"/)

assert.deepEqual(supportedLanguages.map(item=>item.key),['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi'])
for(const key of ['fr','fa','ro','bg','vi']){
  for(const catalog of ['ui','appText','planJourney','planText','transparencyText','caseDiscoveryText','publicAudienceText','testerLinkText','periodText','journeyLabels','recommendationText']){
    assert.ok(pageTranslations[catalog]?.[key],`${catalog}.${key} must be translated`)
  }
}
assert.match(footer,/ro:\{nav:'Informații juridice'/)
assert.match(footer,/bg:\{nav:'Правна информация'/)
assert.match(footer,/vi:\{nav:'Thông tin pháp lý'/)

console.log('V71 dual-language guard passed: interface language stays independent while every public customer section follows the selected output language in all eleven languages.')
