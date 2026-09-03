import assert from 'node:assert/strict'
import fs from 'node:fs'
import {componentTranslations} from '../app/modules/language/v35ComponentTranslations.mjs'
import {localeForLanguage,outputLanguageNames,pageTranslations,supportedLanguages} from '../app/modules/language/v36Languages.mjs'
import {normalizeOutputLanguage,outputLanguageLabels,withOutputLanguage} from '../app/modules/language/outputLanguage.js'
import {legalPageIds,legalShellCopy,legalTranslations} from '../app/modules/compliance/v31LegalTranslations.mjs'
import {privacyDashboardCopy,withdrawalCopy} from '../app/modules/compliance/v31InteractiveLegalTranslations.mjs'
import {multilingualKeywords,problemLanguageProfiles} from '../app/modules/public/problemNavigatorLanguagesV36.mjs'
import {promoTranslations} from '../app/modules/pricing/v31PromoTranslations.mjs'
import {howAsGoldWorksCopy} from '../app/modules/public/asGoldIntroCopy.mjs'

const expected=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
assert.deepEqual(supportedLanguages.map(item=>item.key),expected)
assert.deepEqual(supportedLanguages.at(-1),{key:'vi',label:'Tiếng Việt',short:'VI',flags:'🇻🇳',countryCodes:['VN']})
assert.equal(localeForLanguage.vi,'vi-VN')
assert.equal(normalizeOutputLanguage('vi'),'vi')
assert.equal(outputLanguageLabels.vi,'Tiếng Việt')
assert.equal(withOutputLanguage({case_id:'test'},'vi').output_language,'vi')
for(const interfaceLanguage of expected){assert.ok(outputLanguageNames[interfaceLanguage]?.vi);assert.ok(outputLanguageNames.vi?.[interfaceLanguage])}
for(const [catalog,languages] of Object.entries(pageTranslations)){const value=languages.vi;assert.ok(typeof value==='string'?value.trim():value&&typeof value==='object'&&Object.keys(value).length,`missing Vietnamese page catalog ${catalog}`)}
for(const catalog of ['workspaceCopy','approvalCopy','analysisCopy','privacyCopy','aiControlCopy','passwordCopy']) assert.ok(Object.keys(componentTranslations[catalog]?.vi||{}).length,`missing Vietnamese component catalog ${catalog}`)
assert.equal(problemLanguageProfiles.vi?.locale,'vi-VN');assert.equal(Object.keys(problemLanguageProfiles.vi?.cases||{}).length,8);assert.ok(promoTranslations.vi?.apply);assert.ok(howAsGoldWorksCopy.vi?.title);assert.equal(howAsGoldWorksCopy.vi?.items?.length,4)
for(const [category,term] of Object.entries({insurance:'bảo hiểm',property:'bất động sản',contract:'hóa đơn',authority:'cơ quan',work:'tiền lương',business:'khách hàng',dispute:'tranh chấp',private:'gia đình'})) assert.ok(multilingualKeywords[category]?.includes(term),`missing Vietnamese ${category} keyword`)
assert.ok(legalShellCopy.vi);assert.ok(withdrawalCopy.vi);assert.ok(privacyDashboardCopy.vi);for(const pageId of legalPageIds)assert.ok(legalTranslations.vi?.[pageId]?.title,`missing Vietnamese legal page ${pageId}`)
const active=[
  'app/modules/language/LanguageSwitcher.js','app/modules/language/ExplainerVideoDialog.js','app/modules/public/ExplainerVideo.js','app/modules/public/ProblemNavigator.js','app/modules/public/V37FirstAction.js','app/modules/public/InstallAppButton.js'
]
for(const p of active)assert.match(fs.readFileSync(p,'utf8'),/\bvi:|\['vi'|['"]vi['"]/,`active module lacks Vietnamese: ${p}`)
const switcher=fs.readFileSync('app/modules/language/LanguageSwitcher.js','utf8');assert.match(switcher,/\bVN\b/)
assert.match(switcher,/vi:'Video giải thích'/)
const landing=fs.readFileSync('app/modules/public/PublicLanding.js','utf8');assert.match(landing,/<LegalFooter language=\{language\}/);assert.match(landing,/supportedLanguages\.find/);assert.match(landing,/\/testen\?lang=/)
const languageModules=fs.readFileSync('app/modules/public/PublicLanguageModules.js','utf8');assert.match(languageModules,/vi:'Chào mừng bạn đến với AS Workspace Gold/)
const heroCopy=fs.readFileSync('app/modules/public/HeroCopyEnhancer.js','utf8');assert.match(heroCopy,/vi:\{title:'AS Workspace Gold – sự rõ ràng/);assert.match(heroCopy,/AS Workspace Gold đặc biệt hữu ích cho ai/)
const problem=fs.readFileSync('app/modules/public/ProblemNavigator.js','utf8');const recommendation=fs.readFileSync('app/modules/public/problemRecommendationV74.mjs','utf8');for(const token of ['Thử miễn phí với 3 tài liệu','Cách nhập vấn đề:','Vấn đề là gì?','rủi ro','thời hạn'])assert.ok((problem+recommendation).includes(token),`missing Vietnamese public navigator text: ${token}`)
const footer=fs.readFileSync('app/modules/compliance/LegalFooter.js','utf8');for(const language of ['ro','bg','vi'])assert.match(footer,new RegExp(`\\b${language}:\\{`),`missing ${language} footer copy`)
const explainer=fs.readFileSync('app/modules/public/ExplainerVideo.js','utf8');assert.match(explainer,/c853c1c7508249c9933e9ecf2fa664c1-vi_vi-VN/);assert.match(explainer,/d61639497f924841be3bdf8058881470-vi_vi-VN/)
const dialog=fs.readFileSync('app/modules/language/ExplainerVideoDialog.js','utf8');assert.match(dialog,/Tiếng Việt/);assert.match(dialog,/c853c1c7508249c9933e9ecf2fa664c1-vi_vi-VN/)
console.log('V72 modular Vietnamese coverage passed: 11 languages, output labels, workspace/page catalogs, legal controls, problem navigation, pricing and both active explainer paths include Vietnamese.')
