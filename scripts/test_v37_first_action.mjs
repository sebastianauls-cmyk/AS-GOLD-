import fs from 'node:fs'

const layout=fs.readFileSync('app/layout.js','utf8')
const firstAction=fs.readFileSync('app/components/V37FirstAction.js','utf8')
const video=fs.readFileSync('app/components/ExplainerVideo.js','utf8')

const requiredActions=['Problem beschreiben','Dokument hochladen','Beispiel ansehen']
for(const text of requiredActions){
  if(!firstAction.includes(text)) throw new Error(`V37 guard: missing primary action: ${text}`)
}

const requiredTrust=['Kostenlos mit 3 Dokumenten starten','Keine automatische Verlängerung','Deutschland / deutsches Recht']
for(const text of requiredTrust){
  if(!firstAction.includes(text)) throw new Error(`V37 guard: missing trust promise: ${text}`)
}

if(!layout.includes('V37FirstAction')) throw new Error('V37 guard: first-action component is not mounted in layout')
if(!firstAction.includes('asgold-problem-navigator-react')) throw new Error('V37 guard: problem action no longer targets the problem navigator')
if(!firstAction.includes('input[type="file"]')) throw new Error('V37 guard: upload action no longer targets file upload')
if(!firstAction.includes('So sieht ein erstes Ergebnis aus')) throw new Error('V37 guard: sample result is missing')
if(!firstAction.includes('🟢') || !firstAction.includes('🟡') || !firstAction.includes('🔴') || !firstAction.includes('➡️')) throw new Error('V37 guard: sample result no longer shows status progression')
if(!video.includes("[open,setOpen]=useState(false)")) throw new Error('V37 guard: explainer video is no longer collapsed by default')
if(!video.includes('AS Gold in 90 Sekunden ansehen')) throw new Error('V37 guard: compact video CTA missing')
if(!video.includes('Weiblich') || !video.includes('Männlich')) throw new Error('V37 guard: presenter choice missing')
if(!video.includes("setPresenter('female')") || !video.includes("setPresenter('male')")) throw new Error('V37 guard: presenter buttons are not interactive')

const firstActionIndex=layout.indexOf('<V37FirstAction/>')
const problemIndex=layout.indexOf('<ProblemNavigator/>')
const videoIndex=layout.indexOf('<ExplainerVideo/>')
const productIndex=layout.indexOf('<ProductIntroCompact/>')
if(!(firstActionIndex>=0 && problemIndex>firstActionIndex && videoIndex>problemIndex && productIndex>videoIndex)){
  throw new Error('V37 guard: homepage priority order must be first action -> problem navigator -> optional video -> product details')
}

console.log('V37 first-action regression checks passed')
