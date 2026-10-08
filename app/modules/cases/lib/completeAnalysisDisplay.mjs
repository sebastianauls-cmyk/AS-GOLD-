import {monthlyCalculationSummaries} from './monthlyCalculationSummary.mjs'

const monthlyLabels={de:'Rechnerische Monatssumme',en:'Calculated monthly total',fr:'Total mensuel calculé',tr:'Hesaplanan aylık toplam',pl:'Obliczona suma miesięczna',ru:'Расчётная месячная сумма',ar:'المجموع الشهري المحسوب',fa:'مجموع ماهانه محاسبه‌شده',ro:'Total lunar calculat',bg:'Изчислена месечна сума',vi:'Tổng hàng tháng được tính'}
const labels={
 de:['Auswertung','Berechnungen','Voraussetzungen','Noch offen','Quellen','Rechenweg','Angenommen','Beantwortet','Bedingt','Offen','Fallfragen werden geprüft …','Passende Quellen werden recherchiert …','Diese ältere Auswertung enthält noch keine verbundene Recherche und Berechnung. Mit „Neu erstellen“ erhältst du die erweiterte Prüfung.'],
 en:['Analysis','Calculations','Conditions','Still unresolved','Sources','Calculation','Assumed','Answered','Conditional','Open','Checking the case questions …','Researching relevant sources …','This older analysis does not include the connected research and calculations. Create it again for the expanded review.'],
 fr:['Analyse','Calculs','Conditions','Points non résolus','Sources','Méthode de calcul','Hypothèse','Répondu','Conditionnel','Ouvert','Examen des questions du dossier …','Recherche des sources pertinentes …','Cette ancienne analyse ne comprend pas la recherche et les calculs intégrés. Recréez-la pour obtenir l’examen élargi.'],
 tr:['İnceleme','Hesaplamalar','Koşullar','Açık kalanlar','Kaynaklar','Hesaplama','Varsayım','Yanıtlandı','Koşullu','Açık','Dosya soruları inceleniyor …','İlgili kaynaklar araştırılıyor …','Bu eski inceleme bütünleşik araştırma ve hesaplama içermiyor. Genişletilmiş inceleme için yeniden oluşturun.'],
 pl:['Analiza','Obliczenia','Warunki','Nierozstrzygnięte kwestie','Źródła','Sposób obliczenia','Założenie','Odpowiedź','Warunkowe','Otwarte','Sprawdzanie zagadnień sprawy …','Wyszukiwanie odpowiednich źródeł …','Ta wcześniejsza analiza nie zawiera połączonego badania źródeł i obliczeń. Utwórz ją ponownie, aby uzyskać rozszerzoną analizę.'],
 ru:['Анализ','Расчёты','Условия','Нерешённые вопросы','Источники','Формула','Допущение','Ответ дан','Условно','Открыто','Проверка вопросов дела …','Поиск подходящих источников …','Этот прежний анализ не включает объединённое исследование и расчёты. Создайте его заново для расширенной проверки.'],
 ar:['التحليل','الحسابات','الشروط','مسائل لم تُحسم','المصادر','طريقة الحساب','افتراض','تمت الإجابة','مشروط','مفتوح','جارٍ فحص مسائل القضية …','جارٍ البحث عن المصادر المناسبة …','لا يشمل هذا التحليل السابق البحث والحسابات المترابطة. أنشئه مجدداً للحصول على المراجعة الموسعة.'],
 fa:['تحلیل','محاسبات','شرایط','موارد حل‌نشده','منابع','روش محاسبه','فرض','پاسخ داده شده','مشروط','باز','در حال بررسی پرسش‌های پرونده …','در حال پژوهش منابع مرتبط …','این تحلیل قدیمی پژوهش و محاسبات یکپارچه را ندارد. برای بررسی گسترده‌تر آن را دوباره ایجاد کنید.'],
 ro:['Analiză','Calcule','Condiții','Aspecte nerezolvate','Surse','Metoda de calcul','Ipoteză','Răspuns','Condiționat','Deschis','Se verifică întrebările cazului …','Se cercetează sursele relevante …','Această analiză anterioară nu include cercetarea și calculele conectate. Recreați-o pentru verificarea extinsă.'],
 bg:['Анализ','Изчисления','Условия','Нерешени въпроси','Източници','Начин на изчисление','Допускане','Отговорено','Условно','Отворено','Проверка на въпросите по случая …','Проучване на подходящи източници …','Този по-стар анализ не включва свързаното проучване и изчисления. Създайте го отново за разширена проверка.'],
 vi:['Phân tích','Tính toán','Điều kiện','Vấn đề chưa giải quyết','Nguồn','Cách tính','Giả định','Đã trả lời','Có điều kiện','Còn mở','Đang xem xét các câu hỏi của vụ việc …','Đang nghiên cứu các nguồn liên quan …','Phân tích trước đây chưa có phần nghiên cứu và tính toán tích hợp. Hãy tạo lại để được kiểm tra đầy đủ hơn.']
}
const keys=['analysis','calculations','conditions','limitations','sources','formula','assumption','answered','conditional','open','planning','research','legacy']
const traceLabels={
 de:['Originalunterlage','Aus Berechnung','Zugehöriger Schritt','Fallfragen','Nicht angegeben'],
 en:['Original document','From calculation','Related step','Case questions','Not provided'],
 fr:['Document original','Issu du calcul','Étape associée','Questions du dossier','Non indiqué'],
 tr:['Asıl belge','Hesaplamadan','İlgili adım','Dosya soruları','Belirtilmemiş'],
 pl:['Dokument źródłowy','Z obliczenia','Powiązany krok','Zagadnienia sprawy','Nie podano'],
 ru:['Исходный документ','Из расчёта','Связанный шаг','Вопросы дела','Не указано'],
 ar:['المستند الأصلي','من الحساب','الخطوة ذات الصلة','مسائل القضية','غير مذكور'],
 fa:['سند اصلی','از محاسبه','گام مرتبط','پرسش‌های پرونده','ذکر نشده'],
 ro:['Document original','Din calcul','Pas asociat','Întrebările cazului','Nespecificat'],
 bg:['Оригинален документ','От изчисление','Свързана стъпка','Въпроси по случая','Не е посочено'],
 vi:['Tài liệu gốc','Từ phép tính','Bước liên quan','Câu hỏi của vụ việc','Chưa cung cấp']
}
const traceKeys=['document','derived','relatedSteps','topics','unavailable']
const evidenceLabels={de:'Beleg',en:'Evidence',fr:'Preuve',tr:'Kanıt',pl:'Dowód',ru:'Подтверждение',ar:'دليل',fa:'مدرک',ro:'Dovadă',bg:'Доказателство',vi:'Bằng chứng'}
export function completeAnalysisCopy(language='de'){return Object.fromEntries([
  ...keys.map((key,index)=>[key,(labels[language]||labels.de)[index]]),
  ...traceKeys.map((key,index)=>[key,(traceLabels[language]||traceLabels.de)[index]]),
  ['evidence',evidenceLabels[language]||evidenceLabels.de]
])}
const sourceKey=url=>String(url||'').split('#')[0]
const number=(value,language)=>{
  const text=String(value),[whole,fraction]=text.split('.'),format=new Intl.NumberFormat(language)
  const integer=BigInt(whole),formatted=integer===0n&&text.startsWith('-')?format.format(-0):format.format(integer)
  if(!fraction)return formatted
  const decimal=format.formatToParts(1.1).find(part=>part.type==='decimal').value
  return formatted+decimal+[...fraction].map(digit=>format.format(Number(digit))).join('')
}
// Shared semantic blocks keep the visible full analysis and Word/PDF identical.
export function completeAnalysisBlocks(analysis,language='de',{steps=[],documents=[]}={}){
  if(!analysis)return []
  const ui=completeAnalysisCopy(language),blocks=[]
  const documentTitles=new Map(documents.map(doc=>[doc.id,doc.title]))
  const stepTitles=new Map(steps.map((step,index)=>[step.id,`${index+1}. ${step.title}`]))
  const topicTitles=new Map(analysis.topics.map(topic=>[topic.id,topic.title]))
  const calculationTitles=new Map(analysis.calculations.map(calculation=>[calculation.id,calculation.title]))
  const add=(text,kind='body',reference={})=>{if(text)blocks.push({text,kind,...reference})}
  const evidence=new Map(),usedSources=new Set()
  let evidenceCount=0
  const addQuote=(quote,reference={},showUrl=false)=>{
    const origin=reference.documentId?['document',reference.documentId]:reference.url?['source',reference.url]:null
    const key=origin?JSON.stringify([...origin,quote]):null
    const previous=key&&evidence.get(key)
    if(previous){add(ui.evidence+' '+previous,'meta',{...reference,evidenceRef:previous});return}
    const id=++evidenceCount
    if(key)evidence.set(key,id)
    add(ui.evidence+' '+id+': „'+quote+'“'+(showUrl?'\n'+reference.url:''),'meta',{...reference,evidenceId:id})
  }
  add(ui.analysis,'heading')
  for(const topic of analysis.topics){
    add(topic.title+' · '+ui[topic.status],'heading');add(topic.conclusion)
    if(topic.conditions)add(ui.conditions+': '+topic.conditions)
    for(const source of topic.sources){usedSources.add(sourceKey(source.url));addQuote(source.quote,{url:source.url},true)}
    for(const id of topic.step_ids||[])add(ui.relatedSteps+': '+(stepTitles.get(id)||id),'meta',{stepId:id})
  }
  if(analysis.calculations.length)add(ui.calculations,'heading')
  for(const summary of monthlyCalculationSummaries(analysis)){
    add((monthlyLabels[language]||monthlyLabels.de)+': '+number(summary.result,language)+' '+summary.unit,'heading')
    add(summary.parts.map(part=>part.title+': '+number(part.result,language)+' '+part.unit).join('\n'))
    add(ui.formula+': '+summary.parts.map(part=>number(part.result,language)).join(' + ')+' = '+number(summary.result,language)+' '+summary.unit,'meta')
    add(ui.derived+': '+summary.total.title,'meta')
    if(summary.total.conditions)add(ui.conditions+': '+summary.total.conditions)
  }
  for(const calculation of analysis.calculations){
    add(calculation.title+': '+number(calculation.result,language)+' '+calculation.unit,'heading')
    add(calculation.explanation)
    if(calculation.topic_ids?.length)add(ui.topics+': '+calculation.topic_ids.map(id=>topicTitles.get(id)||id).join(' · '),'meta')
    for(const input of calculation.inputs){
      add(input.label+': '+number(input.value,language)+(input.kind==='assumption'?' · '+ui.assumption+': '+input.explanation:''),'body')
      if(input.kind==='document')add(ui.document+': '+(documentTitles.get(input.document_id)||input.document_id||ui.unavailable),'meta',{documentId:input.document_id})
      if(input.kind==='source'){
        if(input.url)usedSources.add(sourceKey(input.url))
        add(ui.sources+': '+(input.url||ui.unavailable),'meta',input.url?{url:input.url}:{})
      }
      if(input.kind==='calculation')add(ui.derived+': '+(calculationTitles.get(input.calculation_id)||input.calculation_id||ui.unavailable),'meta')
      if(input.quote)addQuote(input.quote,input.kind==='document'?{documentId:input.document_id}:input.kind==='source'?{url:input.url}:{})
    }
    add(ui.formula+': '+calculation.expression+' = '+calculation.result+' '+calculation.unit,'meta')
    if(calculation.conditions)add(ui.conditions+': '+calculation.conditions)
  }
  if(analysis.limitations.length){add(ui.limitations,'heading');for(const item of analysis.limitations)add(item,'bullet')}
  // The research pool may include unused fallback material. List only sources
  // actually cited by an answer or calculation; the saved research stays intact.
  const sources=(analysis.research_sources||[]).filter(source=>usedSources.has(sourceKey(source.url)))
  if(sources.length){add(ui.sources,'heading');for(const source of sources)add(source.title+' · '+source.checked_at.slice(0,10)+'\n'+source.url,'meta',{url:source.url})}
  return blocks
}
