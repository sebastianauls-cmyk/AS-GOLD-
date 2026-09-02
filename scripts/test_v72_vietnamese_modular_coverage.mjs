import assert from 'node:assert/strict'
import fs from 'node:fs'
import {componentTranslations} from '../app/modules/language/v35ComponentTranslations.mjs'
import {localeForLanguage,outputLanguageNames,pageTranslations,supportedLanguages} from '../app/modules/language/v36Languages.mjs'
import {legalPageIds,legalShellCopy,legalTranslations} from '../app/modules/compliance/v31LegalTranslations.mjs'
import {privacyDashboardCopy,withdrawalCopy} from '../app/modules/compliance/v31InteractiveLegalTranslations.mjs'
import {problemLanguageProfiles} from '../app/modules/public/problemNavigatorLanguagesV36.mjs'
import {promoTranslations} from '../app/modules/pricing/v31PromoTranslations.mjs'
import {howAsGoldWorksCopy} from '../app/modules/public/asGoldIntroCopy.mjs'

const expected=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
assert.deepEqual(supportedLanguages.map(item=>item.key),expected)
assert.deepEqual(supportedLanguages.at(-1),{key:'vi',label:'Tiếng Việt',short:'VI',flags:'🇻🇳',countryCodes:['VN']})
assert.equal(localeForLanguage.vi,'vi-VN')
for(const interfaceLanguage of expected){assert.ok(outputLanguageNames[interfaceLanguage]?.vi);assert.ok(outputLanguageNames.vi?.[interfaceLanguage])}
for(const [catalog,languages] of Object.entries(pageTranslations)){const value=languages.vi;assert.ok(typeof value==='string'?value.trim():value&&typeof value==='object'&&Object.keys(value).length,`missing Vietnamese page catalog ${catalog}`)}
for(const catalog of ['workspaceCopy','approvalCopy','analysisCopy','privacyCopy','aiControlCopy','passwordCopy']) assert.ok(Object.keys(componentTranslations[catalog]?.vi||{}).length,`missing Vietnamese component catalog ${catalog}`)
assert.equal(problemLanguageProfiles.vi?.locale,'vi-VN');assert.equal(Object.keys(problemLanguageProfiles.vi?.cases||{}).length,8);assert.ok(promoTranslations.vi?.apply);assert.ok(howAsGoldWorksCopy.vi?.title);assert.equal(howAsGoldWorksCopy.vi?.items?.length,4)
assert.ok(legalShellCopy.vi);assert.ok(withdrawalCopy.vi);assert.ok(privacyDashboardCopy.vi);for(const pageId of legalPageIds)assert.ok(legalTranslations.vi?.[pageId]?.title,`missing Vietnamese legal page ${pageId}`)
const active=[
  'app/modules/language/LanguageSwitcher.js','app/modules/language/ExplainerVideoDialog.js','app/modules/public/ExplainerVideo.js','app/modules/public/ProblemNavigator.js','app/modules/public/V37FirstAction.js','app/modules/public/InstallAppButton.js'
]
for(const p of active)assert.match(fs.readFileSync(p,'utf8'),/\bvi:|\['vi'|['"]vi['"]/,`active module lacks Vietnamese: ${p}`)
const switcher=fs.readFileSync('app/modules/language/LanguageSwitcher.js','utf8');assert.match(switcher,/\bVN\b/)
const explainer=fs.readFileSync('app/modules/public/ExplainerVideo.js','utf8');assert.match(explainer,/c853c1c7508249c9933e9ecf2fa664c1-vi_vi-VN/);assert.match(explainer,/d61639497f924841be3bdf8058881470-vi_vi-VN/)
const dialog=fs.readFileSync('app/modules/language/ExplainerVideoDialog.js','utf8');assert.match(dialog,/Tiếng Việt/);assert.match(dialog,/c853c1c7508249c9933e9ecf2fa664c1-vi_vi-VN/)
console.log('V72 modular Vietnamese coverage passed: 11 languages, output labels, workspace/page catalogs, legal controls, problem navigation, pricing and both active explainer paths include Vietnamese.')
