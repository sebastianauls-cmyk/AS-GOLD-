import fs from 'node:fs'

const layout=fs.readFileSync('app/layout.js','utf8')
const publicLanding=fs.readFileSync('app/modules/public/PublicLanding.js','utf8')
const languageModules=fs.readFileSync('app/modules/public/PublicLanguageModules.js','utf8')
const firstAction=fs.readFileSync('app/modules/public/V37FirstAction.js','utf8')
const firstActionCompatibility=fs.readFileSync('app/components/V37FirstAction.js','utf8')
const video=fs.readFileSync('app/modules/public/ExplainerVideo.js','utf8')
const videoCompatibility=fs.readFileSync('app/components/ExplainerVideo.js','utf8')

const requiredActions=['Problem beschreiben','Dokument hochladen','Beispiel ansehen']
for(const text of requiredActions){if(!firstAction.includes(text)) throw new Error(`V37 guard: missing primary action: ${text}`)}
const requiredTrust=['Kostenlos mit 3 Dokumenten starten','Keine automatische Verlängerung','Deutschland / deutsches Recht']
for(const text of requiredTrust){if(!firstAction.includes(text)) throw new Error(`V37 guard: missing trust promise: ${text}`)}

if(!publicLanding.includes("./V37FirstAction")) throw new Error('V37 guard: first-action module is not owned by PublicLanding')
if(!publicLanding.includes("./ExplainerVideo")) throw new Error('V37 guard: explainer module is not owned by PublicLanding')
if(!publicLanding.includes('customerModule={customerModule}')||!languageModules.includes('{customerModule}')) throw new Error('V37 guard: customer navigator must be directly nested in the output-language module')
if(layout.includes('V37FirstAction')||layout.includes('ExplainerVideo')||layout.includes('ProblemNavigator')||layout.includes('ProductIntroCompact')) throw new Error('V37 guard: public hero modules must not be global layout enhancers')
if(!firstActionCompatibility.includes("../modules/public/V37FirstAction")) throw new Error('V37 guard: legacy first-action path must remain a compatibility re-export')
if(!videoCompatibility.includes("../modules/public/ExplainerVideo")) throw new Error('V37 guard: legacy explainer path must remain a compatibility re-export')
if(!firstAction.includes('asgold-problem-navigator-react')) throw new Error('V37 guard: problem action no longer targets the problem navigator')
if(!firstAction.includes('onRegister?.()')) throw new Error('V37 guard: upload action must enter the registration/upload path directly')
if(!firstAction.includes('So sieht ein erstes Ergebnis aus')) throw new Error('V37 guard: sample result is missing')
if(!firstAction.includes('🟢') || !firstAction.includes('🟡') || !firstAction.includes('🔴') || !firstAction.includes('➡️')) throw new Error('V37 guard: sample result no longer shows status progression')
if(!video.includes("[open,setOpen]=useState(false)")) throw new Error('V37 guard: explainer video is no longer collapsed by default')
if(!video.includes('AS Gold in 90 Sekunden ansehen')) throw new Error('V37 guard: compact video CTA missing')
if(!video.includes('Weiblich') || !video.includes('Männlich')) throw new Error('V37 guard: presenter choice missing')
if(!video.includes("setPresenter('female')") || !video.includes("setPresenter('male')")) throw new Error('V37 guard: presenter buttons are not interactive')

const firstActionIndex=publicLanding.indexOf('<V37FirstAction language={language}')
const videoIndex=publicLanding.indexOf('<ExplainerVideo key={`${language}-${explainerSignal}`} language={language} openSignal={explainerSignal}/>')
const productIndex=publicLanding.indexOf('<ProductIntroCompact language={language}/>')
if(!(firstActionIndex>=0 && videoIndex>firstActionIndex && productIndex>videoIndex)) throw new Error('V37 guard: hero priority order must be first action -> optional video -> product details, with the customer navigator directly above in the output-language module')
if(firstAction.includes('createPortal')||firstAction.includes('MutationObserver')||video.includes('createPortal')||video.includes('MutationObserver')||languageModules.includes('createPortal')||languageModules.includes('MutationObserver')) throw new Error('V37 guard: public modules must render directly without portal mount observers')
console.log('V37 first-action regression checks passed')
