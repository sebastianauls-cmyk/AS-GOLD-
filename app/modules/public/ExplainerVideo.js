'use client'

import { useEffect, useState } from 'react'

const languages=[
  ['de','🇩🇪','Deutsch'],['en','🇬🇧','English'],['fr','🇫🇷','Français'],['tr','🇹🇷','Türkçe'],
  ['pl','🇵🇱','Polski'],['ru','🇷🇺','Русский'],['ar','🇸🇦','العربية'],['fa','🇮🇷','فارسی'],
  ['ro','🇷🇴','Română'],['bg','🇧🇬','Български']
]

const copy={
  de:{title:'AS Gold kurz erklärt',lead:'Das aktuelle Erklärvideo zum neuesten AS-Gold-Stand.',language:'Videosprache',voice:'Video-Ausgabe',female:'Weiblich',male:'Männlich',loading:'Video wird geladen …',show:'▶ AS Gold in 90 Sekunden ansehen',hide:'Video schließen',maleFallback:'Die männliche Fassung dieser Sprache wird noch verarbeitet. Falls sie noch nicht verfügbar ist, wird vorübergehend die aktuelle Sprachfassung gezeigt.'},
  en:{title:'AS Gold explained briefly',lead:'The current explainer video for the latest AS Gold version.',language:'Video language',voice:'Presenter',female:'Female',male:'Male',loading:'Loading video …',show:'▶ Watch AS Gold in 90 seconds',hide:'Close video',maleFallback:'The male version in this language is still being processed. Until it is ready, the current language version may be shown temporarily.'},
  fr:{title:'AS Gold expliqué brièvement',lead:'La vidéo explicative actuelle de la dernière version d’AS Gold.',language:'Langue de la vidéo',voice:'Présentation',female:'Femme',male:'Homme',loading:'Chargement de la vidéo …',show:'▶ Voir AS Gold en 90 secondes',hide:'Fermer la vidéo',maleFallback:'La version masculine dans cette langue est encore en cours de traitement. En attendant, la version linguistique actuelle peut être affichée.'},
  tr:{title:'AS Gold kısaca anlatılıyor',lead:'En güncel AS Gold sürümünün açıklayıcı videosu.',language:'Video dili',voice:'Video sunumu',female:'Kadın',male:'Erkek',loading:'Video yükleniyor …',show:'▶ AS Gold’u 90 saniyede izleyin',hide:'Videoyu kapat',maleFallback:'Bu dildeki erkek sunucu sürümü hâlâ hazırlanıyor. Hazır olana kadar mevcut dil sürümü geçici olarak gösterilebilir.'},
  pl:{title:'AS Gold w skrócie',lead:'Aktualny film objaśniający najnowszą wersję AS Gold.',language:'Język filmu',voice:'Prowadzący',female:'Kobieta',male:'Mężczyzna',loading:'Ładowanie filmu …',show:'▶ Zobacz AS Gold w 90 sekund',hide:'Zamknij film',maleFallback:'Męska wersja w tym języku jest jeszcze przetwarzana. Do czasu jej ukończenia może być tymczasowo wyświetlana bieżąca wersja językowa.'},
  ru:{title:'AS Gold — краткое объяснение',lead:'Актуальное объясняющее видео для последней версии AS Gold.',language:'Язык видео',voice:'Ведущий',female:'Женщина',male:'Мужчина',loading:'Видео загружается …',show:'▶ Посмотреть AS Gold за 90 секунд',hide:'Закрыть видео',maleFallback:'Мужская версия на этом языке ещё обрабатывается. Пока она не готова, временно может показываться текущая языковая версия.'},
  ar:{title:'شرح مختصر لـ AS Gold',lead:'الفيديو التوضيحي الحالي لأحدث إصدار من AS Gold.',language:'لغة الفيديو',voice:'مقدم الفيديو',female:'امرأة',male:'رجل',loading:'جارٍ تحميل الفيديو …',show:'▶ شاهد AS Gold في 90 ثانية',hide:'إغلاق الفيديو',maleFallback:'لا تزال النسخة الرجالية بهذه اللغة قيد المعالجة. حتى تكتمل قد تظهر مؤقتاً النسخة الحالية باللغة المختارة.'},
  fa:{title:'معرفی کوتاه AS Gold',lead:'ویدیوی توضیحی فعلی برای جدیدترین نسخه AS Gold.',language:'زبان ویدیو',voice:'ارائه‌دهنده ویدیو',female:'زن',male:'مرد',loading:'در حال بارگذاری ویدیو …',show:'▶ AS Gold را در ۹۰ ثانیه ببینید',hide:'بستن ویدیو',maleFallback:'نسخه مردانه در این زبان هنوز در حال پردازش است. تا آماده‌شدن آن ممکن است موقتاً نسخه فعلی همان زبان نمایش داده شود.'},
  ro:{title:'AS Gold explicat pe scurt',lead:'Videoclipul explicativ actual pentru cea mai nouă versiune AS Gold.',language:'Limba videoclipului',voice:'Prezentator',female:'Femeie',male:'Bărbat',loading:'Se încarcă videoclipul …',show:'▶ Vedeți AS Gold în 90 de secunde',hide:'Închideți videoclipul',maleFallback:'Versiunea masculină în această limbă este încă în procesare. Până când este gata, poate fi afișată temporar versiunea curentă în limba selectată.'},
  bg:{title:'AS Gold накратко',lead:'Актуалното обяснително видео за най-новата версия на AS Gold.',language:'Език на видеото',voice:'Водещ',female:'Жена',male:'Мъж',loading:'Видеото се зарежда …',show:'▶ Вижте AS Gold за 90 секунди',hide:'Затворете видеото',maleFallback:'Мъжката версия на този език все още се обработва. Докато стане готова, временно може да се показва текущата версия на избрания език.'}
}

const femaleLocalVideos={
  de:'/videos/as-gold-v35-de.mp4',en:'/videos/as-gold-v35-en.mp4',fr:'/videos/as-gold-v35-fr.mp4',tr:'/videos/as-gold-v35-tr.mp4',pl:'/videos/as-gold-v35-pl.mp4',
  ru:'/videos/as-gold-v35-ru.mp4',ar:'/videos/as-gold-v35-ar.mp4',fa:'/videos/as-gold-v35-fa.mp4',ro:'/videos/as-gold-v35-ro.mp4',bg:'/videos/as-gold-v35-bg.mp4'
}

const femaleRemoteVideos={
  de:'https://resource2.heygen.ai/video_translate/6b18109b292448afb9fedf930f8ccdbb-de/original.mp4',en:'https://resource2.heygen.ai/video_translate/3ccf94ed801641f585cd0620cc97de38-en/original.mp4',fr:'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-fr/original.mp4',tr:'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-tr/original.mp4',pl:'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-pl/original.mp4',ru:'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-ru/original.mp4',ar:'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-ar/original.mp4',fa:'https://resource2.heygen.ai/video_translate/4378b94dc0e84ad598a3742c105bbda7-fa_fa-IR/original.mp4',ro:'https://resource2.heygen.ai/video_translate/57f2030d6e6c433997d8627f4c3f5902-ro/original.mp4',bg:'https://resource2.heygen.ai/video_translate/57f2030d6e6c433997d8627f4c3f5902-bg/original.mp4'
}

const maleRemoteVideos={
  de:'https://files2.heygen.ai/aws_pacific/avatar_tmp/969e7dea31614703a4c738c751f0195f/b780eebf3d4ac79f61de519984d98f8c.mp4',en:'https://resource2.heygen.ai/video_translate/2014388e973a4723907ce6f55851921d-en/original.mp4',fr:'https://resource2.heygen.ai/video_translate/2014388e973a4723907ce6f55851921d-fr/original.mp4',tr:'https://resource2.heygen.ai/video_translate/2014388e973a4723907ce6f55851921d-tr/original.mp4',pl:'https://resource2.heygen.ai/video_translate/2014388e973a4723907ce6f55851921d-pl/original.mp4',ru:'https://resource2.heygen.ai/video_translate/2014388e973a4723907ce6f55851921d-ru/original.mp4',ar:'https://resource2.heygen.ai/video_translate/9d9a4ec98ad0459c9d5f144372ae6931-ar/original.mp4',fa:'https://resource2.heygen.ai/video_translate/9d9a4ec98ad0459c9d5f144372ae6931-fa_fa-IR/original.mp4',ro:'https://resource2.heygen.ai/video_translate/9d9a4ec98ad0459c9d5f144372ae6931-ro/original.mp4',bg:'https://resource2.heygen.ai/video_translate/9d9a4ec98ad0459c9d5f144372ae6931-bg/original.mp4'
}

export function ExplainerVideo({language='de'}){
  const [videoLanguage,setVideoLanguage]=useState(language)
  const [presenter,setPresenter]=useState('female')
  const [open,setOpen]=useState(false)
  useEffect(()=>{
    const savedPresenter=localStorage.getItem('asgold-video-presenter')
    if(savedPresenter==='male'||savedPresenter==='female') setPresenter(savedPresenter)
  },[])
  useEffect(()=>{if(languages.some(([code])=>code===language))setVideoLanguage(language)},[language])
  useEffect(()=>{localStorage.setItem('asgold-video-presenter',presenter)},[presenter])
  const c=copy[language]||copy.de
  const rtl=language==='ar'||language==='fa'
  const femaleLocal=femaleLocalVideos[videoLanguage]||femaleLocalVideos.de
  const femaleRemote=femaleRemoteVideos[videoLanguage]||femaleRemoteVideos.de
  const maleRemote=maleRemoteVideos[videoLanguage]||maleRemoteVideos.de
  const buttonStyle=active=>({flex:'1 1 150px',minHeight:46,padding:'10px 14px',border:active?'2px solid #8f6e25':'1px solid #d8d1bd',borderRadius:12,background:active?'#fff6d8':'#fff',color:'#4d3b14',fontWeight:900,cursor:'pointer'})
  return (<section dir={rtl?'rtl':'ltr'} style={{margin:'12px 0 10px',padding:open?16:10,border:'1px solid #d9c792',borderRadius:16,background:'#fff'}}>
    {!open?<button type='button' onClick={()=>setOpen(true)} aria-expanded='false' style={{width:'100%',padding:'12px 14px',border:0,borderRadius:11,background:'#fff8df',color:'#5b4618',fontWeight:900,fontSize:'1rem',cursor:'pointer'}}>{c.show}</button>:<>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'start'}}><div><b style={{display:'block',fontSize:'1.2rem',color:'#4d3b14'}}>{c.title}</b><p style={{margin:'5px 0 12px',color:'#596472'}}>{c.lead}</p></div><button type='button' onClick={()=>setOpen(false)} aria-expanded='true' style={{border:'1px solid #d8d1bd',background:'#fff',borderRadius:10,padding:'7px 9px',cursor:'pointer'}}>{c.hide}</button></div>
      <label style={{display:'grid',gap:5,fontWeight:800,color:'#5d4a1e',maxWidth:340,marginBottom:12}}>{c.language}<select value={videoLanguage} onChange={e=>setVideoLanguage(e.target.value)} style={{padding:'10px 11px',border:'1px solid #d8d1bd',borderRadius:11,background:'#fff'}}>{languages.map(([code,flag,label])=><option value={code} key={code}>{flag} {label}</option>)}</select></label>
      <b style={{display:'block',marginBottom:6,color:'#5d4a1e'}}>{c.voice}</b><div role='group' aria-label={c.voice} style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}><button type='button' aria-pressed={presenter==='female'} onClick={()=>setPresenter('female')} style={buttonStyle(presenter==='female')}>👩 {c.female}</button><button type='button' aria-pressed={presenter==='male'} onClick={()=>setPresenter('male')} style={buttonStyle(presenter==='male')}>👨 {c.male}</button></div>
      {presenter==='male'&&videoLanguage!=='de'&&<p style={{padding:'9px 11px',borderRadius:10,background:'#fff8df',border:'1px solid #ead69e',color:'#65562d',fontSize:'.9rem'}}>{c.maleFallback}</p>}
      <video key={`${videoLanguage}-${presenter}`} controls playsInline preload='metadata' style={{display:'block',width:'100%',borderRadius:14,background:'#151515',aspectRatio:'16 / 9'}}>{presenter==='female'&&<source src={femaleLocal} type='video/mp4'/>}<source src={presenter==='male'?maleRemote:femaleRemote} type='video/mp4'/>{presenter==='male'&&<source src={femaleRemote} type='video/mp4'/>}{c.loading}</video>
    </>}
  </section>)
}
