import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { componentTranslations } from '../app/lib/v30ComponentTranslations.mjs'
import { localeForLanguage, outputLanguageNames, pageTranslations, rtlLanguages, supportedLanguages } from '../app/lib/v30Languages.mjs'
import { problemLanguageProfiles } from '../app/lib/problemNavigatorLanguagesV36.mjs'
import { promoTranslations } from '../app/lib/v31PromoTranslations.mjs'

const expectedLanguages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
const legacyLocalLanguages=expectedLanguages.filter(language=>language!=='vi')
const requiredPageCatalogs=['passwordUi','uploadUi','ui','exportUi','appText','planJourney','planText','notices','journeyLabels','dashboardGuide','recommendationText','transparencyText','caseDiscoveryText','publicAudienceText','testerLinkText','periodText','launchTrustText','serverControlText']
const requiredComponentCatalogs=['workspaceCopy','approvalCopy','analysisCopy','privacyCopy','aiControlCopy','passwordCopy']

assert.deepEqual(supportedLanguages.map(({key})=>key),expectedLanguages,'V35/V72 must expose the current eleven app languages in order')
assert.equal(new Set(expectedLanguages).size,expectedLanguages.length)
assert.deepEqual(supportedLanguages.find(({key})=>key==='ro')?.countryCodes,['RO'])
assert.deepEqual(supportedLanguages.find(({key})=>key==='bg')?.countryCodes,['BG'])
assert.deepEqual(supportedLanguages.find(({key})=>key==='vi')?.countryCodes,['VN'])
assert.equal(localeForLanguage.ro,'ro-RO');assert.equal(localeForLanguage.bg,'bg-BG');assert.equal(localeForLanguage.vi,'vi-VN')
for(const language of ['ro','bg','vi']) assert.equal(rtlLanguages.has(language),false)
assert.equal(rtlLanguages.has('ar'),true);assert.equal(rtlLanguages.has('fa'),true)
for(const language of expectedLanguages){const names=outputLanguageNames[language];assert.ok(names);for(const outputLanguage of expectedLanguages)assert.ok(typeof names[outputLanguage]==='string'&&names[outputLanguage].trim(),'missing output-language label '+language+' -> '+outputLanguage)}
for(const catalog of requiredPageCatalogs){for(const language of ['ro','bg','vi']){const value=pageTranslations[catalog]?.[language];const populated=typeof value==='string'?Boolean(value.trim()):Boolean(value&&typeof value==='object'&&Object.keys(value).length);assert.ok(populated,'missing or empty '+catalog+' page catalog for '+language)}}
for(const catalog of requiredComponentCatalogs){for(const language of ['ro','bg','vi']){const value=componentTranslations[catalog]?.[language];assert.ok(value&&typeof value==='object'&&Object.keys(value).length,'missing '+catalog+' component catalog for '+language)}}
for(const language of ['ro','bg','vi']){const profile=problemLanguageProfiles[language];assert.ok(profile);assert.equal(Object.keys(profile.cases||{}).length,8);assert.ok(Object.keys(profile.reasons||{}).length>=5);assert.ok(profile.ui?.title&&profile.ui?.placeholder&&profile.ui?.analyse);assert.ok(promoTranslations[language]?.label&&promoTranslations[language]?.apply)}

const switcherSource=await readFile(new URL('../app/modules/language/LanguageSwitcher.js',import.meta.url),'utf8')
const videoDialogSource=await readFile(new URL('../app/modules/language/ExplainerVideoDialog.js',import.meta.url),'utf8')
const heroSource=await readFile(new URL('../app/modules/public/HeroTitleStabilizer.js',import.meta.url),'utf8')
const introCopySource=await readFile(new URL('../app/modules/public/asGoldIntroCopy.mjs',import.meta.url),'utf8')
const introSource=await readFile(new URL('../app/modules/public/ProductIntroCompact.js',import.meta.url),'utf8')
const explainerSource=await readFile(new URL('../app/modules/public/ExplainerVideo.js',import.meta.url),'utf8')
assert.match(switcherSource,/\bVN\b/);assert.match(switcherSource,/const flagComponents=\{[^}]*\bVN\b[^}]*\}/s)
for(const pair of [['ro','Videoclip explicativ'],['bg','Обяснително видео'],['vi','Video giải thích']]) assert.ok(videoDialogSource.includes(pair[0]+":'"+pair[1]+"'"))
assert.match(switcherSource,/className="flagLanguagePublicText"/);assert.match(switcherSource,/<strong>\{active\.label\}<\/strong>/);assert.equal((switcherSource.match(/className="flagLanguageMenuBack"/g)||[]).length,2);assert.doesNotMatch(switcherSource,/flagLanguageClose/)
assert.match(heroSource,/whatIsAsGoldCopy/);for(const language of ['ro','bg','vi'])assert.ok(introCopySource.includes(language+':{title:'));assert.match(introSource,/howAsGoldWorksCopy/)
for(const language of ['ro','bg','vi'])assert.ok(explainerSource.includes("['"+language+"',"))
for(const language of legacyLocalLanguages){const file=new URL('../public/videos/as-gold-v35-'+language+'.mp4',import.meta.url);const info=await stat(file);assert.ok(info.isFile()&&info.size>1_000_000,'missing local explainer video for '+language);assert.ok(videoDialogSource.includes('/videos/as-gold-v35-'+language+'.mp4'))}
assert.match(videoDialogSource,/c853c1c7508249c9933e9ecf2fa664c1-vi_vi-VN/)
console.log('V35/V72 language guard: eleven app languages, RO/BG/VI catalogs, SVG flags, direct modular components and controlled video sources verified.')