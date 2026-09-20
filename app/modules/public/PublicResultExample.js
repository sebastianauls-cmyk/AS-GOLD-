'use client'

import {useState} from 'react'
import {LANGUAGE_CATALOG,outputLanguageNames} from '../language/languageRegistry.mjs'
import {publicEntryCopy,publicExampleOriginals} from './publicEntryCopy.mjs'

export function PublicResultExample({language='de',outputLanguage='de'}){
  const [selected,setSelected]=useState('private')
  const c=publicEntryCopy(language)
  const output=LANGUAGE_CATALOG.some(item=>item.key===outputLanguage)?outputLanguage:'de'
  const result=publicEntryCopy(output)[`${selected}Text`]
  const source=publicExampleOriginals[selected]
  const outputName=(outputLanguageNames[language]||outputLanguageNames.de)[output]||output
  return <section className="publicResultExample" id="beispiel" aria-labelledby="public-example-title" tabIndex={-1}>
    <div className="publicExampleHead"><span className="publicExampleMark" aria-hidden="true">ASH</span><span>{c.sampleTitle}</span></div>
    <h2 id="public-example-title">{c.exampleTitle}</h2>
    <div className="publicExampleChoices" role="group" aria-label={c.exampleTitle}>
      {['private','business'].map(key=><button key={key} type="button" aria-pressed={selected===key} aria-controls="public-example-result" onClick={()=>setSelected(key)}>{c[key]}</button>)}
    </div>
    <div id="public-example-result" aria-live="polite" aria-atomic="true">
      <div className="publicExampleSource"><b>{c.original} · {source.label}</b><blockquote lang={source.language} dir="ltr">{source.text}</blockquote></div>
      <dl className="publicExampleResult">
        {[[c.translation+' · '+outputName,result[0]],[c.meaning,result[1]],[c.next,result[2]]].map(([label,text],index)=><div key={index}><dt><span aria-hidden="true">{index===2?'→':'✓'}</span>{label}</dt><dd lang={output} dir={output==='ar'||output==='fa'?'rtl':'ltr'}>{text}</dd></div>)}
      </dl>
    </div>
    <p className="publicExampleNote">{c.exampleNote}</p>
  </section>
}
