import fs from 'node:fs'

const layout=fs.readFileSync('app/layout.js','utf8')
const firstAction=fs.readFileSync('app/components/V37FirstAction.js','utf8')
const video=fs.readFileSync('app/components/ExplainerVideo.js','utf8')

const requiredActions=['Problem beschreiben','Dokument hochladen','Beispiel ansehen']
for(const text of requiredActions){
  if(!firstAction.includes(text)) throw new Error(`V37 guard: missing primary action: ${text}`)
}

if(!layout.includes('V37FirstAction')) throw new Error('V37 guard: first-action component is not mounted in layout')
if(!firstAction.includes('asgold-problem-navigator-react')) throw new Error('V37 guard: problem entry no longer routes to the problem navigator')
if(!firstAction.includes('documents')) throw new Error('V37 guard: upload entry no longer targets document workflow')
if(!firstAction.includes('Beispielfall')) throw new Error('V37 guard: sample case is missing')
if(!firstAction.includes('Keine automatische Verlängerung')) throw new Error('V37 guard: transparency promise missing from first-action area')

if(!video.includes('showVideo')) throw new Error('V37 guard: explainer video is no longer optional/compact')
if(!video.includes('Weiblich') || !video.includes('Männlich')) throw new Error('V37 guard: presenter choice missing')

console.log('V37 first-action regression checks passed')
