'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getProblemLanguageProfile, getSpeechLocale, multilingualKeywords, normalizeProblemLanguage } from '../lib/problemNavigatorLanguages.mjs'

const plans={start:'AS Gold Start',klar:'AS Gold Klar',analyse:'AS Gold Analyse',komplett:'AS Gold Komplett',business:'AS Gold Business'}
const caseOrder=['insurance','property','contract','authority','work','business','dispute','private']
function normalize(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function hits(text,arr){return arr.reduce((n,w)=>n+(text.includes(normalize(w))?1:0),0)}
function recommend(value,profile){
  const text=normalize(value)
  const scores=Object.fromEntries(Object.entries(multilingualKeywords).map(([k,v])=>[k,hits(text,v)]))
  let caseKey=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0]?.[0]||'private'
  if(Math.max(...Object.values(scores))===0)caseKey=text.length>180?'dispute':'private'
  let planKey='start'
  const businessTerms=['mehrere kunden','team','wiederkehr','mandanten','portfolio','multiple clients','recurring','plusieurs clients','équipe','müşteri','ekip','klienci','zespół','клиент','команда','عملاء','فريق','مشتری','تیم']
  const completeTerms=['komplex','umfangreich','viele unterlagen','komplett','complex','extensive','many documents','complet','nombreux documents','karmaşık','kapsamlı','złożon','obszern','сложн','много документов','معقد','مستندات كثيرة','پیچیده','مدارک زیاد']
  const analyseTerms=['risiko','bewerten','analyse','anwalt','gericht','klage','risk','assess','lawyer','court','analysis','risque','avocat','tribunal','risk','avukat','mahkeme','ryzyko','sąd','риск','суд','مخاطر','محكمة','ریسک','دادگاه']
  const klarTerms=['frist','widerspruch','fehlt','unklar','prüfen','deadline','contradiction','missing','review','délai','contradiction','eksik','süre','termin','brak','срок','противореч','موعد','تناقض','مهلت','تناقض']
  const has=arr=>arr.some(term=>text.includes(normalize(term)))
  if(has(businessTerms))planKey='business'
  else if(text.length>420||has(completeTerms))planKey='komplett'
  else if(text.length>240||has(analyseTerms))planKey='analyse'
  else if(text.length>120||has(klarTerms))planKey='klar'
  return {caseKey,planKey,reason:profile.reasons[planKey]||profile.reasons.start}
}

export function ProblemNavigator(){
  const [host,setHost]=useState(null)
  const [language,setLanguage]=useState('de')
  const [value,setValue]=useState('')
  const [status,setStatus]=useState('')
  const [result,setResult]=useState(null)
  const [listening,setListening]=useState(false)
  const recognitionRef=useRef(null)
  const textRef=useRef(null)
  const profile=getProblemLanguageProfile(language)
  const c=profile.ui

  useEffect(()=>{
    const resolve=()=>{
      if(location.pathname!=='/'){setHost(null);return}
      const next=document.querySelector('.heroLayout > div:first-child')||document.querySelector('.hero .wrap > div:first-child')
      setHost(next||null)
      setLanguage(normalizeProblemLanguage(document.documentElement.lang||'de'))
      document.querySelectorAll('#asgold-problem-navigator').forEach(el=>el.style.display='none')
    }
    resolve()
    const observer=new MutationObserver(resolve)
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['lang']})
    return ()=>observer.disconnect()
  },[])

  const recommendation=useMemo(()=>result?recommend(value,profile):null,[result,value,profile])
  if(!host)return null

  function analyse(){
    if(!value.trim()){setStatus(c.empty);setResult(null);return}
    setStatus('');setResult(Date.now())
  }

  async function voice(){
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition
    if(!SpeechRecognition){setStatus(c.unsupported);textRef.current?.focus();return}
    if(listening&&recognitionRef.current){recognitionRef.current.stop();return}
    try{
      if(navigator.mediaDevices?.getUserMedia){const stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(t=>t.stop())}
      const rec=new SpeechRecognition()
      recognitionRef.current=rec
      rec.lang=getSpeechLocale(language)
      rec.interimResults=true
      rec.continuous=false
      const base=value.trim()
      rec.onstart=()=>{setListening(true);setStatus(c.listening)}
      rec.onresult=e=>{const spoken=Array.from(e.results).map(x=>x[0]?.transcript||'').join(' ').trim();setValue([base,spoken].filter(Boolean).join(base?' ':''))}
      rec.onerror=e=>{setListening(false);setStatus(e?.error==='not-allowed'||e?.error==='service-not-allowed'?c.denied:c.unsupported)}
      rec.onend=()=>setListening(false)
      rec.start()
    }catch(e){setListening(false);setStatus(e?.name==='NotAllowedError'?c.denied:c.unsupported)}
  }

  function showCase(){
    const buttons=[...document.querySelectorAll('.caseChooser .caseChoice')]
    const index=caseOrder.indexOf(recommendation.caseKey)
    if(index>=0&&buttons[index])buttons[index].click()
    location.hash='fallarten'
  }
  function showPlans(){const prices=document.querySelector('.prices');const target=prices?.closest('section')||prices;if(target)target.scrollIntoView({behavior:'smooth',block:'start'})}
  const secondary={padding:'10px 13px',border:'1px solid #d5c38f',borderRadius:11,background:'#fffaf0',color:'#5b4618',fontWeight:800,textDecoration:'none',display:'inline-flex',alignItems:'center'}

  return createPortal(<section id="asgold-problem-navigator-react" dir={profile.rtl?'rtl':'ltr'} style={{margin:'26px 0 10px',padding:18,border:'1px solid #dccb9f',borderRadius:18,background:'#fff',boxShadow:'0 12px 34px rgba(72,55,18,.08)'}}>
    <div style={{display:'flex',gap:12,alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap'}}><div><b style={{display:'block',fontSize:'1.1rem',color:'#4d3b14'}}>{c.title}</b><p style={{margin:'5px 0 12px',color:'#626c78',lineHeight:1.45,maxWidth:720}}>{c.lead}</p></div></div>
    <textarea ref={textRef} value={value} onChange={e=>{setValue(e.target.value);setResult(null)}} rows={3} placeholder={c.placeholder} dir={profile.rtl?'rtl':'ltr'} style={{width:'100%',resize:'vertical',minHeight:82,padding:12,border:'1px solid #d8dbe1',borderRadius:12,background:'#fff',color:'#27303b'}}/>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:9}}><button type="button" onClick={voice} style={secondary}>{listening?'⏹':'🎙'} {listening?c.stop:c.voice}</button><button type="button" onClick={analyse} style={{padding:'10px 14px',border:0,borderRadius:11,background:'#8f6e25',color:'#fff',fontWeight:800}}>{c.analyse}</button></div>
    {status&&<small style={{display:'block',marginTop:8,color:'#6d7682'}}>{status}</small>}

    {recommendation&&<article style={{marginTop:12,padding:16,border:'2px solid #c5a556',borderRadius:14,background:'linear-gradient(135deg,#fff8df,#fff)'}}>
      <small style={{display:'block',fontWeight:850,color:'#79601f',marginBottom:6}}>{c.recommendation}</small>
      <div style={{padding:'12px 13px',borderRadius:12,background:'#fff',border:'1px solid #ead69e',marginBottom:10}}>
        <span style={{display:'block',fontSize:'.78rem',fontWeight:800,color:'#707986',marginBottom:3}}>{c.caseLabel}</span>
        <strong style={{display:'block',fontSize:'1.2rem',color:'#4d3b14'}}>{profile.cases[recommendation.caseKey]}</strong>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,margin:'9px 0'}}>
        <div><span style={{display:'block',fontSize:'.78rem',color:'#707986'}}>{c.planLabel}</span><b>{plans[recommendation.planKey]}</b></div>
        <div><span style={{display:'block',fontSize:'.78rem',color:'#707986'}}>{c.why}</span><span style={{color:'#596472',lineHeight:1.45}}>{recommendation.reason}</span></div>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}><button type="button" onClick={showCase} style={{padding:'9px 12px',border:0,borderRadius:10,background:'#8f6e25',color:'#fff',fontWeight:800}}>{c.showCase}</button><button type="button" onClick={showPlans} style={secondary}>{c.showPlans}</button></div>
      <small style={{display:'block',marginTop:9,color:'#6d7682'}}>{c.change}</small>
    </article>}

    <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid #ece7d8'}}><a href="#fallarten" style={secondary}>{c.back}</a></div>
  </section>,host)
}