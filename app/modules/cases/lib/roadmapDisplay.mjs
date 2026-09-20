export function roadmapStepReference(id,steps=[]) {
  const index=steps.findIndex(step=>step.id===id)
  return index<0?String(id||''):`${index+1}. ${steps[index].title}`
}

// Resolve navigation IDs in action text only. Original quotations, facts and
// letters remain verbatim and are never rewritten by this display helper.
export function readableStepText(text,steps=[],letters=[]) {
  // Only technical IDs may be rewritten. Numeric IDs could also be amounts,
  // dates or counts, and plain words could be ordinary customer prose.
  const references=[...steps.map((step,index)=>[step.id,`${index+1}. ${step.title}`]),
    ...letters.map(letter=>[letter.id,[letter.recipient,letter.subject].filter(Boolean).join(' · ')])]
  const labels=new Map(references.filter(([id,label])=>label&&/^(?:[A-Za-z][A-Za-z_-]*\d+|[A-Za-z][A-Za-z0-9]*[_-][A-Za-z0-9_-]+)$/u.test(id)))
  if(!labels.size)return text
  const escaped=[...labels.keys()].sort((a,b)=>b.length-a.length).map(id=>id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))
  const pattern=new RegExp(`(?<![\\p{L}\\p{N}_-])(?:${escaped.join('|')})(?![\\p{L}\\p{N}_-])`,'gu')
  return String(text||'').replace(pattern,id=>`„${labels.get(id)}“`)
}

const progress={
 de:['Fahrplan wird erstellt …','Originale und Aussagen werden gegengeprüft …','Beanstandete Angaben werden korrigiert und anschließend erneut geprüft …'],
 en:['Creating the roadmap …','Checking statements against the originals …','Correcting flagged statements, then reviewing again …'],
 fr:['Création du plan …','Vérification des affirmations avec les originaux …','Correction des points signalés, puis nouvelle vérification …'],
 tr:['Yol haritası oluşturuluyor …','İfadeler asıllarıyla karşılaştırılıyor …','İşaretlenen ifadeler düzeltiliyor, ardından yeniden incelenecek …'],
 pl:['Tworzenie planu …','Sprawdzanie stwierdzeń z oryginałami …','Poprawianie wskazanych treści, a następnie ponowna weryfikacja …'],
 ru:['Создание плана …','Проверка утверждений по оригиналам …','Исправление замечаний с последующей повторной проверкой …'],
 ar:['جارٍ إنشاء الخطة …','جارٍ مراجعة العبارات وفق الأصول …','جارٍ تصحيح الملاحظات ثم إعادة المراجعة …'],
 fa:['در حال ایجاد برنامه …','در حال بررسی گفته‌ها با اصل اسناد …','در حال اصلاح موارد مشخص‌شده و سپس بررسی دوباره …'],
 ro:['Se creează planul …','Se verifică afirmațiile față de originale …','Se corectează observațiile, apoi se verifică din nou …'],
 bg:['Създаване на плана …','Проверка на твърденията спрямо оригиналите …','Коригиране на забележките и след това повторна проверка …'],
 vi:['Đang tạo lộ trình …','Đang đối chiếu các nhận định với bản gốc …','Đang sửa các điểm được đánh dấu, sau đó kiểm tra lại …']
}
export function roadmapProgressLabel(language,stage='generation') {return (progress[language]||progress.de)[stage==='review'?1:stage==='correction'?2:0]}
