'use client'

import { useMemo, useRef, useState } from 'react'
import { getProblemLanguageProfile, getSpeechLocale, multilingualKeywords, normalizeProblemLanguage } from './problemNavigatorLanguagesV36.mjs'
import { caseFrequencyWeight } from './casePriorityV56.mjs'
import { jumpToPublicCaseResult } from './caseNavigation'

const plans={start:'AS Gold Start',klar:'AS Gold Klar',analyse:'AS Gold Analyse',komplett:'AS Gold Komplett',business:'AS Gold Business'}
const freeLabels={de:'3 Dokumente kostenlos kennenlernen',en:'Try 3 documents for free',fr:'Découvrir gratuitement avec 3 documents',tr:'3 belgeyi ücretsiz deneyin',pl:'Wypróbuj 3 dokumenty bezpłatnie',ru:'Попробовать 3 документа бесплатно',ar:'جرّب 3 مستندات مجانًا',fa:'۳ سند را رایگان امتحان کنید',ro:'Încercați gratuit cu 3 documente',bg:'Опитайте 3 документа безплатно'}
const inputHelp={
  de:'Beschreiben Sie Ihr Problem einfach in eigenen Worten. Sie müssen keine Fachbegriffe kennen. Schreiben Sie, was passiert ist und was Sie erreichen möchten – oder sprechen Sie es ein.',
  en:'Describe your problem in your own words. You do not need technical terms. Say what happened and what you want to achieve – or speak it aloud.',
  fr:'Décrivez simplement votre problème avec vos propres mots. Aucun terme technique n’est nécessaire. Dites ce qui s’est passé et ce que vous souhaitez obtenir – ou dictez-le.',
  tr:'Sorununuzu kendi sözlerinizle anlatın. Teknik terimler kullanmanız gerekmez. Ne olduğunu ve neye ulaşmak istediğinizi yazın ya da söyleyin.',
  pl:'Opisz problem własnymi słowami. Nie musisz znać fachowych pojęć. Napisz, co się wydarzyło i co chcesz osiągnąć – albo powiedz to.',
  ru:'Опишите проблему своими словами. Специальные термины не нужны. Напишите, что произошло и чего вы хотите добиться, или продиктуйте это.',
  ar:'اشرح مشكلتك بكلماتك الخاصة. لا تحتاج إلى مصطلحات متخصصة. اكتب ما حدث وما الذي تريد الوصول إليه، أو قل ذلك بصوتك.',
  fa:'مشکل خود را با کلمات خودتان توضیح دهید. نیازی به اصطلاحات تخصصی نیست. بنویسید چه اتفاقی افتاده و چه نتیجه‌ای می‌خواهید، یا آن را بیان کنید.',
  ro:'Descrieți problema cu propriile cuvinte. Nu aveți nevoie de termeni tehnici. Scrieți ce s-a întâmplat și ce doriți să obțineți – sau spuneți cu voce tare.',
  bg:'Опишете проблема със свои думи. Не са нужни специални термини. Напишете какво се е случило и какво искате да постигнете – или го кажете с глас.'
}
const inputTitles={de:'So funktioniert die Eingabe:',en:'How to enter your problem:',fr:'Comment saisir votre problème :',tr:'Sorununuzu nasıl girersiniz:',pl:'Jak wpisać problem:',ru:'Как описать проблему:',ar:'كيفية إدخال المشكلة:',fa:'نحوه وارد کردن مشکل:',ro:'Cum introduceți problema:',bg:'Как да въведете проблема:'}
const voiceMessages={
  de:{starting:'Mikrofon wird aktiviert …',done:'Sprache wurde übernommen.',noSpeech:'Es wurde keine Sprache erkannt. Tippen Sie erneut auf das Mikrofon und sprechen Sie nach dem Startsignal.',audio:'Das Mikrofon ist auf diesem Gerät nicht verfügbar oder wird gerade von einer anderen App verwendet.',denied:'Der Mikrofonzugriff ist gesperrt. Öffnen Sie die App- bzw. Browser-Einstellungen, erlauben Sie das Mikrofon für AS Gold und versuchen Sie es erneut.',network:'Die Spracherkennung ist momentan nicht erreichbar. Bitte versuchen Sie es erneut oder verwenden Sie das Mikrofon Ihrer Tastatur.',insecure:'Die Spracheingabe benötigt eine sichere HTTPS-Verbindung.'},
  en:{starting:'Activating microphone …',done:'Speech was added.',noSpeech:'No speech was recognized. Tap the microphone again and speak after it starts.',audio:'The microphone is unavailable or currently used by another app.',denied:'Microphone access is blocked. Allow the microphone for AS Gold in the app or browser settings, then try again.',network:'Speech recognition is temporarily unavailable. Try again or use your keyboard microphone.',insecure:'Voice input requires a secure HTTPS connection.'},
  fr:{starting:'Activation du microphone …',done:'La dictée a été ajoutée.',noSpeech:'Aucune parole reconnue. Touchez de nouveau le microphone et parlez après le démarrage.',audio:'Le microphone est indisponible ou utilisé par une autre application.',denied:'L’accès au microphone est bloqué. Autorisez le microphone pour AS Gold dans les réglages de l’application ou du navigateur.',network:'La reconnaissance vocale est momentanément indisponible. Réessayez ou utilisez le microphone du clavier.',insecure:'La saisie vocale nécessite une connexion HTTPS sécurisée.'},
  tr:{starting:'Mikrofon etkinleştiriliyor …',done:'Konuşma metne eklendi.',noSpeech:'Konuşma algılanmadı. Mikrofona yeniden dokunun ve başladıktan sonra konuşun.',audio:'Mikrofon kullanılamıyor veya başka bir uygulama tarafından kullanılıyor.',denied:'Mikrofon erişimi engellendi. Uygulama veya tarayıcı ayarlarından AS Gold için mikrofona izin verin.',network:'Ses tanıma şu anda kullanılamıyor. Yeniden deneyin veya klavye mikrofonunu kullanın.',insecure:'Sesli giriş için güvenli bir HTTPS bağlantısı gerekir.'},
  pl:{starting:'Włączanie mikrofonu …',done:'Mowa została dodana.',noSpeech:'Nie rozpoznano mowy. Dotknij mikrofonu ponownie i zacznij mówić po uruchomieniu.',audio:'Mikrofon jest niedostępny lub używany przez inną aplikację.',denied:'Dostęp do mikrofonu jest zablokowany. Zezwól AS Gold na mikrofon w ustawieniach aplikacji lub przeglądarki.',network:'Rozpoznawanie mowy jest chwilowo niedostępne. Spróbuj ponownie lub użyj mikrofonu klawiatury.',insecure:'Wprowadzanie głosowe wymaga bezpiecznego połączenia HTTPS.'},
  ru:{starting:'Микрофон включается …',done:'Речь добавлена.',noSpeech:'Речь не распознана. Нажмите микрофон ещё раз и говорите после запуска.',audio:'Микрофон недоступен или используется другим приложением.',denied:'Доступ к микрофону заблокирован. Разрешите микрофон для AS Gold в настройках приложения или браузера.',network:'Распознавание речи временно недоступно. Повторите попытку или используйте микрофон клавиатуры.',insecure:'Для голосового ввода требуется защищённое соединение HTTPS.'},
  ar:{starting:'جارٍ تشغيل الميكروفون …',done:'تمت إضافة الكلام.',noSpeech:'لم يتم التعرف على كلام. اضغط على الميكروفون مرة أخرى وتحدث بعد بدء التشغيل.',audio:'الميكروفون غير متاح أو تستخدمه تطبيقات أخرى.',denied:'تم حظر الوصول إلى الميكروفون. اسمح لـ AS Gold باستخدامه من إعدادات التطبيق أو المتصفح ثم حاول مجددًا.',network:'التعرف على الكلام غير متاح مؤقتًا. حاول مجددًا أو استخدم ميكروفون لوحة المفاتيح.',insecure:'يتطلب الإدخال الصوتي اتصال HTTPS آمنًا.'},
  fa:{starting:'میکروفون در حال فعال‌شدن است …',done:'گفتار به متن افزوده شد.',noSpeech:'گفتاری تشخیص داده نشد. دوباره روی میکروفون بزنید و پس از شروع صحبت کنید.',audio:'میکروفون در دسترس نیست یا برنامه دیگری از آن استفاده می‌کند.',denied:'دسترسی میکروفون مسدود است. در تنظیمات برنامه یا مرورگر، میکروفون را برای AS Gold مجاز کنید.',network:'تشخیص گفتار موقتاً در دسترس نیست. دوباره تلاش کنید یا از میکروفون صفحه‌کلید استفاده کنید.',insecure:'ورودی صوتی به اتصال امن HTTPS نیاز دارد.'},
  ro:{starting:'Se activează microfonul …',done:'Textul dictat a fost adăugat.',noSpeech:'Nu a fost recunoscută nicio voce. Apăsați din nou microfonul și vorbiți după pornire.',audio:'Microfonul nu este disponibil sau este folosit de altă aplicație.',denied:'Accesul la microfon este blocat. Permiteți microfonul pentru AS Gold în setările aplicației sau browserului.',network:'Recunoașterea vocală este temporar indisponibilă. Încercați din nou sau folosiți microfonul tastaturii.',insecure:'Introducerea vocală necesită o conexiune HTTPS securizată.'},
  bg:{starting:'Микрофонът се включва …',done:'Речта е добавена.',noSpeech:'Не е разпозната реч. Натиснете микрофона отново и говорете след стартирането.',audio:'Микрофонът не е наличен или се използва от друго приложение.',denied:'Достъпът до микрофона е блокиран. Разрешете микрофона за AS Gold в настройките на приложението или браузъра.',network:'Разпознаването на реч временно не е налично. Опитайте отново или използвайте микрофона на клавиатурата.',insecure:'Гласовото въвеждане изисква защитена HTTPS връзка.'}
}

function normalize(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function hits(text,words){return words.reduce((total,word)=>total+(text.includes(normalize(word))?1:0),0)}
function recommend(value,profile){
  const text=normalize(value)
  const matches=Object.fromEntries(Object.entries(multilingualKeywords).map(([key,words])=>[key,hits(text,words)]))
  const weightedScores=Object.fromEntries(Object.entries(matches).map(([key,count])=>[key,(count*1000)+(caseFrequencyWeight[key]||0)]))
  let caseKey=Object.entries(weightedScores).sort((left,right)=>right[1]-left[1])[0]?.[0]||'private'
  if(Math.max(...Object.values(matches))===0)caseKey=text.length>180?'dispute':'private'
  let planKey='start'
  const has=terms=>terms.some(term=>text.includes(normalize(term)))
  if(has(['mehrere kunden','team','wiederkehr','mandanten','portfolio','multiple clients','recurring','plusieurs clients','équipe','müşteri','ekip','klienci','zespół','клиент','команда','عملاء','فريق','مشتری','تیم','mai mulți clienți','echipă','recurent','няколко клиента','екип','повтарящ']))planKey='business'
  else if(text.length>420||has(['komplex','umfangreich','viele unterlagen','komplett','complex','extensive','many documents','complet','nombreux documents','karmaşık','kapsamlı','złożon','obszern','сложн','много документов','معقد','مستندات كثيرة','پیچیده','مدارک زیاد','complex','multe documente','сложен','много документи']))planKey='komplett'
  else if(text.length>240||has(['risiko','bewerten','analyse','anwalt','gericht','klage','risk','assess','lawyer','court','analysis','risque','avocat','tribunal','avukat','mahkeme','ryzyko','sąd','риск','суд','مخاطر','محكمة','ریسک','دادگاه','risc','evaluare','avocat','instanță','риск','оценка','адвокат','съд']))planKey='analyse'
  else if(text.length>120||has(['frist','widerspruch','fehlt','unklar','prüfen','deadline','contradiction','missing','review','délai','eksik','süre','termin','brak','срок','противореч','موعد','تناقض','مهلت','termen','contradicție','lipsește','срок','противоречие','липсва']))planKey='klar'
  return {caseKey,planKey,reason:profile.reasons[planKey]||profile.reasons.start}
}

export function ProblemNavigator({outputLanguage='de',onRegister,onSelectCase}){
  const [value,setValue]=useState('')
  const [status,setStatus]=useState('')
  const [result,setResult]=useState(null)
  const [listening,setListening]=useState(false)
  const [voiceStarting,setVoiceStarting]=useState(false)
  const recognitionRef=useRef(null)
  const textRef=useRef(null)
  const statusRef=useRef(null)
  const resultRef=useRef(null)
  const customerLanguage=normalizeProblemLanguage(outputLanguage)
  const profile=getProblemLanguageProfile(customerLanguage)
  const c=profile.ui
  const recommendation=useMemo(()=>result?recommend(result.value,profile):null,[result,profile])

  function analyse(){
    const currentValue=String(textRef.current?.value??value).trim()
    if(!currentValue){
      setStatus(c.empty)
      setResult(null)
      setTimeout(()=>statusRef.current?.scrollIntoView({behavior:'smooth',block:'nearest'}),0)
      return
    }
    if(currentValue!==value)setValue(currentValue)
    setStatus('')
    setResult({at:Date.now(),value:currentValue})
    textRef.current?.blur()
    setTimeout(()=>resultRef.current?.scrollIntoView({behavior:'smooth',block:'center'}),250)
  }

  function updateValue(nextValue){
    setValue(nextValue)
    setResult(null)
    if(status)setStatus('')
  }

  async function voice(){
    const messages=voiceMessages[customerLanguage]||voiceMessages.de
    if(!window.isSecureContext){setStatus(messages.insecure);return}
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition
    if(!SpeechRecognition){setStatus(c.unsupported);textRef.current?.focus();return}
    if(listening&&recognitionRef.current){recognitionRef.current.stop();return}
    try{
      const permission=await navigator.permissions?.query?.({name:'microphone'}).catch(()=>null)
      if(permission?.state==='denied'){setStatus(messages.denied);textRef.current?.focus();return}
      setVoiceStarting(true)
      setStatus(messages.starting)
      const recognition=new SpeechRecognition()
      recognitionRef.current=recognition
      recognition.lang=getSpeechLocale(customerLanguage)
      recognition.interimResults=true
      recognition.continuous=false
      const base=value.trim()
      let receivedText=false
      let recognitionError=''
      recognition.onstart=()=>{setVoiceStarting(false);setListening(true);setStatus(c.listening)}
      recognition.onaudiostart=()=>setStatus(c.listening)
      recognition.onresult=event=>{
        const spoken=Array.from(event.results).map(item=>item[0]?.transcript||'').join(' ').trim()
        if(spoken){receivedText=true;updateValue([base,spoken].filter(Boolean).join(base?' ':''))}
      }
      recognition.onerror=event=>{
        recognitionError=event?.error||'unknown'
        setVoiceStarting(false)
        setListening(false)
        if(recognitionError==='not-allowed'||recognitionError==='service-not-allowed')setStatus(messages.denied)
        else if(recognitionError==='audio-capture')setStatus(messages.audio)
        else if(recognitionError==='no-speech')setStatus(messages.noSpeech)
        else if(recognitionError==='network')setStatus(messages.network)
        else setStatus(c.unsupported)
      }
      recognition.onend=()=>{
        setVoiceStarting(false)
        setListening(false)
        recognitionRef.current=null
        if(!recognitionError)setStatus(receivedText?messages.done:messages.noSpeech)
      }
      recognition.start()
    }catch(error){
      setVoiceStarting(false)
      setListening(false)
      setStatus(error?.name==='NotAllowedError'?messages.denied:c.unsupported)
    }
  }

  function showCase(){onSelectCase?.(recommendation.caseKey);jumpToPublicCaseResult()}
  function showPlans(){document.getElementById('preise')?.scrollIntoView({behavior:'smooth',block:'start'})}
  function startFree(){onRegister?.()}

  const secondary={padding:'10px 13px',border:'1px solid #d5c38f',borderRadius:11,background:'#fffaf0',color:'#5b4618',fontWeight:800,textDecoration:'none',display:'inline-flex',alignItems:'center'}
  const freeText=freeLabels[customerLanguage]||freeLabels.en
  const helpText=inputHelp[customerLanguage]||inputHelp.en
  const inputTitle=inputTitles[customerLanguage]||inputTitles.en

  return <section id="asgold-problem-navigator-react" data-customer-language={customerLanguage} lang={customerLanguage} dir={profile.rtl?'rtl':'ltr'} style={{margin:'26px 0 18px',padding:18,border:'1px solid #dccb9f',borderRadius:18,background:'#fff',boxShadow:'0 12px 34px rgba(72,55,18,.08)'}}>
    <b style={{display:'block',fontSize:'1.35rem',color:'#4d3b14'}}>{c.title}</b>
    <p style={{margin:'8px 0 10px',color:'#626c78',lineHeight:1.45}}>{c.lead}</p>
    <div id="asgold-problem-input-help" style={{margin:'0 0 14px',padding:'10px 12px',borderRadius:12,background:'#fff8df',border:'1px solid #ead69e',color:'#554a32',lineHeight:1.45,fontSize:'.94rem'}}><b style={{display:'block',marginBottom:3}}>{inputTitle}</b>{helpText}</div>
    <form onSubmit={event=>{event.preventDefault();analyse()}} noValidate>
      <textarea ref={textRef} value={value} onChange={event=>updateValue(event.target.value)} onInput={event=>updateValue(event.currentTarget.value)} onCompositionEnd={event=>updateValue(event.currentTarget.value)} name="problem-description" rows={4} placeholder={c.placeholder} aria-label={c.title} aria-describedby="asgold-problem-input-help asgold-problem-status" dir={profile.rtl?'rtl':'ltr'} style={{width:'100%',boxSizing:'border-box',resize:'vertical',minHeight:110,padding:14,border:'2px solid #252525',borderRadius:14,background:'#fff',color:'#27303b',fontSize:'1rem',lineHeight:1.35}}/>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
        <button type="button" data-problem-voice onClick={voice} aria-pressed={listening} disabled={voiceStarting} style={{...secondary,opacity:voiceStarting?.7:1}}>{listening?'⏹':'🎙'} {listening?c.stop:voiceStarting?(voiceMessages[customerLanguage]||voiceMessages.de).starting:c.voice}</button>
        <button type="submit" aria-controls="asgold-problem-result" style={{padding:'10px 14px',border:0,borderRadius:11,background:'#8f6e25',color:'#fff',fontWeight:800}}>{c.analyse}</button>
      </div>
      {status&&<div id="asgold-problem-status" ref={statusRef} role="status" aria-live="polite" style={{display:'block',marginTop:10,padding:'10px 12px',border:'1px solid #d9c792',borderRadius:11,background:'#fff8df',color:'#554515',fontWeight:700,lineHeight:1.4}}>{status}</div>}
    </form>
    {recommendation&&<article id="asgold-problem-result" ref={resultRef} tabIndex={-1} lang={customerLanguage} dir={profile.rtl?'rtl':'ltr'} style={{marginTop:14,padding:16,border:'2px solid #c5a556',borderRadius:14,background:'linear-gradient(135deg,#fff8df,#fff)'}}>
      <small style={{display:'block',fontWeight:850,color:'#79601f',marginBottom:6}}>{c.recommendation}</small>
      <div style={{padding:'12px 13px',borderRadius:12,background:'#fff',border:'1px solid #ead69e',marginBottom:10}}><span style={{display:'block',fontSize:'.78rem',fontWeight:800,color:'#707986',marginBottom:3}}>{c.caseLabel}</span><strong style={{display:'block',fontSize:'1.2rem',color:'#4d3b14'}}>{profile.cases[recommendation.caseKey]}</strong></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}><div><span style={{display:'block',fontSize:'.78rem',color:'#707986'}}>{c.planLabel}</span><b>{plans[recommendation.planKey]}</b></div><div><span style={{display:'block',fontSize:'.78rem',color:'#707986'}}>{c.why}</span><span style={{color:'#596472'}}>{recommendation.reason}</span></div></div>
      <button type="button" onClick={startFree} style={{width:'100%',marginTop:14,padding:'12px 14px',border:0,borderRadius:11,background:'#8f6e25',color:'#fff',fontWeight:900,fontSize:'1rem'}}>✓ {freeText}</button>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}><button type="button" onClick={showCase} style={{padding:'9px 12px',border:0,borderRadius:10,background:'#8f6e25',color:'#fff',fontWeight:800}}>{c.showCase}</button><button type="button" onClick={showPlans} style={secondary}>{c.showPlans}</button></div>
    </article>}
    <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid #ece7d8'}}><a href="#fallarten" style={secondary}>{c.back}</a></div>
  </section>
}
