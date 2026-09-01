import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const write=(path,content)=>fs.writeFileSync(path,content)
const must=(condition,message)=>{if(!condition)throw new Error(message)}

function portPublicLanding(){
  const path='app/modules/public/PublicLanding.js'
  let source=read(path)
  if(!source.startsWith("'use client'")) source="'use client'\n\nimport { useState } from 'react'\n"+source
  else if(!source.includes("import { useState } from 'react'")) source=source.replace("'use client'\n","'use client'\n\nimport { useState } from 'react'\n")

  if(!source.includes('const publicNavigationCopy=')){
    const copy=`const publicNavigationCopy={\n  de:{interface:'1. Sprache der Oberfläche',output:'2. Ausgabesprache',back:'← Zurück'},\n  en:{interface:'1. Interface language',output:'2. Output language',back:'← Back'},\n  fr:{interface:\"1. Langue de l’interface\",output:'2. Langue de sortie',back:'← Retour'},\n  tr:{interface:'1. Arayüz dili',output:'2. Çıktı dili',back:'← Geri'},\n  pl:{interface:'1. Język interfejsu',output:'2. Język wyniku',back:'← Wstecz'},\n  ru:{interface:'1. Язык интерфейса',output:'2. Язык результата',back:'← Назад'},\n  ar:{interface:'1. لغة الواجهة',output:'2. لغة الإخراج',back:'الرجوع →'},\n  fa:{interface:'1. زبان رابط',output:'2. زبان خروجی',back:'بازگشت →'},\n  ro:{interface:'1. Limba interfeței',output:'2. Limba rezultatului',back:'← Înapoi'},\n  bg:{interface:'1. Език на интерфейса',output:'2. Език на резултата',back:'← Назад'}\n}\n\n`
    source=source.replace('export function PublicLanding',copy+'export function PublicLanding')
  }

  if(!source.includes('const [explainerSignal,setExplainerSignal]')){
    const anchor="  const audience=audienceCopy[language]||audienceCopy.de\n"
    must(source.includes(anchor),'V50 port: PublicLanding audience anchor missing')
    source=source.replace(anchor,anchor+"  const publicNav=publicNavigationCopy[language]||publicNavigationCopy.de\n  const outputLanguageName=(language===outputLanguage?language:outputLanguage)\n  const outputLanguageLabel=({de:'Deutsch',en:'English',fr:'Français',tr:'Türkçe',pl:'Polski',ru:'Русский',ar:'العربية',fa:'فارسی',ro:'Română',bg:'Български'})[outputLanguageName]||'Deutsch'\n  const [explainerSignal,setExplainerSignal]=useState(0)\n  function returnToPublicTop(){window.scrollTo({top:0,behavior:'smooth'})}\n")
  }

  const oldHeader=`        <nav>\n          <div className=\"languageSwitch\"><span>{t.language}</span><LanguageSwitcher value={language} onChange={setLanguage} label={t.language}/></div>\n          <a href=\"#fallarten\">{cd.nav}</a>\n          <a href=\"#preise\">{t.prices}</a>\n          <button className=\"secondary\" onClick={()=>setScreen('register')}>{t.register}</button>\n          <button className=\"primary\" onClick={()=>setScreen('login')}>{t.login}</button>\n        </nav>`
  const newHeader=`        <div className=\"publicLanguageStack\" aria-label={\`${'${t.language} / ${t.outputLanguage}'}\`}>\n          <div className=\"publicLanguageRow\"><span>{publicNav.interface}</span><LanguageSwitcher value={language} onChange={setLanguage} label={t.language} publicPicker onExplainer={()=>setExplainerSignal(value=>value+1)}/></div>\n          <div className=\"publicLanguageRow\"><span>{publicNav.output}</span><LanguageSwitcher value={outputLanguage} onChange={setOutputLanguage} label={t.outputLanguage}/></div>\n        </div>\n        <nav className=\"publicNavActions\">\n          <button type=\"button\" className=\"backBtn publicBackBtn\" onClick={returnToPublicTop}>{publicNav.back}</button>\n          <a href=\"#fallarten\">{cd.nav}</a>\n          <a href=\"#preise\">{t.prices}</a>\n          <button className=\"secondary\" onClick={()=>setScreen('register')}>{t.register}</button>\n          <button className=\"primary\" onClick={()=>setScreen('login')}>{t.login}</button>\n        </nav>`
  if(source.includes(oldHeader)) source=source.replace(oldHeader,newHeader)
  must(source.includes('className="publicLanguageStack"'),'V50 port: public language stack missing')

  const oldLegal=`          <b>{t.legal}</b><span>{t.marketNote}</span>\n          <label>{t.outputLanguage}<LanguageSwitcher value={outputLanguage} onChange={setOutputLanguage} label={t.outputLanguage}/></label>`
  const newLegal=`          <b>{t.legal}</b><span>{t.marketNote}</span>\n          <strong className=\"legalChip\" data-output-language-status aria-live=\"polite\">{t.outputLanguage}: {outputLanguageLabel}</strong>`
  if(source.includes(oldLegal)) source=source.replace(oldLegal,newLegal)
  source=source.replace('<ExplainerVideo language={language}/>','<ExplainerVideo language={language} openSignal={explainerSignal}/>')
  must(source.includes('data-output-language-status'),'V50 port: output-language status missing')
  must(source.includes('openSignal={explainerSignal}'),'V50 port: direct explainer trigger missing')
  write(path,source)
}

function portExplainer(){
  const path='app/modules/public/ExplainerVideo.js'
  let source=read(path)
  source=source.replace("de:'/videos/as-gold-v35-de.mp4'","de:'/videos/as-gold-explainer-de-female.mp4'")
  if(!source.includes('const maleLocalVideos=')) source=source.replace("const femaleRemoteVideos={","const maleLocalVideos={de:'/videos/as-gold-explainer-de-male.mp4'}\n\nconst femaleRemoteVideos={")
  source=source.replace("export function ExplainerVideo({language='de'}){","export function ExplainerVideo({language='de',openSignal=0}){")
  if(!source.includes('if(openSignal>0)setOpen(true)')) source=source.replace("  useEffect(()=>{localStorage.setItem('asgold-video-presenter',presenter)},[presenter])","  useEffect(()=>{localStorage.setItem('asgold-video-presenter',presenter)},[presenter])\n  useEffect(()=>{if(openSignal>0)setOpen(true)},[openSignal])")
  if(!source.includes('const maleLocal=')) source=source.replace("  const maleRemote=maleRemoteVideos[videoLanguage]||maleRemoteVideos.de","  const maleLocal=maleLocalVideos[videoLanguage]\n  const maleRemote=maleRemoteVideos[videoLanguage]||maleRemoteVideos.de")
  const oldVideo="<video key={`${videoLanguage}-${presenter}`} controls playsInline preload='metadata' style={{display:'block',width:'100%',borderRadius:14,background:'#151515',aspectRatio:'16 / 9'}}>{presenter==='female'&&<source src={femaleLocal} type='video/mp4'/>}<source src={presenter==='male'?maleRemote:femaleRemote} type='video/mp4'/>{presenter==='male'&&<source src={femaleRemote} type='video/mp4'/>}{c.loading}</video>"
  const newVideo="<video key={`${videoLanguage}-${presenter}`} controls playsInline preload='metadata' style={{display:'block',width:'100%',borderRadius:14,background:'#151515',aspectRatio:'16 / 9'}}>{presenter==='female'&&<source src={femaleLocal} type='video/mp4'/>}{presenter==='male'&&maleLocal&&<source src={maleLocal} type='video/mp4'/>}<source src={presenter==='male'?maleRemote:femaleRemote} type='video/mp4'/>{presenter==='male'&&<source src={femaleRemote} type='video/mp4'/>}{c.loading}</video>"
  if(source.includes(oldVideo)) source=source.replace(oldVideo,newVideo)
  must(source.includes('as-gold-explainer-de-female.mp4'),'V50 port: female explainer file missing')
  must(source.includes('as-gold-explainer-de-male.mp4'),'V50 port: male explainer file missing')
  write(path,source)
}

function portCss(){
  const path='app/globals.css'
  let source=read(path)
  if(source.includes('/* V50 modular public navigation */'))return
  source+=`\n\n/* V50 modular public navigation */\n.flagLanguageMenu .flagLanguageMenuBack{position:sticky;top:0;z-index:3;justify-content:flex-start;border-color:#c9ad66;background:#2f291b;color:#fff;font-weight:900}\n.flagLanguageMenu .flagLanguageMenuBack:hover{border-color:#c9ad66;background:#453a20}\n.flagLanguagePublicText{display:grid;text-align:left;line-height:1.15}\n.flagLanguagePublicText small{font-size:.68rem;color:#6b6250}\n.publicTop .nav{gap:18px;padding-top:10px;padding-bottom:10px}\n.publicLanguageStack{display:grid;gap:7px;min-width:min(100%,310px);padding:9px 10px;border:1px solid #d9c792;border-radius:14px;background:#fffdf7}\n.publicLanguageRow{display:grid;grid-template-columns:minmax(120px,1fr) auto;align-items:center;gap:10px}\n.publicLanguageRow>span{color:#443817;font-size:.78rem;font-weight:850;line-height:1.25}\n.publicLanguageRow .flagLanguageTrigger{justify-self:end}\n.publicNavActions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}\n.publicBackBtn{white-space:nowrap}\n.legalMarketBar [data-output-language-status]{white-space:nowrap}\n@media(max-width:900px){.publicTop .nav{display:grid;grid-template-columns:1fr;align-items:stretch}.publicTop .brand{justify-content:center}.publicLanguageStack{width:100%;min-width:0}.publicNavActions{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.publicNavActions>*{width:100%;min-width:0;min-height:44px;display:grid;place-items:center;text-align:center}}\n@media(max-width:560px){.publicLanguageRow{grid-template-columns:1fr}.publicLanguageRow .flagLanguageTrigger{justify-self:stretch;width:100%}.publicNavActions{grid-template-columns:1fr 1fr}.publicBackBtn{grid-column:1/-1}.flagLanguagePublicPicker{width:100%!important}.flagLanguagePublicPicker .flagLanguageTrigger{flex:1 1 150px}}\n`
  write(path,source)
}

function verifyMicrophone(){
  const source=read('app/modules/public/ProblemNavigator.js')
  for(const token of ['navigator.permissions','rec.onaudiostart','aria-live="polite"','voiceStarting']) must(source.includes(token),'V50 port: microphone marker missing: '+token)
  must(!source.includes('getUserMedia'),'V50 port: direct getUserMedia preflight must remain removed')
}

function portV36Guard(){
  const path='scripts/test_v36_explainer_video.mjs'
  let source=read(path)
  source=source.replace(
    "  assert.match(femaleLocalBlock,new RegExp(`\\\\b${language}:'/videos/as-gold-v35-${language}\\\\.mp4'`),`missing local female video for ${language}`)",
    "  const expectedLocal=language==='de'?'/videos/as-gold-explainer-de-female.mp4':`/videos/as-gold-v35-${language}.mp4`\n  assert.ok(femaleLocalBlock.includes(`${language}:'${expectedLocal}'`),`missing local female video for ${language}`)"
  )
  source=source.replace(
    "assert.equal((femaleLocalBlock.match(/\\/videos\\/as-gold-v35-[a-z]{2}\\.mp4/g)||[]).length,expectedLanguages.length,'local female catalog must contain exactly ten videos')",
    "assert.equal((femaleLocalBlock.match(/\\/videos\\/as-gold-v35-[a-z]{2}\\.mp4/g)||[]).length,expectedLanguages.length-1,'nine translated local female videos must remain in the v35 catalog')\nassert.match(explainerSource,/as-gold-explainer-de-female\\.mp4/,'current German female explainer must remain available')\nassert.match(explainerSource,/as-gold-explainer-de-male\\.mp4/,'current German male explainer must remain available')"
  )
  write(path,source)
}

function portV46Guard(){
  const path='scripts/test_v46_modular_boundaries.mjs'
  let source=read(path)
  source=source.replace(
    "const interfaceControl=publicLanding.indexOf('<LanguageSwitcher value={language} onChange={setLanguage} label={t.language}/>',publicStart)",
    "const interfaceControl=publicLanding.indexOf('<LanguageSwitcher value={language} onChange={setLanguage} label={t.language} publicPicker',publicStart)"
  )
  if(!source.includes('V50 current-behavior guard')){
    const marker="console.log('V46 modular-boundary guard passed: thin root entry, extracted public/auth/workspace surfaces, domain-owned catalogs and services, direct output-language flow, single language-menu back control, tester lock and thin compatibility adapters verified.')"
    const extra=`\n// V50 current-behavior guard\nassert.match(publicLanding,/publicBackBtn/)\nassert.match(publicLanding,/returnToPublicTop/)\nassert.match(publicLanding,/data-output-language-status/)\nassert.match(publicLanding,/publicNav\\.output/)\nassert.match(switcher,/publicPicker=false/)\nassert.match(switcher,/active\\.label/)\nassert.match(switcher,/flagLanguageMenuBack/)\nconst currentCss=read('app/globals.css')\nassert.match(currentCss,/\\.publicLanguageStack/)\nassert.match(currentCss,/\\.flagLanguageMenu \\.flagLanguageMenuBack/)\nconst currentMicrophone=read('app/modules/public/ProblemNavigator.js')\nassert.match(currentMicrophone,/window\\.SpeechRecognition\\|\\|window\\.webkitSpeechRecognition/)\nassert.match(currentMicrophone,/navigator\\.permissions/)\nassert.doesNotMatch(currentMicrophone,/getUserMedia/)\nassert.match(currentMicrophone,/rec\\.onaudiostart/)\nassert.match(currentMicrophone,/aria-live=\"polite\"/)\nconst currentExplainer=read('app/modules/public/ExplainerVideo.js')\nassert.match(currentExplainer,/as-gold-explainer-de-female\\.mp4/)\nassert.match(currentExplainer,/as-gold-explainer-de-male\\.mp4/)\n`
    must(source.includes(marker),'V50 port: V46 guard completion marker missing')
    source=source.replace(marker,extra+'\n'+marker)
  }
  write(path,source)
}

portPublicLanding()
portExplainer()
portCss()
verifyMicrophone()
portV36Guard()
portV46Guard()
console.log('V50 public navigation, current explainer assets and microphone behavior are preserved inside V46 modules and regression guards.')
