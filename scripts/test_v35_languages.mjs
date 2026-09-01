import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { componentTranslations } from '../app/lib/v30ComponentTranslations.mjs'
import { localeForLanguage, outputLanguageNames, pageTranslations, rtlLanguages, supportedLanguages } from '../app/lib/v30Languages.mjs'
import { problemLanguageProfiles } from '../app/lib/problemNavigatorLanguagesV36.mjs'
import { promoTranslations } from '../app/lib/v31PromoTranslations.mjs'

const expectedLanguages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg']
const requiredPageCatalogs=['passwordUi','uploadUi','ui','exportUi','appText','planJourney','planText','notices','journeyLabels','dashboardGuide','recommendationText','transparencyText','caseDiscoveryText','publicAudienceText','testerLinkText','periodText','launchTrustText','serverControlText']
const requiredComponentCatalogs=['workspaceCopy','approvalCopy','analysisCopy','privacyCopy','aiControlCopy','passwordCopy']

assert.deepEqual(supportedLanguages.map(({key})=>key),expectedLanguages,'V35 must expose exactly the agreed ten app languages in the agreed order')
assert.equal(new Set(expectedLanguages).size,expectedLanguages.length,'language keys must be unique')
assert.deepEqual(supportedLanguages.find(({key})=>key==='ro')?.countryCodes,['RO'])
assert.deepEqual(supportedLanguages.find(({key})=>key==='bg')?.countryCodes,['BG'])
assert.equal(localeForLanguage.ro,'ro-RO');assert.equal(localeForLanguage.bg,'bg-BG')
assert.equal(rtlLanguages.has('ro'),false);assert.equal(rtlLanguages.has('bg'),false);assert.equal(rtlLanguages.has('ar'),true);assert.equal(rtlLanguages.has('fa'),true)
for(const language of expectedLanguages){const names=outputLanguageNames[language];assert.ok(names,`missing output-language catalog for ${language}`);for(const outputLanguage of expectedLanguages)assert.ok(typeof names[outputLanguage]==='string'&&names[outputLanguage].trim(),`missing output-language label ${language} -> ${outputLanguage}`)}
for(const catalog of requiredPageCatalogs){for(const language of ['ro','bg']){const value=pageTranslations[catalog]?.[language];const populated=typeof value==='string'?Boolean(value.trim()):Boolean(value&&typeof value==='object'&&Object.keys(value).length);assert.ok(populated,`missing or empty ${catalog} page catalog for ${language}`)}}
for(const catalog of requiredComponentCatalogs){for(const language of ['ro','bg']){const value=componentTranslations[catalog]?.[language];assert.ok(value&&typeof value==='object',`missing ${catalog} component catalog for ${language}`);assert.ok(Object.keys(value).length>0,`empty ${catalog} component catalog for ${language}`)}}
for(const language of ['ro','bg']){const profile=problemLanguageProfiles[language];assert.ok(profile,`missing problem navigator profile for ${language}`);assert.equal(Object.keys(profile.cases||{}).length,8,`problem navigator must expose eight case types for ${language}`);assert.ok(Object.keys(profile.reasons||{}).length>=5,`problem navigator reasons incomplete for ${language}`);assert.ok(profile.ui?.title&&profile.ui?.placeholder&&profile.ui?.analyse,`problem navigator UI incomplete for ${language}`);assert.ok(promoTranslations[language]?.label&&promoTranslations[language]?.apply,`promo UI incomplete for ${language}`)}

const switcherSource=await readFile(new URL('../app/modules/language/LanguageSwitcher.js',import.meta.url),'utf8')
const videoDialogSource=await readFile(new URL('../app/modules/language/ExplainerVideoDialog.js',import.meta.url),'utf8')
const heroSource=await readFile(new URL('../app/modules/public/HeroTitleStabilizer.js',import.meta.url),'utf8')
const heroCompatibility=await readFile(new URL('../app/components/HeroTitleStabilizer.js',import.meta.url),'utf8')
const introSource=await readFile(new URL('../app/modules/public/ProductIntroCompact.js',import.meta.url),'utf8')
const introCompatibility=await readFile(new URL('../app/components/ProductIntroCompact.js',import.meta.url),'utf8')
const explainerSource=await readFile(new URL('../app/modules/public/ExplainerVideo.js',import.meta.url),'utf8')
const explainerCompatibility=await readFile(new URL('../app/components/ExplainerVideo.js',import.meta.url),'utf8')

assert.match(switcherSource,/import \{[^}]*\bBG\b[^}]*\bRO\b[^}]*\} from 'country-flag-icons\/react\/3x2'/s)
assert.match(switcherSource,/const flagComponents=\{[^}]*\bBG\b[^}]*\bRO\b[^}]*\}/s)
assert.match(videoDialogSource,/ro:'Videoclip explicativ'/);assert.match(videoDialogSource,/bg:'Обяснително видео'/);assert.match(videoDialogSource,/ro:'Închide'/);assert.match(videoDialogSource,/bg:'Затвори'/)
assert.match(switcherSource,/publicPicker\?label:active\.label/);assert.match(switcherSource,/className="flagLanguageClose"/,'language menu must expose one explicit close/back control');assert.equal((switcherSource.match(/className="flagLanguageClose"/g)||[]).length,1,'language menu must not duplicate the back control');assert.doesNotMatch(videoDialogSource,/heygen\.ai/,'language control must use the permanent local video paths')
assert.match(heroSource,/\bro:\{title:/);assert.match(heroSource,/\bbg:\{title:/);assert.match(heroCompatibility,/modules\/public\/HeroTitleStabilizer/)
assert.match(introSource,/\bro:\{/);assert.match(introSource,/\bbg:\{/);assert.match(introCompatibility,/modules\/public\/ProductIntroCompact/)
assert.match(explainerSource,/\['ro','🇷🇴','Română'\]/);assert.match(explainerSource,/\['bg','🇧🇬','Български'\]/);assert.match(explainerCompatibility,/modules\/public\/ExplainerVideo/)
for(const language of expectedLanguages){const path=new URL(`../public/videos/as-gold-v35-${language}.mp4`,import.meta.url);const info=await stat(path);assert.ok(info.isFile()&&info.size>1_000_000,`missing or incomplete local explainer video for ${language}`);assert.match(videoDialogSource,new RegExp(`\\/videos\\/as-gold-v35-${language}\\.mp4`))}
console.log('V35 language guard: 10 app languages, RO/BG catalogs, SVG flags, modular public components and local videos verified.')
