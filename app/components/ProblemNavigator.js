'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const copy={
  de:{title:'Was ist Ihr Problem?',lead:'Schreiben Sie kurz, was passiert ist – oder sprechen Sie es ein. AS Gold schlägt unverbindlich die passende Fallart und Produktstufe vor.',placeholder:'Zum Beispiel: Ich habe eine falsche Rechnung bekommen und weiß nicht, wie ich antworten soll.',voice:'Problem einsprechen',stop:'Aufnahme stoppen',analyse:'Passende Lösung finden',empty:'Bitte beschreiben Sie Ihr Problem kurz.',unsupported:'Spracheingabe wird von diesem Browser nicht unterstützt. Bitte nutzen Sie das Textfeld oder die Mikrofontaste Ihrer Tastatur.',listening:'Ich höre zu …',recommendation:'Unverbindliche Empfehlung',caseLabel:'Passende Fallart',planLabel:'Empfohlene Stufe',why:'Warum?',showCase:'Passende Fallart ansehen',showPlans:'Produktstufen vergleichen',change:'Sie können die Empfehlung jederzeit ändern.',back:'← Zurück'},
  en:{title:'What is your problem?',lead:'Briefly describe what happened – or say it aloud. AS Gold will suggest a suitable case type and product level.',placeholder:'For example: I received an incorrect invoice and do not know how to respond.',voice:'Speak problem',stop:'Stop recording',analyse:'Find suitable solution',empty:'Please briefly describe your problem.',unsupported:'Voice input is not supported by this browser. Please use the text field or your keyboard microphone.',listening:'Listening …',recommendation:'Non-binding recommendation',caseLabel:'Suggested case type',planLabel:'Suggested level',why:'Why?',showCase:'View case type',showPlans:'Compare product levels',change:'You can change the recommendation at any time.',back:'← Back'},
  fr:{title:'Quel est votre problème ?',lead:'Décrivez brièvement ce qui s’est passé – ou dictez-le. AS Gold propose un type de dossier et un niveau adaptés.',placeholder:'Exemple : j’ai reçu une facture erronée et je ne sais pas comment répondre.',voice:'Dicter le problème',stop:'Arrêter',analyse:'Trouver la solution',empty:'Décrivez brièvement votre problème.',unsupported:'La saisie vocale n’est pas prise en charge par ce navigateur. Utilisez le champ texte ou le micro du clavier.',listening:'Je vous écoute …',recommendation:'Recommandation sans engagement',caseLabel:'Type de dossier',planLabel:'Niveau recommandé',why:'Pourquoi ?',showCase:'Voir le dossier',showPlans:'Comparer les niveaux',change:'Vous pouvez modifier la recommandation à tout moment.',back:'← Retour'},
  tr:{title:'Sorununuz nedir?',lead:'Kısaca ne olduğunu yazın veya söyleyin. AS Gold uygun dosya türünü ve ürün seviyesini önerir.',placeholder:'Örnek: Yanlış bir fatura aldım ve nasıl cevap vereceğimi bilmiyorum.',voice:'Sorunu söyle',stop:'Kaydı durdur',analyse:'Uygun çözümü bul',empty:'Lütfen sorununuzu kısaca açıklayın.',unsupported:'Bu tarayıcı ses girişini desteklemiyor. Metin alanını veya klavye mikrofonunu kullanın.',listening:'Dinliyorum …',recommendation:'Bağlayıcı olmayan öneri',caseLabel:'Uygun dosya türü',planLabel:'Önerilen seviye',why:'Neden?',showCase:'Dosya türünü göster',showPlans:'Seviyeleri karşılaştır',change:'Öneriyi istediğiniz zaman değiştirebilirsiniz.',back:'← Geri'},
  pl:{title:'Jaki masz problem?',lead:'Krótko opisz, co się wydarzyło – lub powiedz to. AS Gold zaproponuje odpowiedni rodzaj sprawy i poziom produktu.',placeholder:'Przykład: otrzymałem błędną fakturę i nie wiem, jak odpowiedzieć.',voice:'Powiedz problem',stop:'Zatrzymaj nagrywanie',analyse:'Znajdź rozwiązanie',empty:'Krótko opisz swój problem.',unsupported:'Ten browser nie obsługuje wprowadzania głosowego. Użyj pola tekstowego lub mikrofonu klawiatury.',listening:'Słucham …',recommendation:'Niewiążąca rekomendacja',caseLabel:'Rodzaj sprawy',planLabel:'Zalecany poziom',why:'Dlaczego?',showCase:'Pokaż sprawę',showPlans:'Porównaj poziomy',change:'Rekomendację można zmienić w każdej chwili.',back:'← Wstecz'},
  ru:{title:'В чем ваша проблема?',lead:'Кратко опишите, что произошло, или скажите это вслух. AS Gold предложит подходящий тип дела и уровень продукта.',placeholder:'Например: я получил неверный счет и не знаю, как ответить.',voice:'Продиктовать',stop:'Остановить запись',analyse:'Найти решение',empty:'Кратко опишите проблему.',unsupported:'Этот браузер не поддерживает голосовой ввод. Используйте поле текста или микрофон клавиатуры.',listening:'Слушаю …',recommendation:'Необязательная рекомендация',caseLabel:'Тип дела',planLabel:'Рекомендуемый уровень',why:'Почему?',showCase:'Показать тип дела',showPlans:'Сравнить уровни',change:'Рекомендацию можно изменить в любое время.',back:'← Назад'},
  ar:{title:'ما مشكلتك؟',lead:'اكتب باختصار ما حدث أو قل ذلك بصوتك. يقترح AS Gold نوع الحالة ومستوى المنتج المناسبين.',placeholder:'مثال: وصلتني فاتورة غير صحيحة ولا أعرف كيف أرد.',voice:'تحدث عن المشكلة',stop:'إيقاف التسجيل',analyse:'ابحث عن الحل المناسب',empty:'يرجى وصف المشكلة باختصار.',unsupported:'هذا المتصفح لا يدعم الإدخال الصوتي. استخدم حقل النص أو ميكروفون لوحة المفاتيح.',listening:'أستمع …',recommendation:'توصية غير ملزمة',caseLabel:'نوع الحالة',planLabel:'المستوى المقترح',why:'لماذا؟',showCase:'عرض نوع الحالة',showPlans:'مقارنة المستويات',change:'يمكنك تغيير التوصية في أي وقت.',back:'رجوع →'},
  fa:{title:'مشکل شما چیست؟',lead:'کوتاه بنویسید چه اتفاقی افتاده یا آن را بگویید. AS Gold نوع پرونده و سطح مناسب محصول را پیشنهاد می‌کند.',placeholder:'مثال: یک فاکتور اشتباه دریافت کرده‌ام و نمی‌دانم چگونه پاسخ دهم.',voice:'بیان مشکل',stop:'توقف ضبط',analyse:'یافتن راه‌حل مناسب',empty:'لطفاً مشکل را کوتاه توضیح دهید.',unsupported:'این مرورگر ورودی صوتی را پشتیبانی نمی‌کند. از کادر متن یا میکروفون صفحه‌کلید استفاده کنید.',listening:'در حال گوش دادن …',recommendation:'پیشنهاد غیرالزام‌آور',caseLabel:'نوع پرونده',planLabel:'سطح پیشنهادی',why:'چرا؟',showCase:'نمایش نوع پرونده',showPlans:'مقایسه سطوح',change:'در هر زمان می‌توانید پیشنهاد را تغییر دهید.',back:'بازگشت →'}
}

const cases={insurance:'Versicherung & Schaden',property:'Miete, Pacht & Immobilie',contract:'Vertrag & Forderung',authority:'Behörde & Sozialversicherung',work:'Arbeit & Abrechnung',business:'Unternehmen & Kunden',dispute:'Streit & Beweise',private:'Privater komplexer Vorgang'}
const plans={start:'AS Gold Start',klar:'AS Gold Klar',analyse:'AS Gold Analyse',komplett:'AS Gold Komplett',business:'AS Gold Business'}
const caseOrder=['insurance','property','contract','authority','work','business','dispute','private']
const keywords={
  insurance:['versicherung','schaden','kasko','police','deckung','unfall','insurer','insurance'],
  property:['miete','mieter','vermieter','pacht','wohnung','haus','immobilie','nebenkosten','kündigung wohnung'],
  contract:['vertrag','rechnung','forderung','kündigung','zahlung','lieferung','leistung','invoice','contract'],
  authority:['behörde','amt','bescheid','krankenkasse','rente','zoll','führerschein','jobcenter','steuer'],
  work:['arbeitgeber','lohn','gehalt','krankengeld','abrechnung','arbeitszeit','kündigung arbeit','employee'],
  business:['kunde','kunden','firma','unternehmen','lieferant','projekt','mitarbeiter','business'],
  dispute:['streit','anwalt','gericht','klage','beweis','widerspruch','mahnbescheid','forderung gegen'],
  private:['reise','flug','auto','fahrzeug','kauf','privat','familie','alltäglich']
}

function normalize(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function hits(text,arr){return arr.reduce((n,w)=>n+(text.includes(normalize(w))?1:0),0)}
function recommend(value){
  const text=normalize(value)
  const scores=Object.fromEntries(Object.entries(keywords).map(([k,v])=>[k,hits(text,v)]))
  let caseKey=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0]?.[0]||'private'
  if(Math.max(...Object.values(scores))===0) caseKey=text.length>180?'dispute':'private'
  let planKey='start'
  if(/mehrere kunden|team|wiederkehr|mandanten|portfolio/.test(text)) planKey='business'
  else if(text.length>420||/komplex|umfangreich|viele unterlagen|komplett/.test(text)) planKey='komplett'
  else if(text.length>240||/risiko|bewerten|analyse|anwalt|gericht|klage/.test(text)) planKey='analyse'
  else if(text.length>120||/frist|widerspruch|fehlt|unklar|prüfen/.test(text)) planKey='klar'
  const reason={start:'Zunächst geht es vor allem um Ordnung und einen verständlichen Überblick.',klar:'Es sollten offene Punkte, Fristen oder Widersprüche sichtbar gemacht werden.',analyse:'Die Beschreibung spricht für eine vertiefte Bewertung mit Risiken und konkreten nächsten Schritten.',komplett:'Der Vorgang wirkt umfangreich und sollte als Ganzes strukturiert und bearbeitet werden.',business:'Die Beschreibung deutet auf mehrere Kunden oder wiederkehrende Arbeitsabläufe hin.'}[planKey]
  return {caseKey,planKey,reason}
}

export function ProblemNavigator(){
  const [host,setHost]=useState(null)
  const [language,setLanguage]=useState('de')
  const [value,setValue]=useState('')
  const [status,setStatus]=useState('')
  const [result,setResult]=useState(null)
  const [listening,setListening]=useState(false)
  const recognitionRef=useRef(null)
  const c=copy[language]||copy.de

  useEffect(()=>{
    const resolve=()=>{
      if(location.pathname!=='/'){setHost(null);return}
      const next=document.querySelector('.heroLayout > div:first-child')||document.querySelector('.hero .wrap > div:first-child')
      setHost(next||null)
      setLanguage(document.documentElement.lang||'de')
      document.querySelectorAll('#asgold-problem-navigator').forEach(el=>el.style.display='none')
    }
    resolve()
    const observer=new MutationObserver(resolve)
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['lang']})
    return ()=>observer.disconnect()
  },[])

  const recommendation=useMemo(()=>result?recommend(value):null,[result,value])
  if(!host) return null

  function analyse(){
    if(!value.trim()){setStatus(c.empty);setResult(null);return}
    setStatus('');setResult(Date.now())
  }
  function voice(){
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition
    if(!SpeechRecognition){setStatus(c.unsupported);return}
    if(listening&&recognitionRef.current){recognitionRef.current.stop();return}
    const rec=new SpeechRecognition();recognitionRef.current=rec
    rec.lang={de:'de-DE',en:'en-GB',fr:'fr-FR',tr:'tr-TR',pl:'pl-PL',ru:'ru-RU',ar:'ar-SA',fa:'fa-IR'}[language]||'de-DE'
    rec.interimResults=true;rec.continuous=false
    const base=value.trim()
    rec.onstart=()=>{setListening(true);setStatus(c.listening)}
    rec.onresult=e=>{const spoken=Array.from(e.results).map(x=>x[0]?.transcript||'').join(' ');setValue([base,spoken].filter(Boolean).join(base?' ':''))}
    rec.onerror=()=>setStatus(c.unsupported)
    rec.onend=()=>{setListening(false);setStatus('')}
    rec.start()
  }
  function goBack(){
    setResult(null)
    setStatus('')
    document.getElementById('fallarten')?.scrollIntoView({behavior:'smooth',block:'start'})
  }
  function showCase(){
    const buttons=[...document.querySelectorAll('.caseChooser .caseChoice')]
    const index=caseOrder.indexOf(recommendation.caseKey)
    if(index>=0&&buttons[index])buttons[index].click()
    document.getElementById('fallarten')?.scrollIntoView({behavior:'smooth',block:'start'})
  }
  function showPlans(){
    const prices=document.querySelector('.prices');(prices?.closest('section')||prices)?.scrollIntoView({behavior:'smooth',block:'start'})
  }

  return createPortal(<section id="asgold-problem-navigator-react" style={{margin:'26px 0 10px',padding:18,border:'1px solid #dccb9f',borderRadius:18,background:'#fff',boxShadow:'0 12px 34px rgba(72,55,18,.08)'}}>
    <div style={{display:'flex',gap:12,alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap'}}><div><b style={{display:'block',fontSize:'1.1rem',color:'#4d3b14'}}>{c.title}</b><p style={{margin:'5px 0 12px',color:'#626c78',lineHeight:1.45,maxWidth:720}}>{c.lead}</p></div><span style={{fontSize:'.75rem',fontWeight:800,color:'#70551b',background:'#fff5d8',border:'1px solid #ead69e',borderRadius:999,padding:'6px 9px'}}>Text + Sprache</span></div>
    <textarea value={value} onChange={e=>setValue(e.target.value)} rows={3} placeholder={c.placeholder} style={{width:'100%',resize:'vertical',minHeight:82,padding:12,border:'1px solid #d8dbe1',borderRadius:12,background:'#fff',color:'#27303b'}}/>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:9}}><button type="button" onClick={goBack} style={{padding:'10px 13px',border:'1px solid #c9ad66',borderRadius:11,background:'#fff',color:'#5b4618',fontWeight:850}}>{c.back}</button><button type="button" onClick={voice} style={{padding:'10px 13px',border:'1px solid #d5c38f',borderRadius:11,background:'#fffaf0',color:'#5b4618',fontWeight:800}}>{listening?'⏹':'🎙'} {listening?c.stop:c.voice}</button><button type="button" onClick={analyse} style={{padding:'10px 14px',border:0,borderRadius:11,background:'#8f6e25',color:'#fff',fontWeight:800}}>{c.analyse}</button></div>
    {status&&<small style={{display:'block',marginTop:8,color:'#6d7682'}}>{status}</small>}
    {recommendation&&<article style={{marginTop:14,padding:15,border:'1px solid #d8c78f',borderRadius:14,background:'linear-gradient(135deg,#fffaf0,#fff)'}}><small style={{fontWeight:850,color:'#79601f'}}>{c.recommendation}</small><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,margin:'9px 0'}}><div><span style={{display:'block',fontSize:'.78rem',color:'#707986'}}>{c.caseLabel}</span><b>{cases[recommendation.caseKey]}</b></div><div><span style={{display:'block',fontSize:'.78rem',color:'#707986'}}>{c.planLabel}</span><b>{plans[recommendation.planKey]}</b></div></div><p style={{margin:'7px 0',color:'#596472',lineHeight:1.45}}><b>{c.why}</b> {recommendation.reason}</p><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}><button type="button" onClick={goBack} style={{padding:'9px 12px',border:'1px solid #c9ad66',borderRadius:10,background:'#fff',color:'#5b4618',fontWeight:850}}>{c.back}</button><button type="button" onClick={showCase} style={{padding:'9px 12px',border:0,borderRadius:10,background:'#8f6e25',color:'#fff',fontWeight:800}}>{c.showCase}</button><button type="button" onClick={showPlans} style={{padding:'9px 12px',border:'1px solid #d5c38f',borderRadius:10,background:'#fff',color:'#5b4618',fontWeight:800}}>{c.showPlans}</button></div><small style={{display:'block',marginTop:9,color:'#6d7682'}}>{c.change}</small></article>}
  </section>,host)
}