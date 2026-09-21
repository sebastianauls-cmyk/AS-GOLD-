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
export function completeAnalysisCopy(language='de'){return Object.fromEntries(keys.map((key,index)=>[key,(labels[language]||labels.de)[index]]))}
const number=(value,language)=>{
  const text=String(value),[whole,fraction]=text.split('.'),format=new Intl.NumberFormat(language)
  const integer=BigInt(whole),formatted=integer===0n&&text.startsWith('-')?format.format(-0):format.format(integer)
  if(!fraction)return formatted
  const decimal=format.formatToParts(1.1).find(part=>part.type==='decimal').value
  return formatted+decimal+[...fraction].map(digit=>format.format(Number(digit))).join('')
}
// Shared semantic blocks keep the visible full analysis and Word/PDF identical.
export function completeAnalysisBlocks(analysis,language='de'){
  if(!analysis)return []
  const ui=completeAnalysisCopy(language),blocks=[]
  const add=(text,kind='body',url)=>{if(text)blocks.push({text,kind,...(url?{url}:{})})}
  add(ui.analysis,'heading')
  for(const topic of analysis.topics){
    add(topic.title+' · '+ui[topic.status],'heading');add(topic.conclusion)
    if(topic.conditions)add(ui.conditions+': '+topic.conditions)
    for(const source of topic.sources)add('„'+source.quote+'“\n'+source.url,'meta',source.url)
  }
  if(analysis.calculations.length)add(ui.calculations,'heading')
  for(const calculation of analysis.calculations){
    add(calculation.title+': '+number(calculation.result,language)+' '+calculation.unit,'heading')
    add(calculation.explanation)
    for(const input of calculation.inputs){
      add(input.label+': '+number(input.value,language)+(input.kind==='assumption'?' · '+ui.assumption+': '+input.explanation:''),'body')
      if(input.quote)add('„'+input.quote+'“','meta')
    }
    add(ui.formula+': '+calculation.expression+' = '+calculation.result+' '+calculation.unit,'meta')
    if(calculation.conditions)add(ui.conditions+': '+calculation.conditions)
  }
  if(analysis.limitations.length){add(ui.limitations,'heading');for(const item of analysis.limitations)add(item,'bullet')}
  if(analysis.research_sources?.length){add(ui.sources,'heading');for(const source of analysis.research_sources)add(source.title+' · '+source.checked_at.slice(0,10)+'\n'+source.url,'meta',source.url)}
  return blocks
}
