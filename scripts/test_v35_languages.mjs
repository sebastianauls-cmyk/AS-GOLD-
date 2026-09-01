import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { componentTranslations } from '../app/lib/v30ComponentTranslations.mjs'
import {
  localeForLanguage,
  outputLanguageNames,
  pageTranslations,
  rtlLanguages,
  supportedLanguages
} from '../app/lib/v30Languages.mjs'
import { problemLanguageProfiles } from '../app/lib/problemNavigatorLanguagesV36.mjs'
import { promoTranslations } from '../app/lib/v31PromoTranslations.mjs'

const expectedLanguages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
const requiredPageCatalogs=[
  'passwordUi','uploadUi','ui','exportUi','appText','planJourney','planText','notices',
  'journeyLabels','dashboardGuide','recommendationText','transparencyText',
  'caseDiscoveryText','publicAudienceText','testerLinkText','periodText',
  'launchTrustText','serverControlText'
]
const requiredComponentCatalogs=[
  'workspaceCopy','approvalCopy','analysisCopy','privacyCopy','aiControlCopy','passwordCopy'
]

assert.deepEqual(
  supportedLanguages.map(({key})=>key),
  expectedLanguages,
  'V71 must expose exactly the agreed eleven app languages in the agreed order'
)
assert.equal(new Set(expectedLanguages).size,expectedLanguages.length,'language keys must be unique')
assert.deepEqual(supportedLanguages.find(({key})=>key==='ro')?.countryCodes,['RO'])
assert.deepEqual(supportedLanguages.find(({key})=>key==='bg')?.countryCodes,['BG'])
assert.deepEqual(supportedLanguages.find(({key})=>key==='vi')?.countryCodes,['VN'])
assert.equal(localeForLanguage.ro,'ro-RO')
assert.equal(localeForLanguage.bg,'bg-BG')
assert.equal(localeForLanguage.vi,'vi-VN')
assert.equal(rtlLanguages.has('ro'),false)
assert.equal(rtlLanguages.has('bg'),false)
assert.equal(rtlLanguages.has('ar'),true)
assert.equal(rtlLanguages.has('fa'),true)

for(const language of expectedLanguages){
  const names=outputLanguageNames[language]
  assert.ok(names, `missing output-language catalog for ${language}`)
  for(const outputLanguage of expectedLanguages){
    assert.ok(
      typeof names[outputLanguage]==='string'&&names[outputLanguage].trim(),
      `missing output-language label ${language} -> ${outputLanguage}`
    )
  }
}

for(const catalog of requiredPageCatalogs){
  for(const language of ['ro','bg','vi']){
    const value=pageTranslations[catalog]?.[language]
    const populated=typeof value==='string'?Boolean(value.trim()):Boolean(value&&typeof value==='object'&&Object.keys(value).length)
    assert.ok(populated,`missing or empty ${catalog} page catalog for ${language}`)
  }
}

for(const catalog of requiredComponentCatalogs){
  for(const language of ['ro','bg','vi']){
    const value=componentTranslations[catalog]?.[language]
    assert.ok(value&&typeof value==='object',`missing ${catalog} component catalog for ${language}`)
    assert.ok(Object.keys(value).length>0,`empty ${catalog} component catalog for ${language}`)
  }
}

for(const language of ['ro','bg','vi']){
  const profile=problemLanguageProfiles[language]
  assert.ok(profile,`missing problem navigator profile for ${language}`)
  assert.equal(Object.keys(profile.cases||{}).length,8,`problem navigator must expose eight case types for ${language}`)
  assert.ok(Object.keys(profile.reasons||{}).length>=5,`problem navigator reasons incomplete for ${language}`)
  assert.ok(profile.ui?.title&&profile.ui?.placeholder&&profile.ui?.analyse,`problem navigator UI incomplete for ${language}`)
  assert.ok(promoTranslations[language]?.label&&promoTranslations[language]?.apply,`promo UI incomplete for ${language}`)
}

const switcherSource=await readFile(new URL('../app/components/LanguageSwitcher.js',import.meta.url),'utf8')
const publicModulesSource=await readFile(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')
const heroSource=await readFile(new URL('../app/components/HeroTitleStabilizer.js',import.meta.url),'utf8')
const introSource=await readFile(new URL('../app/components/ProductIntroCompact.js',import.meta.url),'utf8')
const explainerSource=await readFile(new URL('../app/components/ExplainerVideo.js',import.meta.url),'utf8')

assert.match(switcherSource,/import \{[^}]*\bBG\b[^}]*\bRO\b[^}]*\} from 'country-flag-icons\/react\/3x2'/s)
assert.match(switcherSource,/const flagComponents=\{[^}]*\bBG\b[^}]*\bRO\b[^}]*\}/s)
assert.match(publicModulesSource,/ro:\{[^\n]*play:'Redă videoclipul explicativ'/)
assert.match(publicModulesSource,/bg:\{[^\n]*play:'Пусни обяснителното видео'/)
assert.match(publicModulesSource,/asgold:open-explainer/)
assert.doesNotMatch(switcherSource,/role="dialog"/)
assert.match(switcherSource,/>\{label\}<\/small>/)
assert.match(switcherSource,/>\{active\.label\}<\/strong>/)
assert.doesNotMatch(switcherSource,/heygen\.ai/,'language control must use the permanent local video paths')
assert.match(heroSource,/\bro:\{title:/)
assert.match(heroSource,/\bbg:\{title:/)
assert.match(introSource,/\bro:\{/)
assert.match(introSource,/\bbg:\{/)
assert.match(explainerSource,/\['ro','🇷🇴','Română'\]/)
assert.match(explainerSource,/\['bg','🇧🇬','Български'\]/)
assert.match(explainerSource,/\['vi','🇻🇳','Tiếng Việt'\]/)

for(const language of expectedLanguages){
  if(language==='vi') continue
  const filename=`as-gold-v35-${language}.mp4`
  const path=new URL(`../public/videos/${filename}`,import.meta.url)
  const info=await stat(path)
  assert.ok(info.isFile()&&info.size>1_000_000,`missing or incomplete local explainer video for ${language}`)
  if(language!=='de') assert.ok(explainerSource.includes(`/videos/${filename}`),`missing local explainer source for ${language}`)
}
assert.match(explainerSource,/\/videos\/as-gold-explainer-de-female\.mp4/)
assert.match(explainerSource,/\/videos\/as-gold-explainer-de-male\.mp4/)

console.log('V71 language guard: 11 app languages, Vietnamese catalogs, SVG flag and local videos verified.')
