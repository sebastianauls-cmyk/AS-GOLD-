import fs from 'node:fs'

function update(path,transform){
  const before=fs.readFileSync(path,'utf8')
  const after=transform(before)
  if(after!==before)fs.writeFileSync(path,after)
}

function replaceOnce(text,from,to,label){
  if(text.includes(to))return text
  if(!text.includes(from))throw new Error(`V56 parity patch missing target: ${label}`)
  return text.replace(from,to)
}

update('app/modules/workspace/WorkspaceApp.js',source=>{
  let text=source
  text=replaceOnce(text,
    "import { promoTranslations } from './lib/v31PromoTranslations.mjs'",
    "import { promoTranslations } from './lib/v31PromoTranslations.mjs'\nimport { orderCasesByResearch } from '../public/casePriorityV56.mjs'",
    'workspace case priority import')
  text=replaceOnce(text,
    "const [selectedPublicCase,setSelectedPublicCase] = useState('insurance')",
    "const [selectedPublicCase,setSelectedPublicCase] = useState('work')",
    'workspace default public case')
  text=replaceOnce(text,
    "useEffect(()=>{ localStorage.setItem('asgold-output-language',outputLanguage) },[outputLanguage])",
    "useEffect(()=>{\n    localStorage.setItem('asgold-output-language',outputLanguage)\n    document.documentElement.dataset.outputLanguage=outputLanguage\n    document.dispatchEvent(new CustomEvent('asgold:output-language',{detail:{language:outputLanguage}}))\n  },[outputLanguage])",
    'workspace output language signal')
  text=replaceOnce(text,
    "const cd = caseDiscoveryText[language] || caseDiscoveryText.de\n  const pa = publicAudienceText[language] || publicAudienceText.de\n  const activePublicCase = cd.cases.find(item=>item.key===selectedPublicCase) || cd.cases[0]",
    "const cd = caseDiscoveryText[language] || caseDiscoveryText.de\n  const orderedPublicCases = orderCasesByResearch(cd.cases)\n  const pa = publicAudienceText[language] || publicAudienceText.de\n  const activePublicCase = orderedPublicCases.find(item=>item.key===selectedPublicCase) || orderedPublicCases[0]",
    'workspace ordered public cases')

  const start=text.indexOf('  async function doExport(ref,type){')
  const end=text.indexOf('  async function exportMyData(){',start)
  if(start<0||end<0)throw new Error('V56 parity patch could not isolate doExport')
  let exportBlock=text.slice(start,end)
  if(!exportBlock.includes('const outputCore=getV24Copy(outputLanguage)')){
    exportBlock=exportBlock.replace(
      "    const ex=exportUi[outputLanguage]||exportUi.de\n",
      "    const ex=exportUi[outputLanguage]||exportUi.de\n    const outputCore=getV24Copy(outputLanguage)\n    const outputApprovalUi=getV25ApprovalCopy(outputLanguage)\n")
  }
  exportBlock=exportBlock.replaceAll('core.goal','outputCore.goal')
    .replaceAll('core.deadline','outputCore.deadline')
    .replaceAll('core.nextAction','outputCore.nextAction')
    .replaceAll('core.currentAssessments','outputCore.currentAssessments')
    .replaceAll('core.sourceBasis','outputCore.sourceBasis')
    .replaceAll('approvalUi.title','outputApprovalUi.title')
    .replaceAll('approvalUi[','outputApprovalUi[')
    .replaceAll('approvalUi.revision','outputApprovalUi.revision')
  text=text.slice(0,start)+exportBlock+text.slice(end)
  return text
})

update('app/modules/public/PublicLanding.js',source=>{
  let text=source
  text=replaceOnce(text,
    "import { ProductIntroCompact } from './ProductIntroCompact'",
    "import { ProductIntroCompact } from './ProductIntroCompact'\nimport { PublicLanguageModules } from './PublicLanguageModules'\nimport { orderCasesByResearch } from './casePriorityV56.mjs'\nimport { getProblemLanguageProfile } from './problemNavigatorLanguagesV36.mjs'",
    'public parity imports')
  text=replaceOnce(text,
    "  const [explainerSignal,setExplainerSignal]=useState(0)\n  function returnToPublicTop(){window.scrollTo({top:0,behavior:'smooth'})}",
    "  const [explainerSignal,setExplainerSignal]=useState(0)\n  const orderedPublicCases=orderCasesByResearch(cd.cases)\n  const problemUi=getProblemLanguageProfile(outputLanguage).ui\n  function returnToPublicTop(){window.scrollTo({top:0,behavior:'smooth'})}\n  function startProblemVoice(){const problem=document.getElementById('asgold-problem-navigator-react');const microphone=problem?.querySelector('[data-problem-voice]');if(!problem||!microphone)return;problem.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>microphone.click(),350)}",
    'public derived V56 state')
  text=replaceOnce(text,'<div className="wrap nav">','<div className="wrap nav publicHeader">','public header class')
  text=replaceOnce(text,'<div className="brand"><AppLogo/><b>AS Workspace Gold</b></div>','<div className="brand publicBrand"><AppLogo/><b>AS Workspace Gold</b></div>','public brand class')
  text=replaceOnce(text,
    "        <div className=\"publicLanguageStack\" aria-label={`${t.language} / ${t.outputLanguage}`}>\n          <div className=\"publicLanguageRow\"><span>{publicNav.interface}</span><LanguageSwitcher value={language} onChange={setLanguage} label={t.language} publicPicker onExplainer={()=>setExplainerSignal(value=>value+1)}/></div>\n          <div className=\"publicLanguageRow\"><span>{publicNav.output}</span><LanguageSwitcher value={outputLanguage} onChange={setOutputLanguage} label={t.outputLanguage}/></div>\n        </div>",
    "        <PublicLanguageModules language={language} onLanguageChange={setLanguage} outputLanguage={outputLanguage} onOutputLanguageChange={setOutputLanguage} onPlayExplainer={()=>setExplainerSignal(value=>value+1)}/>",
    'public language modules')
  text=text.replace('        <nav className="publicNavActions">','        <nav className="publicActions publicNavActions">')
  text=text.replace(`          <button type="button" className="backBtn publicBackBtn" onClick={returnToPublicTop}>{publicNav.back}</button>\n`,'')
  text=replaceOnce(text,
    "            <ProblemNavigator language={language} onRegister={()=>setScreen('register')} onSelectCase={setSelectedPublicCase}/>",
    "            <button type=\"button\" className=\"secondary heroVoiceShortcut\" aria-controls=\"asgold-problem-navigator-react\" onClick={startProblemVoice}>🎙 {problemUi.voice}</button>\n            <ProblemNavigator outputLanguage={outputLanguage} onRegister={()=>setScreen('register')} onSelectCase={setSelectedPublicCase}/>",
    'customer-language problem navigator')
  text=replaceOnce(text,
    '<ExplainerVideo language={language} openSignal={explainerSignal}/>',
    '<ExplainerVideo key={`${language}-${explainerSignal}`} language={language} openSignal={explainerSignal}/>',
    'explainer remount for presenter choice')
  text=text.replace('{cd.cases.map((item,index)=>','{orderedPublicCases.map((item,index)=>')
  text=text.replace("String(cd.cases.findIndex(item=>item.key===activePublicCase.key)+1)","String(orderedPublicCases.findIndex(item=>item.key===activePublicCase.key)+1)")
  return text
})

update('app/globals.css',source=>{
  if(source.includes('/* V56 parity: modular language/customer controls and compact mobile header. */'))return source
  return `${source}\n\n/* V56 parity: modular language/customer controls and compact mobile header. */\n.publicHeader{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px 20px;align-items:center;padding:12px 0 14px}\n.publicBrand{align-self:start;padding-top:8px}\n.publicActions{display:flex;justify-content:flex-end;align-items:center;gap:9px;flex-wrap:wrap}\n.publicActions a{min-height:42px;display:grid;place-items:center;padding:8px 12px;border:1px solid #e1e3e7;border-radius:10px;background:#fff;color:#374151;text-decoration:none;font-weight:750}\n.publicLanguageModules{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;width:100%}\n.publicLanguageModule{min-width:0;padding:14px;border:1px solid #d9c792;border-radius:16px;background:#fffdf7;box-shadow:0 5px 18px rgba(27,31,37,.06)}\n.publicLanguageTitle{display:block;margin-bottom:9px;color:#443817;font-size:1rem}\n.publicLanguageMainRow{display:flex;align-items:center;gap:9px;flex-wrap:wrap}\n.publicLanguageModule .flagLanguage{width:100%;max-width:360px}\n.publicLanguageModule .flagLanguageTrigger{width:100%;min-height:50px;justify-content:flex-start;border-color:#c9ad66;padding:9px 12px}\n.publicLanguageModule .flagLanguageTrigger .flagLanguageChevron{margin-inline-start:auto}\n.publicLanguageModule .flagLanguageMenu{inset-inline-start:0;inset-inline-end:auto;z-index:200}\n.publicPresenterLabel{display:block;margin:12px 0 7px;color:#5d4a1e;font-size:.9rem;font-weight:850}\n.publicPresenterRow{display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:8px}\n.publicPresenterRow button,.publicBackButton{min-height:46px;padding:9px 11px;border:1px solid #c9ad66;border-radius:11px;background:#fff;color:#463715;font-weight:850}\n.publicPresenterRow button.active{border:2px solid #8f6e25;background:#fff4cb;box-shadow:0 0 0 2px rgba(143,110,37,.12)}\n.publicPresenterRow .publicVideoButton{background:#2f291b;color:#fff;white-space:normal}\n.publicBackButton{white-space:nowrap;background:#fff8e8}\n.outputModule p{margin:10px 0 8px;color:#596472;line-height:1.45;font-size:.92rem}\n.outputLanguageStatus{display:block;padding:8px 10px;border-radius:10px;background:#eef8ef;color:#285c33;font-size:.9rem}\n.outputCustomerButton{width:100%;min-height:44px;margin-top:8px;padding:8px 10px;border:1px solid #8f6e25;border-radius:11px;background:#8f6e25;color:#fff;font-weight:850}\n.heroVoiceShortcut{margin:0 0 12px;border-color:#c9ad66;background:#fffaf0;color:#4f3c12}\n.publicTop{position:relative;top:auto}\n@media(max-width:760px){\n  .publicHeader{grid-template-columns:1fr;gap:9px;padding:8px 0 10px}\n  .publicBrand{justify-content:center;padding-top:0}\n  .publicActions{display:grid;grid-template-columns:1fr 1fr;width:100%;gap:7px}\n  .publicActions a,.publicActions button{width:100%;min-height:42px;padding:7px 8px;font-size:.88rem;text-align:center}\n  .publicLanguageModules{grid-column:1;grid-template-columns:1fr;gap:9px}\n  .publicLanguageModule{padding:10px;border-radius:14px}\n  .publicLanguageTitle{margin-bottom:7px;font-size:.9rem}\n  .publicLanguageMainRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px}\n  .publicLanguageModule .flagLanguage{width:100%;max-width:none;min-width:0}\n  .publicLanguageModule .flagLanguageTrigger{min-height:44px;padding:7px 10px}\n  .publicBackButton{min-height:44px;padding:7px 10px}\n  .publicPresenterLabel{margin:8px 0 6px;font-size:.82rem}\n  .publicPresenterRow{grid-template-columns:1fr 1fr;gap:6px}\n  .publicPresenterRow button{min-height:42px;padding:7px 8px;font-size:.88rem}\n  .publicPresenterRow .publicVideoButton{grid-column:1/-1}\n  .outputModule p{display:none}\n  .outputLanguageStatus{margin-top:7px;padding:7px 9px;font-size:.82rem}\n  .legalMarketBar .wrap{padding-top:.5rem;padding-bottom:.5rem}\n}\n`
})

console.log('V46 parity patch applied: V51-V56 public language, mobile input, output language and case-priority behavior preserved in modular owners.')
