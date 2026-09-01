import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const write=(path,content)=>fs.writeFileSync(path,content)

function directFirstAction(){
  const path='app/modules/public/V37FirstAction.js'
  let source=read(path)
  const exportIndex=source.indexOf('export function V37FirstAction')
  if(exportIndex<0) throw new Error('V46 embed public: V37FirstAction export missing')
  let prefix=source.slice(0,exportIndex)
  prefix=prefix.replace("'use client'\n\nimport { useEffect, useState } from 'react'\nimport { createPortal } from 'react-dom'\n\n","'use client'\n\nimport { useState } from 'react'\n\n")
  const body=`export function V37FirstAction({language='de',onRegister}){\n  const [showExample,setShowExample]=useState(false)\n  const c=copy[language]||copy.de\n  const rtl=language==='ar'||language==='fa'\n  const primary={padding:'13px 16px',border:0,borderRadius:12,background:'#8f6e25',color:'#fff',fontWeight:900,fontSize:'1rem',cursor:'pointer'}\n  const secondary={...primary,background:'#fff',color:'#5b4618',border:'1px solid #d8c58d'}\n  const focusProblem=()=>{const el=document.querySelector('#asgold-problem-navigator-react textarea');if(el){el.scrollIntoView({behavior:'smooth',block:'center'});window.setTimeout(()=>el.focus(),350)}}\n  const upload=()=>onRegister?.()\n  return <section id="asgold-v37-first-action" dir={rtl?'rtl':'ltr'} style={{margin:'18px 0 14px',padding:18,border:'2px solid #c6a553',borderRadius:18,background:'linear-gradient(135deg,#fff9e8,#fff)',boxShadow:'0 12px 30px rgba(72,55,18,.08)'}}>\n    <b style={{display:'block',fontSize:'1.45rem',color:'#4d3b14'}}>{c.title}</b>\n    <p style={{margin:'7px 0 14px',color:'#5f6976',lineHeight:1.45}}>{c.lead}</p>\n    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10}}>\n      <button type='button' onClick={focusProblem} style={primary}>✍️ {c.problem}</button>\n      <button type='button' onClick={upload} style={secondary}>📎 {c.upload}</button>\n      <button type='button' onClick={()=>setShowExample(v=>!v)} style={secondary}>👁 {c.example}</button>\n    </div>\n    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>{c.trust.map(x=><span key={x} style={{padding:'6px 9px',borderRadius:999,background:'#fff',border:'1px solid #e2d6b7',fontSize:'.82rem',color:'#5c6570'}}>✓ {x}</span>)}</div>\n    {showExample&&<article style={{marginTop:14,padding:14,borderRadius:14,background:'#fff',border:'1px solid #e2d6b7'}}><b style={{display:'block',color:'#4d3b14',marginBottom:4}}>{c.sampleTitle}</b><p style={{margin:'0 0 10px',color:'#626c78'}}>{c.sampleCase}</p><div style={{display:'grid',gap:7}}><div>🟢 <b>{c.have}:</b> {c.haveText}</div><div>🟡 <b>{c.open}:</b> {c.openText}</div><div>🔴 <b>{c.deadline}:</b> {c.deadlineText}</div><div>➡️ <b>{c.next}:</b> {c.nextText}</div></div><button type='button' onClick={()=>setShowExample(false)} style={{...secondary,marginTop:12,padding:'8px 11px'}}>{c.close}</button></article>}\n  </section>\n}\n`
  write(path,prefix+body)
}

function directProductIntro(){
  const path='app/modules/public/ProductIntroCompact.js'
  let source=read(path)
  const exportIndex=source.indexOf('export function ProductIntroCompact')
  if(exportIndex<0) throw new Error('V46 embed public: ProductIntroCompact export missing')
  let prefix=source.slice(0,exportIndex)
  prefix=prefix.replace("'use client'\n\nimport { useEffect, useState } from 'react'\nimport { createPortal } from 'react-dom'\n\n",'')
  const body=`export function ProductIntroCompact({language='de'}){\n  const c=copy[language]||copy.de\n  const rtl=language==='ar'||language==='fa'\n  return <section id="asgold-product-intro-compact" dir={rtl?'rtl':'ltr'} style={{margin:'18px 0 8px',padding:16,border:'1px solid #dccb9f',borderRadius:18,background:'linear-gradient(135deg,#fffaf0,#fff)',boxShadow:'0 8px 24px rgba(72,55,18,.05)'}}>\n    <b style={{display:'block',fontSize:'1.3rem',color:'#4d3b14'}}>{c.title}</b>\n    <p style={{margin:'6px 0 10px',color:'#596472',lineHeight:1.4}}>{c.lead}</p>\n    <div style={{display:'grid',gap:7}}>{c.items.map(item=><div key={item} style={{padding:'8px 10px',borderRadius:10,background:'#fff',border:'1px solid #ece4cf',color:'#4f5966',lineHeight:1.3}}>✓ {item}</div>)}</div>\n  </section>\n}\n`
  write(path,prefix+body)
}

function directExplainer(){
  const path='app/modules/public/ExplainerVideo.js'
  let source=read(path)
  source=source.replace("import { useEffect, useState } from 'react'\nimport { createPortal } from 'react-dom'","import { useEffect, useState } from 'react'")
  const exportIndex=source.indexOf('export function ExplainerVideo')
  if(exportIndex<0) throw new Error('V46 embed public: ExplainerVideo export missing')
  const prefix=source.slice(0,exportIndex)
  const fn=source.slice(exportIndex)
  const cIndex=fn.indexOf('  const c=copy[uiLanguage]||copy.de')
  if(cIndex<0){
    if(fn.includes("export function ExplainerVideo({language='de'})")) return
    throw new Error('V46 embed public: ExplainerVideo copy anchor missing')
  }
  let tail=fn.slice(cIndex)
  tail=tail.replaceAll('uiLanguage','language')
  tail=tail.replace('  if(!host)return null\n','')
  tail=tail.replace('return createPortal(','return (')
  const portalEnd=tail.lastIndexOf(',host)')
  if(portalEnd<0) throw new Error('V46 embed public: ExplainerVideo portal terminator missing')
  tail=tail.slice(0,portalEnd)+')'+tail.slice(portalEnd+6)
  const head=`export function ExplainerVideo({language='de'}){\n  const [videoLanguage,setVideoLanguage]=useState(language)\n  const [presenter,setPresenter]=useState('female')\n  const [open,setOpen]=useState(false)\n  useEffect(()=>{\n    const savedPresenter=localStorage.getItem('asgold-video-presenter')\n    if(savedPresenter==='male'||savedPresenter==='female') setPresenter(savedPresenter)\n  },[])\n  useEffect(()=>{if(languages.some(([code])=>code===language))setVideoLanguage(language)},[language])\n  useEffect(()=>{localStorage.setItem('asgold-video-presenter',presenter)},[presenter])\n`
  write(path,prefix+head+tail)
}

function directProblemNavigator(){
  const path='app/modules/public/ProblemNavigator.js'
  let source=read(path)
  source=source.replace("import { useEffect, useMemo, useRef, useState } from 'react'\nimport { createPortal } from 'react-dom'","import { useMemo, useRef, useState } from 'react'")
  source=source.replace("from '../../lib/problemNavigatorLanguagesV36.mjs'","from './problemNavigatorLanguagesV36.mjs'")
  if(!source.includes("import { jumpToPublicCaseResult } from './caseNavigation'")){
    const anchor="import { getProblemLanguageProfile, getSpeechLocale, multilingualKeywords, normalizeProblemLanguage } from './problemNavigatorLanguagesV36.mjs'"
    source=source.replace(anchor,`${anchor}\nimport { jumpToPublicCaseResult } from './caseNavigation'`)
  }
  const exportIndex=source.indexOf('export function ProblemNavigator')
  if(exportIndex<0) throw new Error('V46 embed public: ProblemNavigator export missing')
  const prefix=source.slice(0,exportIndex)
  const fn=source.slice(exportIndex)
  const recommendationIndex=fn.indexOf('  const recommendation=useMemo')
  if(recommendationIndex<0){
    if(fn.includes("export function ProblemNavigator({language='de'")) return
    throw new Error('V46 embed public: ProblemNavigator recommendation anchor missing')
  }
  let tail=fn.slice(recommendationIndex)
  tail=tail.replace('  if(!host) return null\n\n','')
  const showCaseStart=tail.indexOf('  function showCase(){')
  const stylesStart=tail.indexOf('  const secondary=',showCaseStart)
  if(showCaseStart<0||stylesStart<0) throw new Error('V46 embed public: ProblemNavigator actions anchors missing')
  tail=tail.slice(0,showCaseStart)+`  function showCase(){\n    onSelectCase?.(recommendation.caseKey)\n    jumpToPublicCaseResult()\n  }\n  function showPlans(){document.getElementById('preise')?.scrollIntoView({behavior:'smooth',block:'start'})}\n  function startFree(){onRegister?.()}\n\n`+tail.slice(stylesStart)
  tail=tail.replace('return createPortal(','return (')
  const portalEnd=tail.lastIndexOf(',host)')
  if(portalEnd<0) throw new Error('V46 embed public: ProblemNavigator portal terminator missing')
  tail=tail.slice(0,portalEnd)+')'+tail.slice(portalEnd+6)
  const head=`export function ProblemNavigator({language='de',onRegister,onSelectCase}){\n  const [value,setValue]=useState('')\n  const [status,setStatus]=useState('')\n  const [result,setResult]=useState(null)\n  const [listening,setListening]=useState(false)\n  const recognitionRef=useRef(null)\n  const textRef=useRef(null)\n  const normalizedLanguage=normalizeProblemLanguage(language)\n  const profile=getProblemLanguageProfile(normalizedLanguage)\n  const c=profile.ui\n\n`
  tail=tail.replaceAll('getSpeechLocale(language)','getSpeechLocale(normalizedLanguage)')
  tail=tail.replaceAll('freeLabels[language]','freeLabels[normalizedLanguage]')
  tail=tail.replaceAll('inputHelp[language]','inputHelp[normalizedLanguage]')
  tail=tail.replaceAll('inputTitles[language]','inputTitles[normalizedLanguage]')
  write(path,prefix+head+tail)
}

function embedInPublicLanding(){
  const path='app/modules/public/PublicLanding.js'
  let source=read(path)
  const importAnchor="import { jumpToPublicCaseResult } from './caseNavigation'"
  const imports=[
    "import { V37FirstAction } from './V37FirstAction'",
    "import { ProblemNavigator } from './ProblemNavigator'",
    "import { ExplainerVideo } from './ExplainerVideo'",
    "import { ProductIntroCompact } from './ProductIntroCompact'"
  ]
  if(!source.includes(imports[0])) source=source.replace(importAnchor,importAnchor+'\n'+imports.join('\n'))
  const lead='<p className="lead">{hero.lead}</p>'
  if(!source.includes('<V37FirstAction language={language}')){
    const modules=`${lead}\n            <V37FirstAction language={language} onRegister={()=>setScreen('register')}/>\n            <ProblemNavigator language={language} onRegister={()=>setScreen('register')} onSelectCase={setSelectedPublicCase}/>\n            <ExplainerVideo language={language}/>\n            <ProductIntroCompact language={language}/>`
    if(!source.includes(lead)) throw new Error('V46 embed public: hero lead anchor missing')
    source=source.replace(lead,modules)
  }
  write(path,source)
}

function cleanLayout(){
  const path='app/layout.js'
  let source=read(path)
  for(const line of [
    "import { V37FirstAction } from './modules/public/V37FirstAction'\n",
    "import { ProductIntroCompact } from './modules/public/ProductIntroCompact'\n",
    "import { ExplainerVideo } from './modules/public/ExplainerVideo'\n",
    "import { ProblemNavigator } from './modules/public/ProblemNavigator'\n"
  ]) source=source.replace(line,'')
  source=source.replace('<AccessibilityHardening/><MobileResilience/><V37FirstAction/><ProblemNavigator/><ExplainerVideo/><ProductIntroCompact/>','<AccessibilityHardening/><MobileResilience/>')
  write(path,source)
}

function updateRegressionTests(){
  const v34Path='scripts/test_v34_customer_path.mjs'
  let v34=read(v34Path)
  v34=v34.replace("expect((layout.match(/<ProblemNavigator\\s*\\/>/g)||[]).length===1,'ProblemNavigator must be mounted exactly once')","expect((publicLanding.match(/<ProblemNavigator language=\\{language\\}/g)||[]).length===1,'ProblemNavigator must be rendered exactly once by PublicLanding')")
  const orderStart=v34.indexOf("const firstActionPos=layout.indexOf('<V37FirstAction/>')")
  const orderEnd=v34.indexOf("expect(!layout.includes('<CaseChoiceJumpEnhancer/>')",orderStart)
  if(orderStart>=0&&orderEnd>orderStart){
    const replacement=`const firstActionPos=publicLanding.indexOf('<V37FirstAction language={language}')\nconst navPos=publicLanding.indexOf('<ProblemNavigator language={language}')\nconst videoPos=publicLanding.indexOf('<ExplainerVideo language={language}/>')\nconst introPos=publicLanding.indexOf('<ProductIntroCompact language={language}/>')\nexpect(firstActionPos>=0&&navPos>firstActionPos&&videoPos>navPos&&introPos>videoPos,'public module order must be first action -> problem navigator -> explainer video -> product intro')\nexpect(!layout.includes('V37FirstAction')&&!layout.includes('ProblemNavigator')&&!layout.includes('ExplainerVideo')&&!layout.includes('ProductIntroCompact'),'public hero modules must not be mounted globally')\n`
    v34=v34.slice(0,orderStart)+replacement+v34.slice(orderEnd)
  }
  v34=v34.replace("expect(layout.includes(\"./modules/public/ProblemNavigator\"),'problem navigator must be owned by public module')\nexpect(layout.includes(\"./modules/public/ProductIntroCompact\"),'product intro must be owned by public module')","expect(publicLanding.includes(\"./ProblemNavigator\"),'problem navigator must be owned by PublicLanding')\nexpect(publicLanding.includes(\"./ProductIntroCompact\"),'product intro must be owned by PublicLanding')")
  write(v34Path,v34)

  const v36Path='scripts/test_v36_explainer_video.mjs'
  let v36=read(v36Path)
  v36=v36.replace("assert.match(explainerSource,/const rtl=uiLanguage==='ar'\\|\\|uiLanguage==='fa'/)","assert.match(explainerSource,/const rtl=language==='ar'\\|\\|language==='fa'/)\nassert.doesNotMatch(explainerSource,/createPortal|MutationObserver|document\\.createElement/,'explainer video must render directly without a portal/DOM mount observer')")
  write(v36Path,v36)

  const v37Path='scripts/test_v37_first_action.mjs'
  let v37=read(v37Path)
  if(!v37.includes("const publicLanding=fs.readFileSync('app/modules/public/PublicLanding.js'")) v37=v37.replace("const layout=fs.readFileSync('app/layout.js','utf8')","const layout=fs.readFileSync('app/layout.js','utf8')\nconst publicLanding=fs.readFileSync('app/modules/public/PublicLanding.js','utf8')")
  v37=v37.replace("if(!layout.includes(\"./modules/public/V37FirstAction\")) throw new Error('V37 guard: first-action module is not mounted in layout')\nif(!layout.includes(\"./modules/public/ExplainerVideo\")) throw new Error('V37 guard: explainer module is not mounted in layout')","if(!publicLanding.includes(\"./V37FirstAction\")) throw new Error('V37 guard: first-action module is not owned by PublicLanding')\nif(!publicLanding.includes(\"./ExplainerVideo\")) throw new Error('V37 guard: explainer module is not owned by PublicLanding')\nif(layout.includes('V37FirstAction')||layout.includes('ExplainerVideo')||layout.includes('ProblemNavigator')||layout.includes('ProductIntroCompact')) throw new Error('V37 guard: public hero modules must not be global layout enhancers')")
  v37=v37.replace("if(!firstAction.includes('input[type=\"file\"]')) throw new Error('V37 guard: upload action no longer targets file upload')","if(!firstAction.includes('onRegister?.()')) throw new Error('V37 guard: upload action must enter the registration/upload path directly')")
  const oldOrder="const firstActionIndex=layout.indexOf('<V37FirstAction/>')\nconst problemIndex=layout.indexOf('<ProblemNavigator/>')\nconst videoIndex=layout.indexOf('<ExplainerVideo/>')\nconst productIndex=layout.indexOf('<ProductIntroCompact/>')\nif(!(firstActionIndex>=0 && problemIndex>firstActionIndex && videoIndex>problemIndex && productIndex>videoIndex)) throw new Error('V37 guard: homepage priority order must be first action -> problem navigator -> optional video -> product details')"
  const newOrder="const firstActionIndex=publicLanding.indexOf('<V37FirstAction language={language}')\nconst problemIndex=publicLanding.indexOf('<ProblemNavigator language={language}')\nconst videoIndex=publicLanding.indexOf('<ExplainerVideo language={language}/>')\nconst productIndex=publicLanding.indexOf('<ProductIntroCompact language={language}/>')\nif(!(firstActionIndex>=0 && problemIndex>firstActionIndex && videoIndex>problemIndex && productIndex>videoIndex)) throw new Error('V37 guard: homepage priority order must be first action -> problem navigator -> optional video -> product details')\nif(firstAction.includes('createPortal')||firstAction.includes('MutationObserver')||video.includes('createPortal')||video.includes('MutationObserver')) throw new Error('V37 guard: public modules must render directly without portal mount observers')"
  v37=v37.replace(oldOrder,newOrder)
  write(v37Path,v37)

  const e2ePath='scripts/test_v37_end_to_end.mjs'
  let e2e=read(e2ePath)
  e2e=e2e.replace("mustContain(layout,'V37FirstAction','V37 first-action mount')\nmustContain(layout,\"./modules/public/V37FirstAction\",'V37 first-action module ownership')\nmustContain(layout,'ProblemNavigator','problem navigator mount')\nmustContain(layout,\"./modules/public/ProblemNavigator\",'problem navigator module ownership')","mustContain(publicLanding,'V37FirstAction','V37 first-action direct public mount')\nmustContain(publicLanding,\"./V37FirstAction\",'V37 first-action public ownership')\nmustContain(publicLanding,'ProblemNavigator','problem navigator direct public mount')\nmustContain(publicLanding,\"./ProblemNavigator\",'problem navigator public ownership')\nif(layout.includes('V37FirstAction')||layout.includes('ProblemNavigator')) throw new Error('V37 E2E guard: public interaction modules must not be global layout mounts')")
  write(e2ePath,e2e)

  const guardPath='scripts/test_v46_modular_boundaries.mjs'
  let guard=read(guardPath)
  const publicAnchor="assert.match(publicLanding,/className=\"publicTop\"/)"
  if(!guard.includes('public portal modules must not be mounted globally')){
    guard=guard.replace(publicAnchor,publicAnchor+"\nfor(const name of ['V37FirstAction','ProblemNavigator','ExplainerVideo','ProductIntroCompact']) assert.doesNotMatch(layout,new RegExp(name),'public portal modules must not be mounted globally')\nassert.match(publicLanding,/V37FirstAction/)\nassert.match(publicLanding,/ProblemNavigator/)\nassert.match(publicLanding,/ExplainerVideo/)\nassert.match(publicLanding,/ProductIntroCompact/)\nfor(const path of ['app/modules/public/V37FirstAction.js','app/modules/public/ProblemNavigator.js','app/modules/public/ExplainerVideo.js','app/modules/public/ProductIntroCompact.js']) {\n  const source=read(path)\n  assert.doesNotMatch(source,/createPortal|MutationObserver|document\\.createElement/,'public module must render directly: '+path)\n}")
  }
  write(guardPath,guard)
}

function updateDocs(){
  const path='docs/APP_GOLD_MODULARISIERUNG_V46.md'
  let docs=read(path)
  if(!docs.includes('V46 Public-Module direkt eingebettet')) docs += `\n\n### V46 Public-Module direkt eingebettet\n\n- \`V37FirstAction\`, \`ProblemNavigator\`, \`ExplainerVideo\` und \`ProductIntroCompact\` werden direkt von \`PublicLanding.js\` gerendert.\n- Die vier Komponenten benötigen keine \`createPortal\`-Slots, keine \`MutationObserver\` und keine dynamisch erzeugten DOM-Container mehr.\n- Sprache wird als React-Prop weitergegeben statt über Beobachter auf \`document.documentElement.lang\` synchronisiert.\n- Der Problem-Navigator wechselt Fallart und Registrierung über explizite Callback-Props; Preis- und Ergebnisnavigation bleiben lokale, nutzerinitiierte Scroll-Aktionen.\n- Das Root-Layout enthält damit keine Public-Hero-Portalmodule mehr.\n- Regressionstests prüfen die direkte Reihenfolge und verhindern die Rückkehr globaler Mount-Observer.\n`
  write(path,docs)
}

directFirstAction()
directProductIntro()
directExplainer()
directProblemNavigator()
embedInPublicLanding()
cleanLayout()
updateRegressionTests()
updateDocs()
console.log('V46 public first action, problem navigator, explainer video and product intro embedded directly in PublicLanding.')
