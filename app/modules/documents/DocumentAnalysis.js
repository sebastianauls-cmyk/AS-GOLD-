'use client'

import { useState } from 'react'
import { componentTranslations } from '../lib/v30ComponentTranslations.mjs'
import { APP_VERSION } from '../release/appRelease.mjs'

const confidenceLabels=(high,medium,low)=>({hoch:high,high,mittel:medium,medium,mid:medium,niedrig:low,low})

const fallback={
  badge:'Dokumentanalyse',title:'KI-Analyse bewusst starten',lead:'Die Originaldatei ist privat gespeichert. Die Analyse startet erst nach Ihrer ausdrücklichen Bestätigung und bleibt bis zum Speichern ein vorläufiges Ergebnis.',privacyTitle:'Dokument zur KI-Analyse freigeben',privacyText:'„Analyse starten“ übermittelt dieses Dokument serverseitig an die OpenAI API. Die Verarbeitung erfolgt nur für diese Analyse und das Ergebnis muss anschließend geprüft werden.',details:'KI- und Datenschutzdetails',confirm:'Ich bestätige, dass ich dieses Dokument für die einmalige KI-Analyse freigebe und die Verarbeitungshinweise zur Kenntnis genommen habe.',start:'Analyse starten',analyzing:'Dokument wird analysiert …',unsupported:'Automatisches Auslesen ist derzeit nur für PDF, JPG, PNG, WEBP und GIF möglich.',limit:'KI-Analyse: maximal 18 MB pro Datei.',uploaded:'Analyse noch nicht gestartet',draft:'KI-Ergebnis · vorläufig und nicht gespeichert',saved:'Geprüfte Angaben gespeichert',facts:'Erkannte Zusatzangaben zur Prüfung',sender:'Absender / Verfasser',recipient:'Empfänger',references:'Akten- / Referenznummern',deadlines:'Genannte Fristen',amounts:'Genannte Beträge',confidence:'Erkennungssicherheit',none:'Keine erkannt',manual:'Alle Ergebnisse bleiben änderbar. Erst der Speichern-Button übernimmt die geprüften Angaben.',save:'Geprüfte Angaben bewusst speichern',ready:'Analyse abgeschlossen. Bitte alle Angaben prüfen und anschließend bewusst speichern.',failed:'Die Analyse konnte nicht abgeschlossen werden.',savedMessage:'Die geprüften Dokumentangaben wurden gespeichert.',notStarted:'Noch keine Analyse gestartet. Eine belastbare Bewertung ist ohne geprüften Inhalt nicht möglich.',confidenceValues:confidenceLabels('Hoch','Mittel','Niedrig')
}

const currentOverrides={
  de:{badge:'Dokumentanalyse',privacyTitle:'Dokument zur KI-Analyse freigeben',privacyText:'„Analyse starten“ übermittelt dieses Dokument serverseitig an die OpenAI API. Die Verarbeitung erfolgt nur für diese Analyse und das Ergebnis muss anschließend geprüft werden.',confirm:'Ich bestätige, dass ich dieses Dokument für die einmalige KI-Analyse freigebe und die Verarbeitungshinweise zur Kenntnis genommen habe.',limit:'KI-Analyse: maximal 18 MB pro Datei.'},
  en:{badge:'Document analysis',privacyTitle:'Approve document for AI analysis',privacyText:'“Start analysis” sends this document server-side to the OpenAI API for this analysis. The result must be reviewed before it is saved.',confirm:'I confirm that I approve this document for one-time AI analysis and have read the processing information.',limit:'AI analysis: maximum 18 MB per file.'},
  pl:{badge:'Analiza dokumentu',privacyTitle:'Zatwierdź dokument do analizy AI',privacyText:'„Rozpocznij analizę” przesyła dokument po stronie serwera do API OpenAI w celu tej analizy. Wynik należy sprawdzić przed zapisaniem.',confirm:'Potwierdzam zgodę na jednorazową analizę tego dokumentu przez AI i zapoznałem(-am) się z informacjami o przetwarzaniu.',limit:'Analiza AI: maksymalnie 18 MB na plik.'},
  tr:{badge:'Belge analizi',privacyTitle:'Belgeyi yapay zekâ analizine onayla',privacyText:'“Analizi başlat” bu belgeyi sunucu üzerinden bu analiz için OpenAI API’ye gönderir. Sonuç kaydedilmeden önce kontrol edilmelidir.',confirm:'Bu belgeyi tek seferlik yapay zekâ analizi için onayladığımı ve işleme bilgilerini okuduğumu doğruluyorum.',limit:'Yapay zekâ analizi: dosya başına en fazla 18 MB.'},
  ru:{badge:'Анализ документа',privacyTitle:'Разрешить анализ документа ИИ',privacyText:'«Начать анализ» передаёт документ на сервере в OpenAI API для этой обработки. Результат необходимо проверить перед сохранением.',confirm:'Подтверждаю разрешение на однократный анализ этого документа ИИ и ознакомление с информацией об обработке.',limit:'Анализ ИИ: не более 18 МБ на файл.'},
  ar:{badge:'تحليل المستند',privacyTitle:'السماح بتحليل المستند بالذكاء الاصطناعي',privacyText:'يرسل زر «بدء التحليل» هذا المستند عبر الخادم إلى OpenAI API لإجراء هذا التحليل. يجب مراجعة النتيجة قبل حفظها.',confirm:'أؤكد موافقتي على تحليل هذا المستند مرة واحدة بالذكاء الاصطناعي واطلاعي على معلومات المعالجة.',limit:'تحليل الذكاء الاصطناعي: حد أقصى 18 ميغابايت لكل ملف.'},
  fr:{badge:'Analyse du document',privacyTitle:'Autoriser l’analyse IA du document',privacyText:'« Lancer l’analyse » transmet ce document côté serveur à l’API OpenAI pour cette analyse. Le résultat doit être vérifié avant enregistrement.',confirm:'Je confirme autoriser ce document pour une analyse IA unique et avoir pris connaissance des informations de traitement.',limit:'Analyse IA : 18 Mo maximum par fichier.'},
  fa:{badge:'تحلیل سند',privacyTitle:'اجازه تحلیل سند با هوش مصنوعی',privacyText:'«شروع تحلیل» این سند را از طریق سرور برای همین تحلیل به API اوپن‌ای‌آی ارسال می‌کند. نتیجه باید پیش از ذخیره بررسی شود.',confirm:'تأیید می‌کنم که این سند را برای یک بار تحلیل هوش مصنوعی مجاز می‌دانم و اطلاعات پردازش را مطالعه کرده‌ام.',limit:'تحلیل هوش مصنوعی: حداکثر ۱۸ مگابایت برای هر فایل.'},
  ro:{badge:'Analiza documentului',privacyTitle:'Autorizează documentul pentru analiza AI',privacyText:'„Pornește analiza” transmite documentul prin server către API OpenAI pentru această analiză. Rezultatul trebuie verificat înainte de salvare.',confirm:'Confirm că autorizez acest document pentru o analiză AI unică și că am citit informațiile privind prelucrarea.',limit:'Analiză AI: maximum 18 MB per fișier.'},
  bg:{badge:'Анализ на документ',privacyTitle:'Разрешаване на документа за AI анализ',privacyText:'„Стартиране на анализа“ изпраща документа през сървъра към OpenAI API за този анализ. Резултатът трябва да бъде проверен преди записване.',confirm:'Потвърждавам, че разрешавам еднократен AI анализ на този документ и съм прочел информацията за обработването.',limit:'AI анализ: максимум 18 MB на файл.'},
  vi:{badge:'Phân tích tài liệu',privacyTitle:'Cho phép phân tích tài liệu bằng AI',privacyText:'“Bắt đầu phân tích” gửi tài liệu này qua máy chủ tới OpenAI API cho lần phân tích này. Kết quả phải được kiểm tra trước khi lưu.',confirm:'Tôi xác nhận cho phép phân tích tài liệu này một lần bằng AI và đã đọc thông tin xử lý dữ liệu.',limit:'Phân tích AI: tối đa 18 MB cho mỗi tệp.'}
}

const analysisFilePattern=/\.(pdf|jpe?g|png|webp|gif)$/i

export function getV26AnalysisCopy(language){
  const translated=componentTranslations.analysisCopy?.[language]||componentTranslations.analysisCopy?.de||{}
  return {...fallback,...translated,...(currentOverrides[language]||currentOverrides.de),badge:`${APP_VERSION} · ${(currentOverrides[language]||currentOverrides.de).badge}`}
}

function factValue(value){
  if(Array.isArray(value)) return value.map(factValue).filter(Boolean).join(', ')
  if(value&&typeof value==='object') return Object.values(value).map(factValue).filter(Boolean).join(' · ')
  return value==null?'':String(value)
}

export function ControlledDocumentAnalysis({copy:on,item,draft,onChange,onAnalyze,phase,onPhase,analysisAllowed=true,classificationMessage=''}){
  const [confirmed,setConfirmed]=useState(false)
  const [busy,setBusy]=useState(false)
  const [facts,setFacts]=useState(null)
  const analyzable=analysisFilePattern.test(item.title||item.file_path||'')
  const status=phase==='draft'?on.draft:phase==='saved'?on.saved:on.uploaded

  async function analyze(){
    if(!confirmed||!analyzable||!analysisAllowed||busy) return
    setBusy(true)
    try{
      const result=await onAnalyze(item)
      if(result){
        const fields=result.fields||{}
        onChange({...draft,extracted_text:fields.extracted_text||draft.extracted_text,document_type:fields.document_type||draft.document_type,document_date:fields.document_date||draft.document_date,case_id:fields.case_id||draft.case_id,analysis_summary:fields.analysis_summary||draft.analysis_summary,analysis_next_step:fields.analysis_next_step||draft.analysis_next_step,analysis_generated:true})
        setFacts(result.facts)
        setConfirmed(false)
        onPhase('draft')
      }
    }finally{setBusy(false)}
  }

  const factRows=facts?[[on.sender,factValue(facts.sender_or_author)],[on.recipient,factValue(facts.recipient)],[on.references,factValue(facts.reference_numbers)],[on.deadlines,factValue(facts.deadlines)],[on.amounts,factValue(facts.monetary_amounts)],[on.confidence,on.confidenceValues?.[facts.confidence]||factValue(facts.confidence)]]:[]

  return <section className="controlledAnalysis" aria-live="polite">
    <div className="analysisHead"><div><span className="modeBadge">{on.badge}</span><h3>{on.title}</h3><p>{on.lead}</p></div><span className={`analysisStatus analysis-${phase}`}>{status}</span></div>
    <div className="analysisConsent"><div><b>{on.privacyTitle}</b><p>{on.privacyText}</p><a href="/ki-transparenz" target="_blank" rel="noreferrer">{on.details||'KI-Transparenz'} →</a></div><button type="button" className="primary" disabled={!confirmed||!analyzable||!analysisAllowed||busy} onClick={analyze}>{busy?on.analyzing:on.start}</button><label><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)} disabled={!analysisAllowed}/><span>{on.confirm}</span></label><small>{on.limit}</small>{!analysisAllowed&&<small className="analysisUnsupported">{classificationMessage}</small>}{!analyzable&&<small className="analysisUnsupported">{on.unsupported}</small>}</div>
    {factRows.length>0&&<div className="analysisFacts"><b>{on.facts}</b><div>{factRows.map(([label,value])=><span key={label}><small>{label}</small><strong>{value||on.none}</strong></span>)}</div></div>}
    <p className="analysisManualNote">{on.manual}</p>
  </section>
}
