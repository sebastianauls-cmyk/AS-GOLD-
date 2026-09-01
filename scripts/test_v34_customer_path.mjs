import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const read=p=>fs.readFileSync(path.join(root,p),'utf8')
const fail=message=>{throw new Error(`V34: ${message}`)}
const expect=(condition,message)=>{if(!condition) fail(message)}

const layout=read('app/layout.js')
const publicLanding=read('app/modules/public/PublicLanding.js')
const navigator=read('app/modules/public/ProblemNavigator.js')
const navigatorCompatibility=read('app/components/ProblemNavigator.js')
const intro=read('app/modules/public/ProductIntroCompact.js')
const introCompatibility=read('app/components/ProductIntroCompact.js')
const jump=read('app/modules/public/caseNavigation.js')
const jumpCompatibility=read('app/components/CaseChoiceJumpEnhancer.js')
const title=read('app/modules/public/HeroTitleStabilizer.js')
const titleCompatibility=read('app/components/HeroTitleStabilizer.js')
const languages=read('app/modules/public/problemNavigatorLanguagesV36.mjs')
const languagesCompatibility=read('app/lib/problemNavigatorLanguagesV36.mjs')

expect((publicLanding.match(/<ProblemNavigator outputLanguage=\{outputLanguage\}/g)||[]).length===1,'ProblemNavigator must be rendered exactly once by PublicLanding with the customer/output language')
expect(!layout.includes('FreeEntryAfterRecommendation'),'legacy free-entry helper must not be mounted')
expect(!layout.includes('HeroProblemOrder'),'legacy DOM-reorder helper must not be mounted')

const firstActionPos=publicLanding.indexOf('<V37FirstAction language={language}')
const navPos=publicLanding.indexOf('<ProblemNavigator outputLanguage={outputLanguage}')
const videoPos=publicLanding.indexOf('<ExplainerVideo key={`${language}-${explainerSignal}`} language={language} openSignal={explainerSignal}/>')
const introPos=publicLanding.indexOf('<ProductIntroCompact language={language}/>')
expect(firstActionPos>=0&&navPos>firstActionPos&&videoPos>navPos&&introPos>videoPos,'public module order must be first action -> customer-language problem navigator -> explainer video -> product intro')
expect(!layout.includes('V37FirstAction')&&!layout.includes('ProblemNavigator')&&!layout.includes('ExplainerVideo')&&!layout.includes('ProductIntroCompact'),'public hero modules must not be mounted globally')
expect(!layout.includes('<CaseChoiceJumpEnhancer/>'),'case-choice navigation must no longer be a global enhancer')
expect(!layout.includes('<HeroCopyEnhancer/>')&&!layout.includes('<HeroTitleStabilizer/>'),'hero copy must be rendered directly by PublicLanding')
expect(publicLanding.includes("./ProblemNavigator"),'problem navigator must be owned by PublicLanding')
expect(publicLanding.includes("./ProductIntroCompact"),'product intro must be owned by PublicLanding')
expect(publicLanding.includes("./caseNavigation"),'case-choice behavior must be owned directly by public landing')
expect(publicLanding.includes("./HeroTitleStabilizer"),'hero title copy must be consumed directly by public landing')
expect(navigatorCompatibility.includes("../modules/public/ProblemNavigator"),'legacy problem navigator import must remain a compatibility re-export')
expect(introCompatibility.includes("../modules/public/ProductIntroCompact"),'legacy product intro import must remain a compatibility re-export')
expect(jumpCompatibility.includes("../modules/public/CaseChoiceJumpEnhancer"),'legacy case-choice import must remain a compatibility re-export')
expect(titleCompatibility.includes("../modules/public/HeroTitleStabilizer"),'legacy hero-title import must remain a compatibility re-export')
expect(languagesCompatibility.includes("../modules/public/problemNavigatorLanguagesV36.mjs"),'legacy problem-language path must remain a compatibility re-export')

expect(navigator.includes('<textarea ref={textRef} value={value} onChange='),'problem input must remain a controlled textarea')
expect(navigator.includes('onInput={event=>updateValue(event.currentTarget.value)}'),'mobile input events must update the controlled problem value immediately')
expect(navigator.includes('So funktioniert die Eingabe:'),'German input explanation is missing')
expect(navigator.includes('inputHelp'),'multilingual input help is missing')
expect((navigator.match(/id=\"asgold-problem-navigator-react\"/g)||[]).length===1,'problem navigator section must exist exactly once in component')
expect(navigator.includes('data-customer-language={customerLanguage}'),'problem navigator must expose the selected customer language')
expect(navigator.includes('getSpeechLocale(customerLanguage)'),'speech recognition must follow the customer language')
expect(navigator.includes('3 Dokumente kostenlos kennenlernen'),'free 3-document entry is missing from recommendation flow')

const supported=['de','en','fr','tr','pl','ru','ar','fa','ro','bg']
for(const code of supported){
  expect(intro.includes(`${code}:{title:`),`compact product intro missing language ${code}`)
  if(code==='ro'||code==='bg') expect(languages.includes(`${code}:{locale:`),`problem language profile missing ${code}`)
}
expect(languages.includes("import {problemLanguageProfiles as baseProfiles"),'V36 profile layer must include the base eight languages')
expect(languages.includes('problemLanguageProfiles={...baseProfiles,...extraProfiles}'),'V36 profile layer must merge base and extra languages')
const itemGroups=[...intro.matchAll(/items:\[(.*?)\]\}/gs)]
expect(itemGroups.length>=supported.length,'compact product intro must define benefit lists for all ten languages')
for(const group of itemGroups.slice(0,supported.length)){
  const itemCount=(group[1].match(/','/g)||[]).length+1
  expect(itemCount===4,'each compact product intro language must contain exactly four benefit points')
}

expect(title.includes('AS Gold – Klarheit, wenn Vorgänge komplex werden.'),'strong German hero headline is missing')
expect(publicLanding.includes('{hero.title}')&&publicLanding.includes('{hero.lead}'),'hero copy must be rendered directly by PublicLanding')
expect(publicLanding.includes('id="asgold-user-audience"'),'audience content must be rendered directly by PublicLanding')
expect(publicLanding.includes('jumpToPublicCaseResult()'),'case choice must invoke direct navigation from its React click handler')
expect(jump.includes("getElementById('asgold-public-case-result')"),'case navigation must target the selected result card')
expect(jump.includes("behavior:'auto'"),'case choice navigation must use a direct jump instead of slow scrolling')
expect(jump.includes('publicTop'),'case jump must account for the mobile header')
expect(!jump.includes('addEventListener'),'case navigation must not install a global click listener')
expect(!title.includes('MutationObserver')&&!title.includes('querySelector'),'hero title module must not patch the rendered DOM')

console.log('V34 customer-path regression checks passed for the modular V51–V56 customer-language flow')
