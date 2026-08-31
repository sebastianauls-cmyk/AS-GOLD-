import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const read=p=>fs.readFileSync(path.join(root,p),'utf8')
const fail=message=>{throw new Error(`V34: ${message}`)}
const expect=(condition,message)=>{if(!condition) fail(message)}

const layout=read('app/layout.js')
const navigator=read('app/components/ProblemNavigator.js')
const intro=read('app/components/ProductIntroCompact.js')
const jump=read('app/components/CaseChoiceJumpEnhancer.js')
const title=read('app/components/HeroTitleStabilizer.js')
const languages=read('app/lib/problemNavigatorLanguages.mjs')

// Public customer path must have exactly one active problem navigator.
expect((layout.match(/<ProblemNavigator\s*\/>/g)||[]).length===1,'ProblemNavigator must be mounted exactly once')
expect(!layout.includes('FreeEntryAfterRecommendation'),'legacy free-entry helper must not be mounted')
expect(!layout.includes('HeroProblemOrder'),'legacy DOM-reorder helper must not be mounted')

// V37 deliberately moves action and problem guidance before the explanatory product intro.
// Preserve the core path: first-action -> problem navigator -> product intro -> case jump support.
const firstActionPos=layout.indexOf('<V37FirstAction/>')
const navPos=layout.indexOf('<ProblemNavigator/>')
const introPos=layout.indexOf('<ProductIntroCompact/>')
const jumpPos=layout.indexOf('<CaseChoiceJumpEnhancer/>')
expect(firstActionPos>=0&&navPos>firstActionPos&&introPos>navPos&&jumpPos>introPos,'layout order must be first action -> problem navigator -> product intro -> case jump enhancer')

// Mobile input must be a stable controlled React textarea with explicit help.
expect(navigator.includes('<textarea ref={textRef} value={value} onChange='),'problem input must remain a controlled textarea')
expect(navigator.includes('So funktioniert die Eingabe:'),'German input explanation is missing')
expect(navigator.includes('inputHelp'),'multilingual input help is missing')
expect((navigator.match(/id=\"asgold-problem-navigator-react\"/g)||[]).length===1,'problem navigator section must exist exactly once in component')
expect(navigator.includes('3 Dokumente kostenlos kennenlernen'),'free 3-document entry is missing from recommendation flow')

// Product intro is intentionally compact: exactly four benefits per language.
const supported=['de','en','fr','tr','pl','ru','ar','fa','ro','bg']
for(const code of supported){
  expect(intro.includes(`${code}:{title:`),`compact product intro missing language ${code}`)
  expect(languages.includes(`${code}:{locale:`),`problem language profile missing ${code}`)
}
const itemGroups=[...intro.matchAll(/items:\[(.*?)\]\}/gs)]
expect(itemGroups.length>=supported.length,'compact product intro must define benefit lists for all ten languages')
for(const group of itemGroups.slice(0,supported.length)){
  const itemCount=(group[1].match(/','/g)||[]).length+1
  expect(itemCount===4,'each compact product intro language must contain exactly four benefit points')
}

// Strong headline and direct 01-08 result jump must remain in place.
expect(title.includes('AS Gold – Klarheit, wenn Vorgänge komplex werden.'),'strong German hero headline is missing')
expect(jump.includes(".caseChooser .caseChoice"),'01-08 case choice listener is missing')
expect(jump.includes("#fallarten .caseResult"),'case choice must target the selected result card')
expect(jump.includes("behavior:'auto'"),'case choice navigation must use a direct jump instead of slow scrolling')
expect(jump.includes('publicTop'),'case jump must account for the sticky mobile header')

console.log('V34 customer-path regression checks passed')
