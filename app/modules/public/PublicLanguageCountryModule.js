'use client'

import { useId, useState } from 'react'
import { COUNTRY_CATALOG } from '../country/countryRegistry.mjs'
import { localizedCountryName } from '../country/countryLabels.mjs'
import { LANGUAGE_CATALOG, outputLanguageNames } from '../language/languageRegistry.mjs'
import { fillLanguageCountryText, publicLanguageCountryCopy } from './publicLanguageCountryCopy.mjs'
import { publicCaseStartCopy } from './publicCaseStartCopy.mjs'

export function PublicLanguageCountryView({language='de',example,onChange,onStart,idPrefix}){
  const c=publicLanguageCountryCopy(language)
  const start=publicCaseStartCopy(language)
  const countries=COUNTRY_CATALOG.map(country=>({...country,name:localizedCountryName(country.key,language)}))
  const home=countries.find(country=>country.key===example.home)||countries[0]
  const target=countries.find(country=>country.key===example.target)||countries[0]
  const output=LANGUAGE_CATALOG.find(item=>item.key===example.output)||LANGUAGE_CATALOG[0]
  const languageName=(outputLanguageNames[language]||outputLanguageNames.de)?.[output.key]||output.label
  const values={home:home.name,target:target.name,language:languageName,languages:LANGUAGE_CATALOG.length,countries:COUNTRY_CATALOG.length}
  const text=value=>fillLanguageCountryText(value,values)
  const groups=[['home',c.home,countries.map(country=>[country.key,`${country.flag} ${country.name}`])],['target',c.target,countries.map(country=>[country.key,`${country.flag} ${country.name}`])],['output',c.output,LANGUAGE_CATALOG.map(item=>[item.key,item.label])]]
  return <section id="sprachen-rechtsraeume" className="section publicLanguageCountry" aria-labelledby={`${idPrefix}-title`}>
    <div className="wrap">
      <p className="publicLanguageCountryCoverage">{text(c.coverage)}</p>
      <h2 id={`${idPrefix}-title`}>{c.title}</h2><p className="lead">{c.lead}</p>
      <div className="publicLanguageCountryExample">
        <h3>{c.example}</h3>
        {home.key==='PL'&&target.key==='DE'&&<blockquote>{c.quote}</blockquote>}
        <div className="publicLanguageCountryControls">{groups.map(([key,label,options])=><label key={key} htmlFor={`${idPrefix}-${key}`}><span>{label}</span><select id={`${idPrefix}-${key}`} value={example[key]} onChange={event=>onChange(key,event.target.value)}>{options.map(([value,name])=><option value={value} key={value}>{name}</option>)}</select></label>)}</div>
        <div className="publicLanguageCountryResults" aria-live="polite" aria-atomic="true">
          {[[c.translate,text(c.translateBody)],[c.explain,text(c.explainBody)],[c.compare,home.key===target.key?c.same:text(c.compareBody)]].map(([title,body],index)=><article key={title}><span className="publicLanguageCountryNumber" aria-hidden="true">{index+1}</span><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </div>
      <div className="publicLanguageCountryLetter"><h3>{c.letter}</h3><p>{c.letterBody}</p></div>
      <p className="publicLanguageCountryBasis">{c.basis}</p>
      {onStart&&<div className="publicLanguageCountryStart">
        <p id={`${idPrefix}-start-hint`}>{start.hint}</p>
        <div className="actions"><button type="button" className="primary btn" aria-describedby={`${idPrefix}-start-hint`} onClick={()=>onStart({...example},'register')}>{start.start}</button><button type="button" className="secondary btn" aria-describedby={`${idPrefix}-start-hint`} onClick={()=>onStart({...example},'login')}>{start.login}</button></div>
      </div>}
      <div className="publicLanguageCountryNext"><p>{c.note}</p><a href="#preise">{c.plans} →</a></div>
    </div>
  </section>
}

export function PublicLanguageCountryModule({language='de',onStart}){
  const idPrefix=useId()
  // These are illustrative choices, independent of the visitor's saved settings
  // and of any real case. Changing interface language preserves all three.
  const [example,setExample]=useState({home:'PL',target:'DE',output:'pl'})
  return <PublicLanguageCountryView language={language} example={example} onChange={(key,value)=>setExample(current=>({...current,[key]:value}))} onStart={onStart} idPrefix={idPrefix}/>
}
