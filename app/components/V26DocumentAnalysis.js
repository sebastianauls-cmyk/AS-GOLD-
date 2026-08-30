'use client'

import { useState } from 'react'
import { componentTranslations } from '../lib/v30ComponentTranslations.mjs'

const confidenceLabels = (high,medium,low) => ({hoch:high,high,mittel:medium,medium,mid:medium,niedrig:low,low})

const copy = {
  de:{badge:'V28 · kontrollierte KI-Analyse',title:'KI-Vorschlag bewusst starten',lead:'Die Originaldatei ist privat gespeichert. Eine KI-Auswertung startet erst nach Ihrer ausdrücklichen Bestätigung und bleibt bis zum Speichern ein vorläufiger Vorschlag.',privacyTitle:'Nur synthetische oder wirksam anonymisierte Testdaten',privacyText:'„Analyse starten“ übermittelt diese Datei serverseitig an die OpenAI API. Die Anfrage nutzt store:false; eine Sicherheitsaufbewahrung beim Anbieter von bis zu 30 Tagen kann dennoch gelten.',details:'KI- und Datenschutzdetails',confirm:'Ich bestätige, dass die Datei nur synthetische oder wirksam anonymisierte Testdaten enthält, keine echten personenbezogenen Daten und keine besonderen Kategorien nach Art. 9 DSGVO. Ich starte die einmalige KI-Übermittlung dieses Dokuments.',start:'Analyse starten',analyzing:'Dokument wird analysiert …',unsupported:'Automatisches Auslesen ist derzeit nur für PDF, JPG, PNG, WEBP und GIF möglich. Sie können die Felder trotzdem manuell ausfüllen.',limit:'KI-Analyse: maximal 18 MB pro Datei. Die Upload-Testgrenze von 50 MB gilt nicht für die automatische Auswertung.',uploaded:'Analyse noch nicht gestartet',draft:'KI-Vorschlag · vorläufig und nicht gespeichert',saved:'Geprüfte Angaben gespeichert',facts:'Erkannte Zusatzangaben zur Prüfung',sender:'Absender / Verfasser',recipient:'Empfänger',references:'Akten- / Referenznummern',deadlines:'Genannte Fristen',amounts:'Genannte Beträge',confidence:'Erkennungssicherheit',none:'Keine erkannt',manual:'Alle Vorschläge bleiben änderbar. Erst der Speichern-Button übernimmt die geprüften Angaben.',save:'Geprüfte Angaben bewusst speichern',ready:'Analyse abgeschlossen. Bitte alle Angaben prüfen und anschließend bewusst speichern.',failed:'Die Analyse konnte nicht abgeschlossen werden.',savedMessage:'Die geprüften Dokumentangaben wurden gespeichert.',notStarted:'Noch keine Analyse gestartet. Eine belastbare Bewertung ist ohne geprüften Inhalt nicht möglich.',confidenceValues:confidenceLabels('Hoch','Mittel','Niedrig')},
  en:{badge:'V28 · controlled AI analysis',title:'Deliberately start AI suggestion',lead:'The original file is stored privately. AI analysis starts only after your explicit confirmation and remains provisional until saved.',privacyTitle:'Synthetic or effectively anonymised test data only',privacyText:'“Start analysis” sends this file server-side to the OpenAI API. The request uses store:false; provider security retention of up to 30 days may still apply.',details:'AI and privacy details',confirm:'I confirm the file contains synthetic or effectively anonymised test data only, no real personal data and no GDPR Article 9 special-category data. I start the one-time AI transfer of this document.',start:'Start analysis',analyzing:'Analysing document …',unsupported:'Automatic reading currently supports PDF, JPG, PNG, WEBP and GIF only. You can still complete the fields manually.',limit:'AI analysis: maximum 18 MB per file. The temporary 50 MB upload limit does not apply to automatic analysis.',uploaded:'Analysis not started',draft:'AI suggestion · provisional and not saved',saved:'Reviewed details saved',facts:'Additional recognised details to review',sender:'Sender / author',recipient:'Recipient',references:'File / reference numbers',deadlines:'Stated deadlines',amounts:'Stated amounts',confidence:'Recognition confidence',none:'None recognised',manual:'Every suggestion remains editable. Only the save button adopts the reviewed details.',save:'Deliberately save reviewed details',ready:'Analysis completed. Review every detail, then deliberately save it.',failed:'The analysis could not be completed.',savedMessage:'The reviewed document details were saved.',notStarted:'Analysis has not started. A reliable assessment is not possible without reviewed content.',confidenceValues:confidenceLabels('High','Medium','Low')},
  tr:{badge:'V28 · kontrollü yapay zekâ analizi',title:'Yapay zekâ önerisini bilinçli başlat',lead:'Orijinal dosya özel olarak saklanır. Analiz yalnızca açık onayınızla başlar ve kaydedilene kadar geçici kalır.',privacyTitle:'Yalnızca sentetik veya etkili biçimde anonim test verileri',privacyText:'“Analizi başlat” dosyayı sunucu üzerinden OpenAI API’ye gönderir. İstek store:false kullanır; sağlayıcının 30 güne kadar güvenlik saklaması yine de geçerli olabilir.',details:'Yapay zekâ ve gizlilik ayrıntıları',confirm:'Dosyanın yalnızca sentetik veya etkili biçimde anonimleştirilmiş test verileri içerdiğini; gerçek kişisel veri ve GDPR Madde 9 verisi içermediğini onaylıyorum. Bu belge için tek seferlik yapay zekâ aktarımını başlatıyorum.',start:'Analizi başlat',analyzing:'Belge analiz ediliyor …',unsupported:'Otomatik okuma yalnızca PDF, JPG, PNG, WEBP ve GIF için mümkündür. Alanları yine de elle doldurabilirsiniz.',limit:'Yapay zekâ analizi: dosya başına en fazla 18 MB. Geçici 50 MB yükleme sınırı otomatik analiz için geçerli değildir.',uploaded:'Analiz başlamadı',draft:'Yapay zekâ önerisi · geçici ve kaydedilmedi',saved:'İncelenen bilgiler kaydedildi',facts:'İncelenecek ek bilgiler',sender:'Gönderen / yazar',recipient:'Alıcı',references:'Dosya / referans numaraları',deadlines:'Belirtilen süreler',amounts:'Belirtilen tutarlar',confidence:'Tanıma güveni',none:'Tanınmadı',manual:'Tüm öneriler değiştirilebilir. İncelenen bilgiler yalnızca kaydet düğmesiyle alınır.',save:'İncelenen bilgileri bilinçli kaydet',ready:'Analiz tamamlandı. Tüm bilgileri kontrol edip bilinçli olarak kaydedin.',failed:'Analiz tamamlanamadı.',savedMessage:'İncelenen belge bilgileri kaydedildi.',notStarted:'Analiz henüz başlamadı. İncelenmiş içerik olmadan güvenilir değerlendirme yapılamaz.',confidenceValues:confidenceLabels('Yüksek','Orta','Düşük')},
  pl:{badge:'V28 · kontrolowana analiza AI',title:'Świadomie uruchom propozycję AI',lead:'Oryginalny plik jest zapisany prywatnie. Analiza rozpoczyna się dopiero po wyraźnym potwierdzeniu i pozostaje wstępna do chwili zapisania.',privacyTitle:'Tylko syntetyczne lub skutecznie zanonimizowane dane testowe',privacyText:'„Rozpocznij analizę” przesyła plik po stronie serwera do API OpenAI. Żądanie używa store:false; możliwe jest jednak przechowywanie bezpieczeństwa przez dostawcę do 30 dni.',details:'Szczegóły AI i prywatności',confirm:'Potwierdzam, że plik zawiera wyłącznie dane syntetyczne lub skutecznie zanonimizowane, bez prawdziwych danych osobowych i danych z art. 9 RODO. Uruchamiam jednorazowe przekazanie tego dokumentu do AI.',start:'Rozpocznij analizę',analyzing:'Analizowanie dokumentu …',unsupported:'Automatyczny odczyt obsługuje tylko PDF, JPG, PNG, WEBP i GIF. Pola można nadal uzupełnić ręcznie.',limit:'Analiza AI: maksymalnie 18 MB na plik. Tymczasowy limit wysyłania 50 MB nie dotyczy analizy automatycznej.',uploaded:'Analiza nierozpoczęta',draft:'Propozycja AI · wstępna i niezapisana',saved:'Sprawdzone dane zapisane',facts:'Dodatkowe rozpoznane dane do sprawdzenia',sender:'Nadawca / autor',recipient:'Odbiorca',references:'Numery akt / referencji',deadlines:'Wskazane terminy',amounts:'Wskazane kwoty',confidence:'Pewność rozpoznania',none:'Nie rozpoznano',manual:'Każdą propozycję można zmienić. Dopiero przycisk zapisu przejmuje sprawdzone dane.',save:'Świadomie zapisz sprawdzone dane',ready:'Analiza zakończona. Sprawdź wszystkie dane, a następnie świadomie je zapisz.',failed:'Nie udało się zakończyć analizy.',savedMessage:'Sprawdzone dane dokumentu zostały zapisane.',notStarted:'Analiza nie została rozpoczęta. Bez sprawdzonej treści nie jest możliwa rzetelna ocena.',confidenceValues:confidenceLabels('Wysoka','Średnia','Niska')},
  ru:{badge:'V28 · контролируемый анализ ИИ',title:'Осознанно запустить предложение ИИ',lead:'Исходный файл хранится приватно. Анализ начинается только после явного подтверждения и до сохранения остаётся предварительным.',privacyTitle:'Только синтетические или надёжно анонимизированные тестовые данные',privacyText:'«Начать анализ» передаёт файл на сервере в API OpenAI. Запрос использует store:false; поставщик всё же может хранить данные безопасности до 30 дней.',details:'Подробности об ИИ и конфиденциальности',confirm:'Подтверждаю, что файл содержит только синтетические или надёжно анонимизированные тестовые данные, без реальных персональных данных и данных по ст. 9 GDPR. Я запускаю разовую передачу этого документа ИИ.',start:'Начать анализ',analyzing:'Документ анализируется …',unsupported:'Автоматическое чтение поддерживает только PDF, JPG, PNG, WEBP и GIF. Поля можно заполнить вручную.',limit:'Анализ ИИ: не более 18 МБ на файл. Временный лимит загрузки 50 МБ не применяется к автоматическому анализу.',uploaded:'Анализ не начат',draft:'Предложение ИИ · предварительное и не сохранено',saved:'Проверенные данные сохранены',facts:'Дополнительные распознанные данные для проверки',sender:'Отправитель / автор',recipient:'Получатель',references:'Номера дела / ссылки',deadlines:'Указанные сроки',amounts:'Указанные суммы',confidence:'Уверенность распознавания',none:'Не распознано',manual:'Каждое предложение можно изменить. Только кнопка сохранения принимает проверенные данные.',save:'Осознанно сохранить проверенные данные',ready:'Анализ завершён. Проверьте все данные, затем осознанно сохраните их.',failed:'Не удалось завершить анализ.',savedMessage:'Проверенные данные документа сохранены.',notStarted:'Анализ ещё не начат. Без проверенного содержимого надёжная оценка невозможна.',confidenceValues:confidenceLabels('Высокая','Средняя','Низкая')},
  ar:{badge:'V28 · تحليل ذكاء اصطناعي مضبوط',title:'بدء اقتراح الذكاء الاصطناعي بوعي',lead:'يُحفظ الملف الأصلي بشكل خاص. لا يبدأ التحليل إلا بعد تأكيدك الصريح، ويظل أوليًا حتى الحفظ.',privacyTitle:'بيانات اختبار اصطناعية أو مجهولة الهوية بفعالية فقط',privacyText:'يرسل زر «بدء التحليل» الملف عبر الخادم إلى OpenAI API. يستخدم الطلب store:false، ومع ذلك قد يحتفظ المزود ببيانات أمان حتى 30 يومًا.',details:'تفاصيل الذكاء الاصطناعي والخصوصية',confirm:'أؤكد أن الملف يحتوي فقط على بيانات اختبار اصطناعية أو مجهولة الهوية بفعالية، ولا يحتوي على بيانات شخصية حقيقية أو بيانات خاصة وفق المادة 9 من GDPR. أبدأ النقل لمرة واحدة لهذا المستند إلى الذكاء الاصطناعي.',start:'بدء التحليل',analyzing:'جارٍ تحليل المستند …',unsupported:'يدعم الاستخراج التلقائي PDF وJPG وPNG وWEBP وGIF فقط. ويمكن تعبئة الحقول يدويًا.',limit:'تحليل الذكاء الاصطناعي: 18 ميغابايت كحد أقصى لكل ملف. حد الرفع المؤقت البالغ 50 ميغابايت لا ينطبق على التحليل التلقائي.',uploaded:'لم يبدأ التحليل',draft:'اقتراح ذكاء اصطناعي · أولي وغير محفوظ',saved:'تم حفظ البيانات المراجعة',facts:'بيانات إضافية مستخرجة للمراجعة',sender:'المرسل / المؤلف',recipient:'المستلم',references:'أرقام الملف / المرجع',deadlines:'المهل المذكورة',amounts:'المبالغ المذكورة',confidence:'درجة ثقة الاستخراج',none:'لم يُتعرف على شيء',manual:'يمكن تعديل كل اقتراح. لا تُعتمد البيانات المراجعة إلا بزر الحفظ.',save:'حفظ البيانات المراجعة عن قصد',ready:'اكتمل التحليل. راجع كل البيانات ثم احفظها عن قصد.',failed:'تعذر إكمال التحليل.',savedMessage:'تم حفظ بيانات المستند المراجعة.',notStarted:'لم يبدأ التحليل بعد. لا يمكن إجراء تقييم موثوق من دون محتوى مُراجع.',confidenceValues:confidenceLabels('مرتفعة','متوسطة','منخفضة')}
}

Object.assign(copy, componentTranslations.analysisCopy)

const analysisFilePattern = /\.(pdf|jpe?g|png|webp|gif)$/i

export function getV26AnalysisCopy(language){ return copy[language] || copy.de }

function factValue(value){
  if(Array.isArray(value)) return value.map(factValue).filter(Boolean).join(', ')
  if(value && typeof value==='object') return Object.values(value).map(factValue).filter(Boolean).join(' · ')
  return value==null?'':String(value)
}

export function ControlledDocumentAnalysis({copy:on,item,draft,onChange,onAnalyze,phase,onPhase}){
  const [confirmed,setConfirmed]=useState(false)
  const [busy,setBusy]=useState(false)
  const [facts,setFacts]=useState(null)
  const analyzable=analysisFilePattern.test(item.title||item.file_path||'')
  const status=phase==='draft'?on.draft:phase==='saved'?on.saved:on.uploaded

  async function analyze(){
    if(!confirmed||!analyzable||busy) return
    setBusy(true)
    try{
      const result=await onAnalyze(item)
      if(result){
        const fields=result.fields||{}
        onChange({
          ...draft,
          extracted_text:fields.extracted_text||draft.extracted_text,
          document_type:fields.document_type||draft.document_type,
          document_date:fields.document_date||draft.document_date,
          case_id:fields.case_id||draft.case_id,
          analysis_summary:fields.analysis_summary||draft.analysis_summary,
          analysis_next_step:fields.analysis_next_step||draft.analysis_next_step,
          analysis_generated:true
        })
        setFacts(result.facts)
        setConfirmed(false)
        onPhase('draft')
      }
    }finally{
      setBusy(false)
    }
  }

  const factRows=facts?[
    [on.sender,factValue(facts.sender_or_author)],[on.recipient,factValue(facts.recipient)],
    [on.references,factValue(facts.reference_numbers)],[on.deadlines,factValue(facts.deadlines)],
    [on.amounts,factValue(facts.monetary_amounts)],[on.confidence,on.confidenceValues[facts.confidence]||factValue(facts.confidence)]
  ]:[]

  return <section className="controlledAnalysis" aria-live="polite">
    <div className="analysisHead"><div><span className="modeBadge">{on.badge}</span><h3>{on.title}</h3><p>{on.lead}</p></div><span className={`analysisStatus analysis-${phase}`}>{status}</span></div>
    <div className="analysisConsent"><div><b>{on.privacyTitle}</b><p>{on.privacyText}</p><a href="/ki-transparenz" target="_blank" rel="noreferrer">{on.details||'KI-Transparenz'} →</a></div><button type="button" className="primary" disabled={!confirmed||!analyzable||busy} onClick={analyze}>{busy?on.analyzing:on.start}</button><label><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/><span>{on.confirm}</span></label><small>{on.limit}</small>{!analyzable&&<small className="analysisUnsupported">{on.unsupported}</small>}</div>
    {factRows.length>0&&<div className="analysisFacts"><b>{on.facts}</b><div>{factRows.map(([label,value])=><span key={label}><small>{label}</small><strong>{value||on.none}</strong></span>)}</div></div>}
    <p className="analysisManualNote">{on.manual}</p>
  </section>
}
