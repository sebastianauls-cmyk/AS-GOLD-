'use client'

import { useEffect, useMemo, useState } from 'react'
import { LegalFooter } from './LegalFooter'
import { LanguageSwitcher } from '../language/LanguageSwitcher'
import { LegalLanguageContext } from '../language/LegalLanguageContext'
import { localeForLanguage, rtlLanguages, supportedLanguages } from '../language/v36Languages.mjs'
import { APP_VERSION, withAppVersion } from '../release/appRelease.mjs'
import { getLegalPage, legalShellCopy } from './v31LegalTranslations.mjs'

const languageKeys=new Set(supportedLanguages.map(item=>item.key))

function localizedHref(href,language){
  if(!href?.startsWith('/')||language==='de') return href
  const separator=href.includes('?')?'&':'?'
  return `${href}${separator}lang=${language}`
}

function formattedUpdated(updated,language){
  const date=new Date('2026-08-30T00:00:00Z')
  const locale=language==='ar'?'ar-SA-u-ca-gregory':language==='fa'?'fa-IR-u-ca-gregory':localeForLanguage[language]||localeForLanguage.de
  const dateText=new Intl.DateTimeFormat(locale,{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(date)
  const version=updated.includes('Version')?` · ${updated.slice(updated.indexOf('Version'))}`:''
  return `${dateText}${version}`
}

function TranslationSection({section,language,extra}){
  const cardLinks=section.links?.filter(link=>link.length>2)||[]
  const simpleLinks=section.links?.filter(link=>link.length<=2)||[]
  return <section className="legalSection">
    <h2>{section.title}</h2>
    {section.paragraphs?.map((paragraph,index)=><p className="legalTranslatedText" key={index}>{paragraph}</p>)}
    {section.items?.length>0&&<ul>{section.items.map(item=><li key={item}>{item}</li>)}</ul>}
    {cardLinks.length>0&&<div className="legalCardGrid">{cardLinks.map(([href,title,text])=><a className="legalCard" href={localizedHref(href,language)} key={href}><h2>{title}</h2><p>{text}</p><span>→</span></a>)}</div>}
    {simpleLinks.length>0&&<div className="legalTranslatedLinks">{simpleLinks.map(([href,label])=><a className="secondary btn" href={localizedHref(href,language)} key={`${href}-${label}`}>{label}</a>)}</div>}
    {extra}
  </section>
}

function TranslatedLegalBody({page,language,localizedExtra,localizedExtraAfterSection}){
  return <>
    {page.notice&&<LegalNotice tone={page.notice.tone}><b>{page.notice.title}</b><p>{page.notice.text}</p></LegalNotice>}
    {page.sections.map((section,index)=><TranslationSection section={section} language={language} extra={index===localizedExtraAfterSection?localizedExtra:null} key={`${section.title}-${index}`}/>) }
  </>
}

export function LegalSection({title,children,id}){
  return <section className="legalSection" id={id}><h2>{title}</h2>{children}</section>
}

export function LegalNotice({children,tone='info'}){
  return <div className={`legalNotice legalNotice-${tone}`}>{children}</div>
}

export function LegalDocument({pageId,localizable=false,showRelease=false,eyebrow='AS Gold · Rechtliches',title,intro,children,updated='30. August 2026',localizedExtra=null,localizedExtraAfterSection=0}){
  const [language,setLanguage]=useState('de')
  const translated=useMemo(()=>localizable?getLegalPage(pageId,language):null,[localizable,pageId,language])
  const shell=legalShellCopy[language]||legalShellCopy.de
  const baseTitle=translated?.title||title
  const shownTitle=showRelease?withAppVersion(baseTitle):baseTitle
  const shownIntro=translated?.intro||intro

  useEffect(()=>{
    if(!localizable)return
    const queryLanguage=new URLSearchParams(window.location.search).get('lang')
    const savedLanguage=localStorage.getItem('asgold-language')
    if(queryLanguage&&languageKeys.has(queryLanguage)) setLanguage(queryLanguage)
    else if(savedLanguage&&languageKeys.has(savedLanguage)) setLanguage(savedLanguage)
  },[localizable])

  useEffect(()=>{
    const activeLanguage=localizable?language:'de'
    document.documentElement.lang=activeLanguage
    document.documentElement.dir=rtlLanguages.has(activeLanguage)?'rtl':'ltr'
    if(localizable)localStorage.setItem('asgold-language',activeLanguage)
    const url=new URL(window.location.href)
    if(!localizable||activeLanguage==='de') url.searchParams.delete('lang')
    else url.searchParams.set('lang',activeLanguage)
    window.history.replaceState({},'',`${url.pathname}${url.search}${url.hash}`)
    document.title=`${shownTitle} | AS Gold`
  },[language,localizable,shownTitle])

  return <LegalLanguageContext.Provider value={language}><div className="legalSite">
    <header className="legalHeader"><div className="wrap legalHeaderInner"><a className="brand legalHome" href={localizedHref('/',language)}><span className="logo">AS</span><b>AS Gold</b></a><div className="legalHeaderActions">{localizable&&<LanguageSwitcher value={language} onChange={setLanguage} label={shell.eyebrow}/>}<a className="secondary btn legalBackBtn" href={localizedHref('/',language)}><span aria-hidden="true">{rtlLanguages.has(language)?'→':'←'}</span>{shell.back}</a></div></div></header>
    <main className="legalMain wrap">
      <div className="legalTitle"><span className="eyebrow">{language==='de'?eyebrow:shell.eyebrow}{showRelease?` · ${APP_VERSION}`:''}</span><h1>{shownTitle}</h1>{shownIntro&&<p className="lead">{shownIntro}</p>}<p className="legalUpdated">{shell.updated}: {language==='de'?updated:formattedUpdated(updated,language)} · {shell.binding}</p>{language!=='de'&&<p className="legalTranslationNote">{shell.note}</p>}</div>
      <div className="legalBody">{translated?<TranslatedLegalBody page={translated} language={language} localizedExtra={localizedExtra} localizedExtraAfterSection={localizedExtraAfterSection}/>:children}</div>
    </main>
    <LegalFooter language={language}/>
  </div></LegalLanguageContext.Provider>
}
