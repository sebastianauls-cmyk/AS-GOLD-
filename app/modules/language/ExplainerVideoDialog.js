'use client'

const explainerVideos={
  de:'/videos/as-gold-v35-de.mp4',
  en:'/videos/as-gold-v35-en.mp4',
  fr:'/videos/as-gold-v35-fr.mp4',
  tr:'/videos/as-gold-v35-tr.mp4',
  pl:'/videos/as-gold-v35-pl.mp4',
  ru:'/videos/as-gold-v35-ru.mp4',
  ar:'/videos/as-gold-v35-ar.mp4',
  fa:'/videos/as-gold-v35-fa.mp4',
  ro:'/videos/as-gold-v35-ro.mp4',
  bg:'/videos/as-gold-v35-bg.mp4'
}

const videoLanguages=[
  ['de','🇩🇪','Deutsch'],
  ['en','🇬🇧','English'],
  ['fr','🇫🇷','Français'],
  ['tr','🇹🇷','Türkçe'],
  ['pl','🇵🇱','Polski'],
  ['ru','🇷🇺','Русский'],
  ['ar','🇸🇦','العربية'],
  ['fa','🇮🇷','فارسی'],
  ['ro','🇷🇴','Română'],
  ['bg','🇧🇬','Български']
]

export const videoButtonText={de:'Erklärvideo',en:'Explainer video',fr:'Vidéo explicative',tr:'Tanıtım videosu',pl:'Film objaśniający',ru:'Объясняющее видео',ar:'فيديو توضيحي',fa:'ویدیوی توضیحی',ro:'Videoclip explicativ',bg:'Обяснително видео'}
const videoCloseText={de:'Schließen',en:'Close',fr:'Fermer',tr:'Kapat',pl:'Zamknij',ru:'Закрыть',ar:'إغلاق',fa:'بستن',ro:'Închide',bg:'Затвори'}

export function ExplainerVideoDialog({language='de',videoLanguage,setVideoLanguage,onClose}){
  const title=videoButtonText[language]||videoButtonText.de
  const closeLabel=videoCloseText[language]||videoCloseText.de
  return <div role="dialog" aria-modal="true" aria-label={title} className="explainerVideoBackdrop" onClick={onClose}>
    <div className="explainerVideoDialog" onClick={event=>event.stopPropagation()}>
      <div className="explainerVideoHead"><strong>AS Gold · {title}</strong><button type="button" onClick={onClose} aria-label={closeLabel}>×</button></div>
      <div className="explainerVideoLanguages">{videoLanguages.map(([key,flag,label])=><button key={key} type="button" onClick={()=>setVideoLanguage(key)} title={label} aria-pressed={videoLanguage===key}>{flag} {label}</button>)}</div>
      <video key={videoLanguage} controls playsInline preload="metadata"><source src={explainerVideos[videoLanguage]||explainerVideos.de} type="video/mp4"/></video>
    </div>
  </div>
}

export { explainerVideos }
