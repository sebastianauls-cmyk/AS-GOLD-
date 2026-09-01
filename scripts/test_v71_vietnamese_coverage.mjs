import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {componentTranslations} from '../app/lib/v30ComponentTranslations.mjs'
import {localeForLanguage,outputLanguageNames,pageTranslations,supportedLanguages} from '../app/lib/v30Languages.mjs'
import {legalPageIds,legalShellCopy,legalTranslations} from '../app/lib/v31LegalTranslations.mjs'
import {privacyDashboardCopy,withdrawalCopy} from '../app/lib/v31InteractiveLegalTranslations.mjs'
import {problemLanguageProfiles} from '../app/lib/problemNavigatorLanguagesV36.mjs'
import {promoTranslations} from '../app/lib/v31PromoTranslations.mjs'

const expected=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
assert.deepEqual(supportedLanguages.map(item=>item.key),expected)
const vietnamese=supportedLanguages.at(-1)
assert.deepEqual(vietnamese,{key:'vi',label:'Tiếng Việt',short:'VI',flags:'🇻🇳',countryCodes:['VN']})
assert.equal(localeForLanguage.vi,'vi-VN')

for(const interfaceLanguage of expected){
  assert.ok(outputLanguageNames[interfaceLanguage]?.vi,`missing ${interfaceLanguage} label for Vietnamese output`)
  assert.ok(outputLanguageNames.vi?.[interfaceLanguage],`missing Vietnamese label for ${interfaceLanguage} output`)
}

for(const [catalog,languages] of Object.entries(pageTranslations)){
  const value=languages.vi
  const populated=typeof value==='string'?value.trim():value&&typeof value==='object'&&Object.keys(value).length
  assert.ok(populated,`missing Vietnamese page catalog ${catalog}`)
}
for(const catalog of ['workspaceCopy','approvalCopy','analysisCopy','privacyCopy','aiControlCopy','passwordCopy']){
  assert.ok(Object.keys(componentTranslations[catalog]?.vi||{}).length,`missing Vietnamese component catalog ${catalog}`)
}

const profile=problemLanguageProfiles.vi
assert.equal(profile.locale,'vi-VN')
assert.equal(Object.keys(profile.cases).length,8)
assert.ok(profile.ui.title&&profile.ui.voice&&profile.ui.analyse)
assert.ok(promoTranslations.vi?.apply)

assert.ok(legalShellCopy.vi)
assert.ok(withdrawalCopy.vi)
assert.ok(privacyDashboardCopy.vi)
for(const pageId of legalPageIds){
  const page=legalTranslations.vi?.[pageId]
  assert.ok(page?.title&&page?.intro&&page?.sections?.length,`incomplete Vietnamese legal page ${pageId}`)
}

const inlineModules=[
  'ExplainerVideo','HeroCopyEnhancer','HeroTitleStabilizer','LanguageSwitcher','LegalFooter','ProblemNavigator',
  'ProductIntroCompact','PublicLanguageModules','TesterShareButton','V37FirstAction','V38AssessmentExplainability',
  'V38DeadlineCardEnhancer','V38PrimaryNextStep','V39CaseTimelineAutoAssessment','V40ProfessionalHandoff',
  'V41CaseConsistency','V42ActionableGaps','V44LanguageOrder','V45OutputLanguageBridge'
]
for(const name of inlineModules){
  const source=await readFile(new URL(`../app/components/${name}.js`,import.meta.url),'utf8')
  assert.match(source,/\bvi:|['"]vi['"]/,`${name} does not expose Vietnamese`)
}

const switcher=await readFile(new URL('../app/components/LanguageSwitcher.js',import.meta.url),'utf8')
assert.match(switcher,/\bVN\b/)
const explainer=await readFile(new URL('../app/components/ExplainerVideo.js',import.meta.url),'utf8')
assert.match(explainer,/\['vi','🇻🇳','Tiếng Việt'\]/)
assert.match(explainer,/vi:'https:\/\/resource2\.heygen\.ai\/video_translate\/c853c1c7508249c9933e9ecf2fa664c1-vi_vi-VN\/original\.mp4'/)
assert.match(explainer,/vi:'https:\/\/resource2\.heygen\.ai\/video_translate\/d61639497f924841be3bdf8058881470-vi_vi-VN\/original\.mp4'/)

console.log('V71 Vietnamese coverage guard passed: UI, output, case work, legal controls, sharing and both explainer videos are complete.')
