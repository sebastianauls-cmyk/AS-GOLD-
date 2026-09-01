import fs from 'node:fs'

const navigatorPath='app/modules/public/ProblemNavigator.js'
let navigator=fs.readFileSync(navigatorPath,'utf8')

navigator=navigator.replace("import { useMemo, useRef, useState } from 'react'","import { useEffect, useMemo, useRef, useState } from 'react'")
navigator=navigator.replace("export function ProblemNavigator({outputLanguage='de',onRegister,onSelectCase}){","export function ProblemNavigator({outputLanguage='de',onRegister,onSelectCase,voiceSignal=0}){")
const resultRef="  const resultRef=useRef(null)"
if(!navigator.includes('const rootRef=useRef(null)')){
  if(!navigator.includes(resultRef))throw new Error('ProblemNavigator root ref anchor missing')
  navigator=navigator.replace(resultRef,resultRef+"\n  const rootRef=useRef(null)")
}
const showCaseAnchor="  function showCase(){onSelectCase?.(recommendation.caseKey);jumpToPublicCaseResult()}"
if(!navigator.includes('voiceSignal>0')){
  if(!navigator.includes(showCaseAnchor))throw new Error('ProblemNavigator voice effect anchor missing')
  navigator=navigator.replace(showCaseAnchor,`  useEffect(()=>{\n    if(voiceSignal<=0)return\n    rootRef.current?.scrollIntoView({behavior:'smooth',block:'center'})\n    const timer=setTimeout(()=>voice(),350)\n    return()=>clearTimeout(timer)\n  },[voiceSignal])\n\n${showCaseAnchor}`)
}
navigator=navigator.replace('return <section id="asgold-problem-navigator-react"','return <section ref={rootRef} id="asgold-problem-navigator-react"')
fs.writeFileSync(navigatorPath,navigator)

const landingPath='app/modules/public/PublicLanding.js'
let landing=fs.readFileSync(landingPath,'utf8')
const oldFunction=`  function startProblemVoice(){\n    const microphone=document.querySelector('#asgold-problem-navigator-react [data-problem-voice]')\n    if(!microphone)return\n    microphone.scrollIntoView({behavior:'smooth',block:'center'})\n    setTimeout(()=>microphone.click(),350)\n  }\n\n`
landing=landing.replace(oldFunction,'')
landing=landing.replace('const customerModule=<ProblemNavigator outputLanguage={outputLanguage} onRegister={()=>setScreen(\'register\')} onSelectCase={setSelectedPublicCase}/>','const customerModule=<ProblemNavigator outputLanguage={outputLanguage} onRegister={()=>setScreen(\'register\')} onSelectCase={setSelectedPublicCase} voiceSignal={explainerSignal}/>')
landing=landing.replace('onClick={startProblemVoice}>🎙 {problemUi.voice}</button>','onClick={()=>setExplainerSignal(value=>value+1)}>🎙 {problemUi.voice}</button>')
if(landing.includes('document.querySelector'))throw new Error('PublicLanding still contains direct querySelector interaction')
fs.writeFileSync(landingPath,landing)

const guardPath='scripts/test_v46_modular_boundaries.mjs'
let guard=fs.readFileSync(guardPath,'utf8')
const marker="console.log('V46 direct public voice boundary verified.')"
if(!guard.includes(marker)){
  guard += `\nconst directPublicLanding=read('app/modules/public/PublicLanding.js')\nconst directProblemNavigator=read('app/modules/public/ProblemNavigator.js')\nassert.ok(!directPublicLanding.includes('document.querySelector'),'PublicLanding must not locate/click ProblemNavigator controls through the DOM')\nassert.match(directProblemNavigator,/voiceSignal/)\nassert.match(directProblemNavigator,/rootRef/)\nassert.match(directProblemNavigator,/useEffect/)\nconsole.log('V46 direct public voice boundary verified.')\n`
  fs.writeFileSync(guardPath,guard)
}
console.log('V46 direct public voice composition applied')
