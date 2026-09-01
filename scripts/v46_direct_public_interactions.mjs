import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const write=(path,content)=>fs.writeFileSync(path,content)

function makeHeroCatalogOnly(){
  const path='app/modules/public/HeroCopyEnhancer.js'
  let source=read(path)
  source=source.replace("'use client'\n\nimport { useEffect } from 'react'\n\n",'')
  source=source.replace('const heroCopy={','export const heroCopy={')
  source=source.replace('const audienceCopy={','export const audienceCopy={')
  const cut=source.indexOf('\nfunction ensureAudienceBlock')
  if(cut<0 && !source.includes('export function HeroCopyEnhancer(){ return null }')) throw new Error('V46 public direct: HeroCopyEnhancer cut marker missing')
  if(cut>=0) source=source.slice(0,cut)+"\n\nexport function HeroCopyEnhancer(){ return null }\n"
  write(path,source)
}

function makeHeroTitleCatalogOnly(){
  const path='app/modules/public/HeroTitleStabilizer.js'
  let source=read(path)
  source=source.replace("'use client'\n\nimport { useEffect } from 'react'\n\n",'')
  source=source.replace('const copy={','export const heroTitleCopy={')
  const cut=source.indexOf('\nexport function HeroTitleStabilizer')
  if(cut<0 && !source.includes('export function HeroTitleStabilizer(){ return null }')) throw new Error('V46 public direct: HeroTitleStabilizer cut marker missing')
  if(cut>=0) source=source.slice(0,cut)+"\n\nexport function HeroTitleStabilizer(){ return null }\n"
  write(path,source)
}

function createCaseNavigation(){
  const path='app/modules/public/caseNavigation.js'
  const source=`export function jumpToPublicCaseResult(){\n  if(typeof window==='undefined') return\n  const jump=()=>{\n    const result=document.getElementById('asgold-public-case-result')\n    if(!result) return\n    const sticky=document.querySelector('.publicTop')\n    const offset=(sticky?.getBoundingClientRect().height||0)+12\n    const top=Math.max(0,window.scrollY+result.getBoundingClientRect().top-offset)\n    window.scrollTo({top,behavior:'auto'})\n  }\n  requestAnimationFrame(()=>requestAnimationFrame(jump))\n  window.setTimeout(jump,80)\n}\n`
  write(path,source)
  write('app/modules/public/CaseChoiceJumpEnhancer.js',"export { jumpToPublicCaseResult } from './caseNavigation'\nexport function CaseChoiceJumpEnhancer(){ return null }\n")
}

function updatePublicLanding(){
  const path='app/modules/public/PublicLanding.js'
  let source=read(path)
  const importAnchor="import { AppLogo } from '../workspace/AppLogo'"
  if(!source.includes("import { heroTitleCopy } from './HeroTitleStabilizer'")){
    source=source.replace(importAnchor,`${importAnchor}\nimport { heroTitleCopy } from './HeroTitleStabilizer'\nimport { audienceCopy } from './HeroCopyEnhancer'\nimport { jumpToPublicCaseResult } from './caseNavigation'`)
  }
  const functionAnchor='export function PublicLanding({t,a,language,setLanguage,outputLanguage,setOutputLanguage,setScreen,cd,testerLinkText,pa,activePublicCase,setSelectedPublicCase,tt,jl,localizedPlans,rt,selectedGoal,setSelectedGoal,setShowRecommendation,showRecommendation,recommendedPlan,recommendedTier,eur,period,terms,monthsLabel}){\n'
  if(!source.includes('  const hero=heroTitleCopy[language]||heroTitleCopy.de')){
    if(!source.includes(functionAnchor)) throw new Error('V46 public direct: PublicLanding function anchor missing')
    source=source.replace(functionAnchor,functionAnchor+"  const hero=heroTitleCopy[language]||heroTitleCopy.de\n  const audience=audienceCopy[language]||audienceCopy.de\n")
  }
  source=source.replace('<h1>{t.hero}</h1>','<h1>{hero.title}</h1>')
  source=source.replace('<p className="lead">{t.lead}</p>','<p className="lead">{hero.lead}</p>')
  const caseIntro='<div className="caseIntro"><div className="eyebrow">{cd.eyebrow}</div><h2>{cd.title}</h2><p className="lead">{cd.lead}</p></div>'
  if(!source.includes('id="asgold-user-audience"')){
    const audienceBlock=`${caseIntro}\n          <section id="asgold-user-audience" style={{margin:'0 0 34px',padding:'24px',border:'1px solid #e2d6b7',borderRadius:'20px',background:'linear-gradient(135deg,#fffaf0,#fff)'}}>\n            <div className="eyebrow">{audience.title}</div><h2 style={{margin:'8px 0 8px',fontSize:'clamp(1.7rem,5vw,2.5rem)'}}>{audience.title}</h2><p style={{margin:'0 0 18px',color:'#5f6976',lineHeight:1.5}}>{audience.lead}</p>\n            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:'12px'}}>{audience.items.map(([title,text])=><article key={title} style={{background:'#fff',border:'1px solid #e3e5e9',borderRadius:'14px',padding:'16px'}}><b style={{display:'block',marginBottom:'7px',color:'#5e4818'}}>{title}</b><span style={{color:'#626c78',lineHeight:1.45}}>{text}</span></article>)}</div>\n          </section>`
    if(!source.includes(caseIntro)) throw new Error('V46 public direct: case intro anchor missing')
    source=source.replace(caseIntro,audienceBlock)
  }
  source=source.replace("onClick={()=>setSelectedPublicCase(item.key)} key={item.key}","onClick={()=>{setSelectedPublicCase(item.key);jumpToPublicCaseResult()}} key={item.key}")
  source=source.replace('<article className="caseResult" aria-live="polite">','<article id="asgold-public-case-result" className="caseResult" aria-live="polite">')
  write(path,source)
}

function updateLayout(){
  const path='app/layout.js'
  let source=read(path)
  for(const line of [
    "import { HeroCopyEnhancer } from './modules/public/HeroCopyEnhancer'\n",
    "import { HeroTitleStabilizer } from './modules/public/HeroTitleStabilizer'\n",
    "import { CaseChoiceJumpEnhancer } from './modules/public/CaseChoiceJumpEnhancer'\n"
  ]) source=source.replace(line,'')
  source=source.replace('<AccessibilityHardening/><MobileResilience/><HeroCopyEnhancer/><HeroTitleStabilizer/><V37FirstAction/><ProblemNavigator/><ExplainerVideo/><ProductIntroCompact/><CaseChoiceJumpEnhancer/>','<AccessibilityHardening/><MobileResilience/><V37FirstAction/><ProblemNavigator/><ExplainerVideo/><ProductIntroCompact/>')
  write(path,source)
}

function updateTests(){
  const path='scripts/test_v34_customer_path.mjs'
  let source=read(path)
  if(!source.includes("const publicLanding=read('app/modules/public/PublicLanding.js')")){
    source=source.replace("const layout=read('app/layout.js')","const layout=read('app/layout.js')\nconst publicLanding=read('app/modules/public/PublicLanding.js')")
  }
  source=source.replace("const jump=read('app/modules/public/CaseChoiceJumpEnhancer.js')","const jump=read('app/modules/public/caseNavigation.js')")
  source=source.replace("const firstActionPos=layout.indexOf('<V37FirstAction/>')\nconst navPos=layout.indexOf('<ProblemNavigator/>')\nconst introPos=layout.indexOf('<ProductIntroCompact/>')\nconst jumpPos=layout.indexOf('<CaseChoiceJumpEnhancer/>')\nexpect(firstActionPos>=0&&navPos>firstActionPos&&introPos>navPos&&jumpPos>introPos,'layout order must be first action -> problem navigator -> product intro -> case jump enhancer')","const firstActionPos=layout.indexOf('<V37FirstAction/>')\nconst navPos=layout.indexOf('<ProblemNavigator/>')\nconst introPos=layout.indexOf('<ProductIntroCompact/>')\nexpect(firstActionPos>=0&&navPos>firstActionPos&&introPos>navPos,'layout order must be first action -> problem navigator -> product intro')\nexpect(!layout.includes('<CaseChoiceJumpEnhancer/>'),'case-choice navigation must no longer be a global enhancer')\nexpect(!layout.includes('<HeroCopyEnhancer/>')&&!layout.includes('<HeroTitleStabilizer/>'),'hero copy must be rendered directly by PublicLanding')")
  source=source.replace("expect(layout.includes(\"./modules/public/CaseChoiceJumpEnhancer\"),'case-choice behavior must be owned by public module')\nexpect(layout.includes(\"./modules/public/HeroTitleStabilizer\"),'hero title behavior must be owned by public module')","expect(publicLanding.includes(\"./caseNavigation\"),'case-choice behavior must be owned directly by public landing')\nexpect(publicLanding.includes(\"./HeroTitleStabilizer\"),'hero title copy must be consumed directly by public landing')")
  source=source.replace("expect(title.includes('AS Gold – Klarheit, wenn Vorgänge komplex werden.'),'strong German hero headline is missing')\nexpect(jump.includes(\".caseChooser .caseChoice\"),'01-08 case choice listener is missing')\nexpect(jump.includes(\"#fallarten .caseResult\"),'case choice must target the selected result card')\nexpect(jump.includes(\"behavior:'auto'\"),'case choice navigation must use a direct jump instead of slow scrolling')\nexpect(jump.includes('publicTop'),'case jump must account for the sticky mobile header')","expect(title.includes('AS Gold – Klarheit, wenn Vorgänge komplex werden.'),'strong German hero headline is missing')\nexpect(publicLanding.includes('{hero.title}')&&publicLanding.includes('{hero.lead}'),'hero copy must be rendered directly by PublicLanding')\nexpect(publicLanding.includes('id=\"asgold-user-audience\"'),'audience content must be rendered directly by PublicLanding')\nexpect(publicLanding.includes('jumpToPublicCaseResult()'),'case choice must invoke direct navigation from its React click handler')\nexpect(jump.includes(\"getElementById('asgold-public-case-result')\"),'case navigation must target the selected result card')\nexpect(jump.includes(\"behavior:'auto'\"),'case choice navigation must use a direct jump instead of slow scrolling')\nexpect(jump.includes('publicTop'),'case jump must account for the sticky mobile header')\nexpect(!jump.includes('addEventListener'),'case navigation must not install a global click listener')\nexpect(!title.includes('MutationObserver')&&!title.includes('querySelector'),'hero title module must not patch the rendered DOM')")
  write(path,source)

  const guardPath='scripts/test_v46_modular_boundaries.mjs'
  let guard=read(guardPath)
  if(!guard.includes("'app/modules/public/caseNavigation.js',")) guard=guard.replace("  'app/modules/public/PublicLanding.js',","  'app/modules/public/PublicLanding.js',\n  'app/modules/public/caseNavigation.js',")
  const layoutAnchor="assert.doesNotMatch(layout,/V43VisibilityFix|V44LanguageOrder|V38IntegrationAvailabilityGuard/)"
  if(!guard.includes('HeroCopyEnhancer|HeroTitleStabilizer|CaseChoiceJumpEnhancer')) guard=guard.replace(layoutAnchor,layoutAnchor+"\nassert.doesNotMatch(layout,/HeroCopyEnhancer|HeroTitleStabilizer|CaseChoiceJumpEnhancer/)")
  const publicAnchor="assert.ok(outputControl>interfaceControl,'output language must follow interface language in natural source order')"
  if(!guard.includes('audience content must be direct React markup')) guard=guard.replace(publicAnchor,publicAnchor+"\nassert.match(publicLanding,/id=\\\"asgold-user-audience\\\"/,'audience content must be direct React markup')\nassert.match(publicLanding,/jumpToPublicCaseResult\\(\\)/,'case selection must trigger direct React-owned navigation')\nconst heroTitleModule=read('app/modules/public/HeroTitleStabilizer.js')\nconst heroCopyModule=read('app/modules/public/HeroCopyEnhancer.js')\nconst caseNavigation=read('app/modules/public/caseNavigation.js')\nassert.doesNotMatch(heroTitleModule,/MutationObserver|querySelector|useEffect/)\nassert.doesNotMatch(heroCopyModule,/MutationObserver|querySelector|createElement|innerHTML|useEffect/)\nassert.doesNotMatch(caseNavigation,/addEventListener/)\nassert.match(caseNavigation,/getElementById\\('asgold-public-case-result'\\)/)")
  write(guardPath,guard)
}

function updateDocs(){
  const docsPath='docs/APP_GOLD_MODULARISIERUNG_V46.md'
  let docs=read(docsPath)
  if(!docs.includes('V46 Direkte Public-Interaktionen')) docs += `\n\n### V46 Direkte Public-Interaktionen\n\n- Hero-Titel und Hero-Lead werden direkt von \`PublicLanding.js\` aus fachlichen Sprachkatalogen gerendert; MutationObserver-/querySelector-Korrekturen sind dort nicht mehr aktiv.\n- Der ausführliche Zielgruppenblock wird direkt als React-Markup in der öffentlichen Oberfläche gerendert.\n- Die Auswahl einer Fallart löst die Navigation zum Ergebnis direkt im React-onClick aus. Ein globaler document-click-Listener ist nicht mehr erforderlich.\n- \`HeroCopyEnhancer\`, \`HeroTitleStabilizer\` und \`CaseChoiceJumpEnhancer\` bleiben nur als wirkungslose Kompatibilitätshüllen bzw. Katalogzugänge erhalten und werden nicht mehr im Root-Layout gemountet.\n- Regression- und Modulgrenzen-Tests erzwingen, dass diese drei Bereiche nicht wieder als globale DOM-Nachrüstungen eingeführt werden.\n`
  write(docsPath,docs)
}

makeHeroCatalogOnly()
makeHeroTitleCatalogOnly()
createCaseNavigation()
updatePublicLanding()
updateLayout()
updateTests()
updateDocs()
console.log('V46 public hero, audience and case selection now use direct React/module interactions without global DOM enhancers.')
