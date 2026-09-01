import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const read = path => fs.readFileSync(path,'utf8')
const write = (path,content) => fs.writeFileSync(path,content)
const replaceOnce = (source,needle,replacement,label) => {
  if(!source.includes(needle)) throw new Error(`Missing migration anchor: ${label}`)
  return source.replace(needle,replacement)
}

// Keep the latest explanatory copy from main, but place it in the public module.
const introCopy = execFileSync('git',['show','origin/main:app/lib/asGoldIntroCopy.mjs'],{encoding:'utf8'})
write('app/modules/public/asGoldIntroCopy.mjs',introCopy)

// 1) Public language controls: warm welcome, independent German reset, no nested customer slot.
{
  const path='app/modules/public/PublicLanguageModules.js'
  let s=read(path)
  const warmWelcome=`const warmWelcome={
  de:'Herzlich willkommen bei AS Gold – hier sind Sie richtig und finden in Ruhe den nächsten Schritt.',
  en:'A warm welcome to AS Gold – you are in the right place to find your next step at your own pace.',
  fr:'Bienvenue chez AS Gold – vous êtes au bon endroit pour trouver sereinement la prochaine étape.',
  tr:'AS Gold’a içtenlikle hoş geldiniz – bir sonraki adımınızı sakince bulmak için doğru yerdesiniz.',
  pl:'Serdecznie witamy w AS Gold – jesteś we właściwym miejscu, aby spokojnie znaleźć kolejny krok.',
  ru:'Добро пожаловать в AS Gold — здесь вы спокойно найдёте правильный следующий шаг.',
  ar:'أهلاً وسهلاً بك في AS Gold — أنت في المكان المناسب لتجد خطوتك التالية بهدوء.',
  fa:'صمیمانه به AS Gold خوش آمدید — اینجا جای مناسبی است تا با آرامش گام بعدی را پیدا کنید.',
  ro:'Bine ați venit la AS Gold – sunteți în locul potrivit pentru a găsi în liniște următorul pas.',
  bg:'Добре дошли в AS Gold – тук сте на правилното място, за да намерите спокойно следващата стъпка.'
}

`
  const fn='export function PublicLanguageModules({language,onLanguageChange,outputLanguage,onOutputLanguageChange,onPlayExplainer,customerModule}){'
  s=replaceOnce(s,fn,warmWelcome+'export function PublicLanguageModules({language,onLanguageChange,outputLanguage,onOutputLanguageChange,onPlayExplainer}){','PublicLanguageModules signature')
  const oldReturn=`  function returnToStart(){
    const cleanUrl=\`${'${window.location.pathname}${window.location.search}'}\`
    if(window.location.hash)window.history.replaceState(window.history.state,'',cleanUrl)
    window.scrollTo({top:0,left:0,behavior:'instant'})
  }
`
  const newReturn=`  function returnToGerman(){
    onLanguageChange('de')
    onOutputLanguageChange('de')
    const cleanUrl=\`${'${window.location.pathname}${window.location.search}'}\`
    if(window.location.hash)window.history.replaceState(window.history.state,'',cleanUrl)
    window.scrollTo({top:0,left:0,behavior:'instant'})
  }
`
  s=replaceOnce(s,oldReturn,newReturn,'German reset')
  const section=`  return <section className="publicLanguageModules" aria-label={\`${'${text.interfaceTitle}; ${text.outputTitle}'}\`}>
    <div className="publicLanguageModule interfaceModule">`
  const sectionNew=`  return <section className="publicLanguageModules" lang={language} dir={language==='ar'||language==='fa'?'rtl':'ltr'} aria-label={\`${'${text.interfaceTitle}; ${text.outputTitle}'}\`}>
    <p className="publicWelcome"><span aria-hidden="true">👋</span> {warmWelcome[language]||warmWelcome.de}</p>
    <button type="button" className="publicBackButton" dir="ltr" onClick={returnToGerman} aria-label="Back to German – Oberfläche und Kundensprache auf Deutsch zurückstellen">← 🇩🇪 Back to German / Zurück zu Deutsch</button>
    <div className="publicLanguageModule interfaceModule">`
  s=replaceOnce(s,section,sectionNew,'public language section')
  s=s.replace(`        <button type="button" className="publicBackButton" onClick={returnToStart}>{language==='ar'||language==='fa'?'→':'←'} {text.back}</button>\n`,'')
  s=s.replace(`      <div id="asgold-customer-module-slot" className="customerModuleSlot">{customerModule}</div>\n`,'')
  write(path,s)
}

// 2) First action: direct callbacks for focus/voice, distinct heading, all ten voice labels.
{
  const path='app/modules/public/V37FirstAction.js'
  let s=read(path)
  const voices={
    de:'Problem einsprechen',en:'Speak problem',fr:'Dicter le problème',tr:'Sorunu sesli anlat',pl:'Powiedz problem',ru:'Продиктовать проблему',ar:'قل المشكلة',fa:'بیان صوتی مشکل',ro:'Spuneți problema',bg:'Кажете проблема'
  }
  for(const [lang,voice] of Object.entries(voices)){
    const re=new RegExp(`(${lang}:\\{[^\\n]*?problem:'[^']*')(?=,upload:)`)
    if(!re.test(s)) throw new Error(`Missing first-action voice anchor for ${lang}`)
    s=s.replace(re,`$1,voice:'${voice}'`)
  }
  const before="export function V37FirstAction({language='de',onRegister}){"
  const titles=`const startTitles={de:'Wie möchten Sie starten?',en:'How would you like to start?',fr:'Comment souhaitez-vous commencer ?',tr:'Nasıl başlamak istersiniz?',pl:'Jak chcesz zacząć?',ru:'Как вы хотите начать?',ar:'كيف تريد أن تبدأ؟',fa:'چگونه می‌خواهید شروع کنید؟',ro:'Cum doriți să începeți?',bg:'Как искате да започнете?'}\n\n`
  s=replaceOnce(s,before,titles+"export function V37FirstAction({language='de',onRegister,onFocusProblem,onSpeakProblem}){",'first action signature')
  s=replaceOnce(s,"  const focusProblem=()=>{const el=document.querySelector('#asgold-problem-navigator-react textarea');if(el){el.scrollIntoView({behavior:'smooth',block:'center'});window.setTimeout(()=>el.focus(),350)}}\n  const upload=()=>onRegister?.()", "  const focusProblem=()=>onFocusProblem?.()\n  const speakProblem=()=>onSpeakProblem?.()\n  const upload=()=>onRegister?.()",'direct first-action callbacks')
  s=s.replace('{c.title}</b>','{startTitles[language]||startTitles.de}</b>')
  const problemButton=`      <button type='button' onClick={focusProblem} style={primary}>✍️ {c.problem}</button>`
  s=replaceOnce(s,problemButton,problemButton+`\n      <button type='button' data-first-action-voice aria-controls='asgold-problem-navigator-react' onClick={speakProblem} style={secondary}>🎙 {c.voice}</button>`,'voice button')
  write(path,s)
}

// 3) Problem navigator: distinct concern heading and explicit focus signal; voice stays direct/local.
{
  const path='app/modules/public/ProblemNavigator.js'
  let s=read(path)
  const inputTitleLine="const inputTitles={de:'So funktioniert die Eingabe:',en:'How to enter your problem:',fr:'Comment saisir votre problème :',tr:'Sorununuzu nasıl girersiniz:',pl:'Jak wpisać problem:',ru:'Как описать проблему:',ar:'كيفية إدخال المشكلة:',fa:'نحوه وارد کردن مشکل:',ro:'Cum introduceți problema:',bg:'Как да въведете проблема:'}\n"
  const concern="const concernTitles={de:'Worum geht es?',en:'What is this about?',fr:'De quoi s’agit-il ?',tr:'Konu nedir?',pl:'Czego dotyczy sprawa?',ru:'О чём идёт речь?',ar:'ما موضوع الأمر؟',fa:'موضوع چیست؟',ro:'Despre ce este vorba?',bg:'За какво става въпрос?'}\n"
  s=replaceOnce(s,inputTitleLine,inputTitleLine+concern,'concern titles')
  s=s.replace("export function ProblemNavigator({outputLanguage='de',onRegister,onSelectCase,voiceSignal=0}){","export function ProblemNavigator({outputLanguage='de',onRegister,onSelectCase,voiceSignal=0,focusSignal=0}){")
  const voiceEffect=`  useEffect(()=>{
    if(voiceSignal<=0)return
    rootRef.current?.scrollIntoView({behavior:'smooth',block:'center'})
    const timer=setTimeout(()=>voice(),350)
    return()=>clearTimeout(timer)
  },[voiceSignal])
`
  const focusEffect=voiceEffect+`\n  useEffect(()=>{\n    if(focusSignal<=0)return\n    rootRef.current?.scrollIntoView({behavior:'smooth',block:'center'})\n    const timer=setTimeout(()=>textRef.current?.focus(),350)\n    return()=>clearTimeout(timer)\n  },[focusSignal])\n`
  s=replaceOnce(s,voiceEffect,focusEffect,'focus signal')
  const inputConst="  const inputTitle=inputTitles[customerLanguage]||inputTitles.en\n"
  s=replaceOnce(s,inputConst,inputConst+"  const concernTitle=concernTitles[customerLanguage]||concernTitles.de\n",'concern title binding')
  s=replaceOnce(s,"    <b style={{display:'block',fontSize:'1.35rem',color:'#4d3b14'}}>{c.title}</b>","    <b style={{display:'block',fontSize:'1.35rem',color:'#4d3b14'}}>{concernTitle}</b>",'concern heading')
  s=s.replace('aria-label={c.title} aria-describedby=','aria-label={concernTitle} aria-describedby=')
  write(path,s)
}

// 4) Direct product explanation and canonical hero copy.
write('app/modules/public/ProductIntroCompact.js',`import { howAsGoldWorksCopy } from './asGoldIntroCopy.mjs'\n\nexport function ProductIntroCompact({language='de'}){\n  const c=howAsGoldWorksCopy[language]||howAsGoldWorksCopy.de\n  const rtl=language==='ar'||language==='fa'\n  return <section id="asgold-product-intro-compact" dir={rtl?'rtl':'ltr'} style={{margin:'18px 0 8px',padding:16,border:'1px solid #dccb9f',borderRadius:18,background:'linear-gradient(135deg,#fffaf0,#fff)',boxShadow:'0 8px 24px rgba(72,55,18,.05)'}}>\n    <b style={{display:'block',fontSize:'1.3rem',color:'#4d3b14'}}>{c.title}</b>\n    <p style={{margin:'6px 0 10px',color:'#596472',lineHeight:1.4}}>{c.lead}</p>\n    <div style={{display:'grid',gap:8}}>{c.items.map((item,index)=><div key={item} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 11px',borderRadius:10,background:'#fff',border:'1px solid #ece4cf',color:'#4f5966',lineHeight:1.4}}><span aria-hidden="true" style={{flex:'0 0 auto',display:'grid',placeItems:'center',width:25,height:25,borderRadius:999,background:'#9b7724',color:'#fff',fontWeight:900,fontSize:'.82rem'}}>{index+1}</span><span>{item}</span></div>)}</div>\n  </section>\n}\n`)
write('app/modules/public/HeroTitleStabilizer.js',`import { whatIsAsGoldCopy } from './asGoldIntroCopy.mjs'\n\nexport const heroTitleCopy=whatIsAsGoldCopy\n\nexport function HeroTitleStabilizer(){ return null }\n`)

// 5) Public landing: output/customer language drives public content, direct component order, no customer slot or duplicate heading.
{
  const path='app/modules/public/PublicLanding.js'
  let s=read(path)
  s=s.replace("import { getProblemLanguageProfile } from './problemNavigatorLanguagesV36.mjs'\n",'')
  s=s.replace('  const hero=heroTitleCopy[language]||heroTitleCopy.de','  const hero=heroTitleCopy[outputLanguage]||heroTitleCopy.de')
  s=s.replace('  const audience=audienceCopy[language]||audienceCopy.de','  const audience=audienceCopy[outputLanguage]||audienceCopy.de')
  s=s.replace("  const problemUi=getProblemLanguageProfile(outputLanguage).ui\n",'')
  s=replaceOnce(s,"  const [explainerSignal,setExplainerSignal]=useState(0)\n\n  const customerModule=<ProblemNavigator outputLanguage={outputLanguage} onRegister={()=>setScreen('register')} onSelectCase={setSelectedPublicCase} voiceSignal={explainerSignal}/>\n", "  const [explainerSignal,setExplainerSignal]=useState(0)\n  const [problemVoiceSignal,setProblemVoiceSignal]=useState(0)\n  const [problemFocusSignal,setProblemFocusSignal]=useState(0)\n",'public signals')
  s=s.replace(' onPlayExplainer={()=>setExplainerSignal(value=>value+1)} customerModule={customerModule}/>', ' onPlayExplainer={()=>setExplainerSignal(value=>value+1)}/>')
  const flow=`            <V37FirstAction language={language} onRegister={()=>setScreen('register')}/>
            <button type="button" className="secondary heroVoiceShortcut" aria-controls="asgold-problem-navigator-react" onClick={()=>setExplainerSignal(value=>value+1)}>🎙 {problemUi.voice}</button>
            <ExplainerVideo key={\`${'${language}-${explainerSignal}'}\`} language={language} openSignal={explainerSignal}/>
            <ProductIntroCompact language={language}/>`
  const directFlow=`            <ProductIntroCompact language={outputLanguage}/>
            <V37FirstAction language={outputLanguage} onRegister={()=>setScreen('register')} onFocusProblem={()=>setProblemFocusSignal(value=>value+1)} onSpeakProblem={()=>setProblemVoiceSignal(value=>value+1)}/>
            <ProblemNavigator outputLanguage={outputLanguage} onRegister={()=>setScreen('register')} onSelectCase={setSelectedPublicCase} voiceSignal={problemVoiceSignal} focusSignal={problemFocusSignal}/>
            <ExplainerVideo key={\`${'${outputLanguage}-${explainerSignal}'}\`} language={outputLanguage} openSignal={explainerSignal}/>`
  s=replaceOnce(s,flow,directFlow,'direct public flow')
  s=s.replace(`            <div className="eyebrow">{audience.title}</div><h2 style={{margin:'8px 0 8px',fontSize:'clamp(1.7rem,5vw,2.5rem)'}}>{audience.title}</h2>`,`            <h2 style={{margin:'8px 0 8px',fontSize:'clamp(1.7rem,5vw,2.5rem)'}}>{audience.title}</h2>`)
  s=s.replace('<LegalFooter language={language}/>','<LegalFooter language={outputLanguage}/>')
  write(path,s)
}

// 6) Workspace keeps interface-language catalogs for protected/auth views while public customer copy follows outputLanguage.
{
  const path='app/modules/workspace/WorkspaceApp.js'
  let s=read(path)
  const anchor="  const promoSomeInvalid = !!appliedPromoCode&&promoQuotes.some(quote=>quote.promo_code_state==='invalid')\n"
  const publicBlock=`\n  // Public/customer content follows the selected output language; the app interface stays independent.\n  const publicLanguage = outputLanguage\n  const publicT = ui[publicLanguage] || ui.de\n  const publicA = appText[publicLanguage] || appText.de\n  const publicLocalizedPlans = plans.map((p,index)=>{ const v=(planText[publicLanguage]||{})[p.key]; const j=(planJourney[publicLanguage]||planJourney.de)[p.key] || {}; const base=v?{...p,audience:v[0],checks:v[1],result:v[2],excluded:v[3]}:p; return {...base,...j,level:index+1} })\n  const publicPeriod = periodText[publicLanguage] || periodText.de\n  const publicJl = journeyLabels[publicLanguage] || journeyLabels.de\n  const publicRt = recommendationText[publicLanguage] || recommendationText.de\n  const publicTt = transparencyText[publicLanguage] || transparencyText.de\n  const publicCd = caseDiscoveryText[publicLanguage] || caseDiscoveryText.de\n  const publicOrderedPublicCases = orderCasesByResearch(publicCd.cases)\n  const publicPa = publicAudienceText[publicLanguage] || publicAudienceText.de\n  const publicActivePublicCase = publicOrderedPublicCases.find(item=>item.key===selectedPublicCase) || publicOrderedPublicCases[0]\n  const publicRecommendedPlan = publicLocalizedPlans.find(p=>p.key===recommendedTier) || publicLocalizedPlans[0]\n  const publicMonthsLabel = value => publicA.months.replace('{n}',value).replace('{plural}', value>1 ? (publicLanguage==='de'?'e':publicLanguage==='en'?'s':'') : '')\n`
  s=replaceOnce(s,anchor,anchor+publicBlock,'public language derived catalogs')
  const old=`  return <PublicLanding t={t} a={a} language={language} setLanguage={setLanguage} outputLanguage={outputLanguage} setOutputLanguage={setOutputLanguage} setScreen={setScreen} cd={cd} testerLinkText={testerLinkText} pa={pa} activePublicCase={activePublicCase} setSelectedPublicCase={setSelectedPublicCase} tt={tt} jl={jl} localizedPlans={localizedPlans} rt={rt} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} setShowRecommendation={setShowRecommendation} showRecommendation={showRecommendation} recommendedPlan={recommendedPlan} recommendedTier={recommendedTier} eur={eur} period={period} terms={terms} monthsLabel={monthsLabel}/>`
  const replacement=`  return <PublicLanding t={publicT} a={publicA} language={language} setLanguage={setLanguage} outputLanguage={outputLanguage} setOutputLanguage={setOutputLanguage} setScreen={setScreen} cd={publicCd} testerLinkText={testerLinkText} pa={publicPa} activePublicCase={publicActivePublicCase} setSelectedPublicCase={setSelectedPublicCase} tt={publicTt} jl={publicJl} localizedPlans={publicLocalizedPlans} rt={publicRt} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} setShowRecommendation={setShowRecommendation} showRecommendation={showRecommendation} recommendedPlan={publicRecommendedPlan} recommendedTier={recommendedTier} eur={eur} period={publicPeriod} terms={terms} monthsLabel={publicMonthsLabel}/>`
  s=replaceOnce(s,old,replacement,'public landing customer catalogs')
  write(path,s)
}

// 7) Responsive visual rules for the independent welcome/reset controls.
{
  const path='app/globals.css'
  let s=read(path)
  const marker='/* V69 modular public-language parity */'
  if(!s.includes(marker)) s+=`\n${marker}\n.publicWelcome{grid-column:1/-1;margin:0;padding:14px 16px;border:1px solid #e2d6b7;border-radius:14px;background:linear-gradient(135deg,#fff8df,#fff);color:#4d3b14;font-size:1.08rem;font-weight:850;line-height:1.4}.publicWelcome span{font-size:1.35rem}.publicBackButton{grid-column:1/-1;justify-self:end;min-height:42px;padding:9px 12px;border:1px solid #c9ad66;border-radius:11px;background:#fff;color:#4d3b14;font-weight:850}.publicBackButton:hover{background:#fff8e8}\n@media(max-width:760px){.publicBackButton{width:100%;max-width:none;justify-self:stretch}}\n`
  write(path,s)
}

// 8) Dedicated guard so future refactors cannot silently regress V59–V69 public behavior.
write('scripts/test_v69_modular_public_parity.mjs',`import assert from 'node:assert/strict'\nimport fs from 'node:fs'\nconst read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8')\nconst workspace=read('app/modules/workspace/WorkspaceApp.js')\nconst landing=read('app/modules/public/PublicLanding.js')\nconst languages=read('app/modules/public/PublicLanguageModules.js')\nconst action=read('app/modules/public/V37FirstAction.js')\nconst problem=read('app/modules/public/ProblemNavigator.js')\nconst intro=read('app/modules/public/ProductIntroCompact.js')\nconst hero=read('app/modules/public/HeroTitleStabilizer.js')\nconst copy=read('app/modules/public/asGoldIntroCopy.mjs')\nconst css=read('app/globals.css')\nassert.match(workspace,/const publicLanguage = outputLanguage/)\nassert.match(workspace,/t=\\{publicT\\}/)\nassert.match(workspace,/cd=\\{publicCd\\}/)\nassert.match(landing,/heroTitleCopy\\[outputLanguage\\]/)\nassert.match(landing,/<LegalFooter language=\\{outputLanguage\\}/)\nassert.doesNotMatch(languages,/asgold-customer-module-slot/)\nassert.match(languages,/function returnToGerman\\(\\)/)\nassert.match(languages,/onLanguageChange\\('de'\\)/)\nassert.match(languages,/onOutputLanguageChange\\('de'\\)/)\nassert.match(languages,/Back to German \\/ Zurück zu Deutsch/)\nassert.match(languages,/className="publicWelcome"/)\nconst productIndex=landing.indexOf('<ProductIntroCompact')\nconst actionIndex=landing.indexOf('<V37FirstAction')\nconst problemIndex=landing.indexOf('<ProblemNavigator')\nassert.ok(productIndex>=0&&actionIndex>productIndex&&problemIndex>actionIndex,'direct public flow must be explanation -> action -> problem input')\nfor(const label of ['Problem einsprechen','Speak problem','Dicter le problème','Sorunu sesli anlat','Powiedz problem','Продиктовать проблему','قل المشكلة','بیان صوتی مشکل','Spuneți problema','Кажете проблема']) assert.ok(action.includes(label),label)\nassert.match(action,/data-first-action-voice/)\nassert.match(action,/const startTitles=/)\nassert.match(action,/onFocusProblem/)\nassert.match(action,/onSpeakProblem/)\nassert.match(problem,/const concernTitles=/)\nassert.match(problem,/focusSignal=0/)\nassert.match(problem,/voiceSignal=0/)\nassert.match(problem,/aria-label=\\{concernTitle\\}/)\nassert.match(intro,/howAsGoldWorksCopy/)\nassert.match(intro,/\\{index\\+1\\}/)\nassert.match(hero,/whatIsAsGoldCopy/)\nfor(const term of ['digitaler Fallassistent','Sie beschreiben Ihr Anliegen oder laden Unterlagen hoch','Fristen, offene Punkte und Risiken','Sie prüfen und entscheiden selbst','So arbeitet AS Gold mit Ihnen']) assert.match(copy,new RegExp(term))\nassert.equal((landing.match(/\\{audience\\.title\\}/g)||[]).length,1)\nassert.match(css,/\\.publicWelcome\\{grid-column:1\\/-1;[^\\n]*font-size:1\\.08rem/)\nassert.match(css,/\\.publicWelcome span\\{font-size:1\\.35rem/)\nassert.match(css,/\\.publicBackButton\\{grid-column:1\\/-1;justify-self:end/)\nassert.match(css,/@media\\(max-width:760px\\)\\{\\.publicBackButton\\{width:100%;max-width:none;justify-self:stretch\\}\\}/)\nconsole.log('V69 modular public parity guard passed: current public-language, voice, intro and navigation behavior is direct React without DOM enhancers.')\n`)

// 9) Add guard to the mandatory prebuild chain.
{
  const path='package.json'
  const pkg=JSON.parse(read(path))
  pkg.scripts['test:v69-public-parity']='node scripts/test_v69_modular_public_parity.mjs'
  if(!pkg.scripts.prebuild.includes('test:v69-public-parity')) pkg.scripts.prebuild+=' && npm run test:v69-public-parity'
  write(path,JSON.stringify(pkg,null,2)+'\n')
}

// 10) Architecture log is committed only after the entire guard/build workflow succeeds.
{
  const path='docs/APP_GOLD_MODULARISIERUNG_V46.md'
  let s=read(path)
  const marker='### V46 Public-Parität V59–V69 direkt modularisiert'
  if(!s.includes(marker)) s+=`\n\n${marker}\n\n- Die aktuelle öffentliche Zwei-Sprachen-Logik ist in die Modularchitektur übernommen: Oberflächensprache und Kunden-/Ausgabesprache bleiben unabhängig; alle öffentlichen Kundeninhalte folgen der Ausgabesprache.\n- Der warme Willkommensgruß und ein eigenständiger zweisprachiger Deutsch-Reset stehen vor den beiden Sprachmodulen. Der Reset stellt Oberfläche und Ausgabe gemeinsam auf Deutsch zurück.\n- Der Startablauf ist nun direkt als React-Struktur aufgebaut: Erklärung → Funktionsablauf → Startart → Problem-/Spracheingabe. Es gibt keinen nachträglich erzeugten Customer-Slot.\n- Der Mikrofonstart wird über explizite React-Callbacks/Signals an den Problem-Navigator übergeben; keine querySelector-/Click-Weiterleitung ist dafür nötig.\n- „Wie möchten Sie starten?“ und „Worum geht es?“ sind in allen zehn Sprachen getrennte Überschriften.\n- Die ausführliche „Was ist AS Gold?“-Erklärung und der vierstufige Ablauf liegen als Public-Fachkatalog im Modul.\n- Die doppelte Zielgruppenüberschrift wurde direkt im PublicLanding entfernt.\n- Ein eigener V69-Modulguard ist Bestandteil der verpflichtenden prebuild-Kette.\n`
  write(path,s)
}

console.log('V46 modular public V59–V69 parity migration prepared.')
