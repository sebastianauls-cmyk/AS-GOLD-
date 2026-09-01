import fs from 'node:fs'

const landingPath='app/modules/public/PublicLanding.js'
let landing=fs.readFileSync(landingPath,'utf8')
landing=landing.replace("import { useState } from 'react'","import { useRef, useState } from 'react'")
landing=landing.replace("  const [problemVoiceSignal,setProblemVoiceSignal]=useState(0)\n  const [problemFocusSignal,setProblemFocusSignal]=useState(0)","  const problemNavigatorRef=useRef(null)")
landing=landing.replace("<V37FirstAction language={outputLanguage} onRegister={()=>setScreen('register')} onFocusProblem={()=>setProblemFocusSignal(value=>value+1)} onSpeakProblem={()=>setProblemVoiceSignal(value=>value+1)}/>","<V37FirstAction language={outputLanguage} onRegister={()=>setScreen('register')} onFocusProblem={()=>problemNavigatorRef.current?.focus()} onSpeakProblem={()=>problemNavigatorRef.current?.speak()}/>")
landing=landing.replace("<ProblemNavigator outputLanguage={outputLanguage} onRegister={()=>setScreen('register')} onSelectCase={setSelectedPublicCase} voiceSignal={problemVoiceSignal} focusSignal={problemFocusSignal}/>","<ProblemNavigator ref={problemNavigatorRef} outputLanguage={outputLanguage} onRegister={()=>setScreen('register')} onSelectCase={setSelectedPublicCase}/>")
if(!landing.includes('problemNavigatorRef.current?.speak()')||landing.includes('setProblemVoiceSignal')) throw new Error('PublicLanding direct microphone migration did not apply cleanly')
fs.writeFileSync(landingPath,landing)

const problemPath='app/modules/public/ProblemNavigator.js'
let problem=fs.readFileSync(problemPath,'utf8')
problem=problem.replace("import { useEffect, useMemo, useRef, useState } from 'react'","import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'")
problem=problem.replace("export function ProblemNavigator({outputLanguage='de',onRegister,onSelectCase,voiceSignal=0,focusSignal=0}){","export const ProblemNavigator=forwardRef(function ProblemNavigator({outputLanguage='de',onRegister,onSelectCase,voiceSignal=0,focusSignal=0},ref){")
const effectMarker="\n  useEffect(()=>{\n    if(voiceSignal<=0)return"
if(!problem.includes(effectMarker)) throw new Error('ProblemNavigator voice effect marker not found')
const handle=`\n  useImperativeHandle(ref,()=>({\n    speak(){\n      rootRef.current?.scrollIntoView({behavior:'smooth',block:'center'})\n      voice()\n    },\n    focus(){\n      rootRef.current?.scrollIntoView({behavior:'smooth',block:'center'})\n      textRef.current?.focus()\n    }\n  }))\n`
problem=problem.replace(effectMarker,handle+effectMarker)
const lastClose=problem.lastIndexOf('\n}')
if(lastClose<0) throw new Error('ProblemNavigator closing brace not found')
problem=problem.slice(0,lastClose)+'\n})'+problem.slice(lastClose+2)
if(!problem.includes('useImperativeHandle')||!problem.includes('forwardRef(function ProblemNavigator')) throw new Error('ProblemNavigator imperative-ref migration did not apply cleanly')
fs.writeFileSync(problemPath,problem)

const packagePath='package.json'
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'))
pkg.scripts ||= {}
pkg.scripts['test:v71-direct-microphone']='node scripts/test_v71_direct_microphone_activation.mjs'
if(!pkg.scripts.prebuild.includes('test:v71-direct-microphone')) pkg.scripts.prebuild += ' && npm run test:v71-direct-microphone'
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n')

console.log('V71 migrated first-action microphone activation to a synchronous React imperative ref and wired its regression guard into prebuild.')
