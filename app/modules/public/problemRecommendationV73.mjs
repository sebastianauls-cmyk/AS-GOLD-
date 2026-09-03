import { multilingualKeywords } from './problemNavigatorLanguagesV36.mjs'
import { caseFrequencyWeight } from './casePriorityV56.mjs'

function normalize(value){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
}

function hits(text,words){
  return words.reduce((total,word)=>total+(text.includes(normalize(word))?1:0),0)
}

function includesAny(text,terms){return terms.some(term=>text.includes(normalize(term)))}

const businessSignals=[
  'mehrere kunden','mehrere mandanten','mehrere fälle','fallbestand','team','rollen und rechte','benutzerrollen','administration','admin-zugang','audit','prüfprotokoll','gesamtexport','wiederkehrender workflow','wiederkehrende prozesse','portfolio',
  'multiple clients','multiple customers','multiple cases','case portfolio','team roles','user roles','administration','admin access','audit log','full export','recurring workflow','recurring processes',
  'plusieurs clients','plusieurs dossiers','équipe','administration','journal d’audit','processus récurrents',
  'birden fazla müşteri','birden fazla dosya','ekip','yönetim','denetim kaydı','tekrarlayan süreç',
  'wielu klientów','wiele spraw','zespół','administracja','dziennik audytu','powtarzalne procesy',
  'несколько клиентов','несколько дел','команда','администрирование','журнал аудита','повторяющиеся процессы',
  'عدة عملاء','عدة قضايا','فريق','إدارة','سجل تدقيق','عمليات متكررة',
  'چند مشتری','چند پرونده','تیم','مدیریت','گزارش ممیزی','فرایندهای تکراری',
  'mai mulți clienți','mai multe cazuri','echipă','administrare','jurnal de audit','procese recurente',
  'няколко клиента','няколко случая','екип','администриране','одитен дневник','повтарящи се процеси',
  'nhiều khách hàng','nhiều hồ sơ','đội nhóm','quản trị','nhật ký kiểm toán','quy trình lặp lại'
]

const explicitBusinessSignals=[
  'mehrere kunden','mehrere mandanten','mehrere fälle','fallbestand','rollen und rechte','benutzerrollen','admin-zugang','prüfprotokoll','gesamtexport','wiederkehrender workflow','wiederkehrende prozesse','portfolio',
  'multiple clients','multiple customers','multiple cases','case portfolio','team roles','user roles','admin access','audit log','full export','recurring workflow','recurring processes',
  'plusieurs clients','plusieurs dossiers','journal d’audit','processus récurrents','birden fazla müşteri','birden fazla dosya','denetim kaydı','tekrarlayan süreç','wielu klientów','wiele spraw','dziennik audytu','powtarzalne procesy',
  'несколько клиентов','несколько дел','журнал аудита','повторяющиеся процессы','عدة عملاء','عدة قضايا','سجل تدقيق','عمليات متكررة','چند مشتری','چند پرونده','گزارش ممیزی','فرایندهای تکراری',
  'mai mulți clienți','mai multe cazuri','jurnal de audit','procese recurente','няколко клиента','няколко случая','одитен дневник','повтарящи се процеси','nhiều khách hàng','nhiều hồ sơ','nhật ký kiểm toán','quy trình lặp lại'
]

const completeSignals=[
  'strom ist gesperrt','strom wurde gesperrt','versorgung ist gesperrt','versorgung wurde gesperrt','seit 56 stunden','abgestellt','betriebsunterbrechung','betriebsausfall','verdorben','warenverlust','existenzbedrohend','schadensberechnung','versicherung lehnt ab','vollständige akte','anwaltsübergabe','mehrparteienstrategie',
  'power is disconnected','power was disconnected','supply was cut off','business interruption','operational shutdown','spoiled goods','loss of goods','existential threat','damage calculation','insurance denied','complete case file','lawyer handoff','multi-party strategy',
  'coupure effective','interruption d’activité','marchandises perdues','menace existentielle','calcul du dommage','assurance refuse',
  'elektrik kesildi','işletme kesintisi','mal kaybı','varoluşsal tehdit','sigorta reddetti',
  'odcięto prąd','przerwa w działalności','utrata towaru','zagrożenie egzystencji','ubezpieczyciel odmówił',
  'электричество отключено','остановка деятельности','потеря товара','угроза существованию','страховая отказала',
  'تم قطع الكهرباء','توقف العمل','خسارة البضائع','تهديد وجودي','رفض التأمين',
  'برق قطع شده','توقف کسب و کار','از بین رفتن کالا','تهدید موجودیت','بیمه رد کرد',
  'curentul a fost oprit','întreruperea activității','pierdere de marfă','amenințare existențială','asigurarea a refuzat',
  'токът е спрян','прекъсване на дейността','загуба на стока','екзистенциална заплаха','застрахователят отказа',
  'điện đã bị cắt','gián đoạn kinh doanh','hàng hóa hư hỏng','đe dọa tồn tại','bảo hiểm từ chối'
]

const analysisSignals=[
  'bonitätsmeldung','bonitat','schufa','kreditlinie','kreditrahmen','sperrandrohung','abschaltandrohung','datensperre','datenkorrektur','widersprüchliche unterlagen','widerspruche in den unterlagen','beweismatrix','risikobewertung','mehrere beteiligte','mehrere parteien',
  'credit report','credit rating','credit line','disconnection warning','shutoff warning','data correction','contradictory documents','evidence matrix','risk assessment','multiple parties',
  'signalement de solvabilité','ligne de crédit','menace de coupure','documents contradictoires','matrice de preuves','évaluation des risques',
  'kredi notu','kredi limiti','kesme uyarısı','çelişkili belgeler','kanıt matrisi','risk değerlendirmesi',
  'informacja kredytowa','linia kredytowa','ostrzeżenie o odcięciu','sprzeczne dokumenty','matryca dowodów','ocena ryzyka',
  'кредитный рейтинг','кредитная линия','угроза отключения','противоречивые документы','матрица доказательств','оценка рисков',
  'التصنيف الائتماني','حد الائتمان','تهديد بالقطع','مستندات متناقضة','مصفوفة الأدلة','تقييم المخاطر',
  'اعتبارسنجی','خط اعتباری','اخطار قطع','اسناد متناقض','ماتریس شواهد','ارزیابی ریسک',
  'raport de credit','linie de credit','amenințare cu deconectarea','documente contradictorii','matrice de probe','evaluarea riscului',
  'кредитен рейтинг','кредитна линия','предупреждение за спиране','противоречиви документи','матрица на доказателствата','оценка на риска',
  'xếp hạng tín dụng','hạn mức tín dụng','cảnh báo cắt điện','tài liệu mâu thuẫn','ma trận bằng chứng','đánh giá rủi ro'
]

const claritySignals=[
  'mahnung','inkasso','zahlungsaufforderung','frist','fristablauf','widerspruch','offene punkte','unterlagen fehlen','unklar',
  'dunning notice','debt collection','payment demand','deadline','objection','open points','documents missing','unclear',
  'mise en demeure','recouvrement','délai','opposition','points ouverts','documents manquants',
  'ihtar','tahsilat','süre','itiraz','açık noktalar','eksik belgeler',
  'wezwanie do zapłaty','windykacja','termin','sprzeciw','otwarte kwestie','brak dokumentów',
  'требование об оплате','взыскание долга','срок','возражение','открытые вопросы','не хватает документов',
  'إنذار بالدفع','تحصيل الديون','موعد نهائي','اعتراض','نقاط مفتوحة','مستندات مفقودة',
  'اخطار پرداخت','وصول مطالبات','مهلت','اعتراض','موارد باز','مدارک ناقص',
  'somație de plată','colectare datorii','termen','contestație','puncte deschise','documente lipsă',
  'покана за плащане','събиране на дълг','срок','възражение','отворени въпроси','липсващи документи',
  'thư nhắc nợ','thu hồi nợ','thời hạn','phản đối','vấn đề còn mở','thiếu tài liệu'
]

const insuranceDamageSignals=['versicherung','versicherer','versicherungsschutz','schaden','schadensersatz','insurance','insurer','coverage','damage','assurance','sinistre','sigorta','hasar','ubezpieczenie','szkoda','страхов','ущерб','تأمين','ضرر','بیمه','خسارت','asigurare','daună','застраховка','щета','bảo hiểm','thiệt hại']
const contractRootSignals=['stromrechnung','energieversorger','versorger','forderung','inkasso','rechnung','utility bill','energy supplier','supplier claim','debt collection','invoice','facture d’énergie','fournisseur d’énergie','créance','recouvrement','enerji faturası','enerji tedarikçisi','alacak','tahsilat','rachunek za energię','dostawca energii','roszczenie','windykacja','счет за электроэнергию','поставщик энергии','требование','взыскание долга','فاتورة الكهرباء','مزود الطاقة','مطالبة','تحصيل الديون','قبض برق','تامین کننده انرژی','مطالبه','وصول مطالبات','factură de energie','furnizor de energie','creanță','colectare datorii','сметка за ток','доставчик на енергия','вземане','събиране на дълг','hóa đơn tiền điện','nhà cung cấp năng lượng','yêu cầu thanh toán','thu hồi nợ']

export function recommendProblem(value,profile){
  const text=normalize(value)
  const matches=Object.fromEntries(Object.entries(multilingualKeywords).map(([key,words])=>[key,hits(text,words)]))
  const weightedScores=Object.fromEntries(Object.entries(matches).map(([key,count])=>[key,(count*1000)+(caseFrequencyWeight[key]||0)]))
  let caseKey=Object.entries(weightedScores).sort((left,right)=>right[1]-left[1])[0]?.[0]||'private'
  if(Math.max(...Object.values(matches))===0)caseKey=text.length>180?'dispute':'private'

  const businessCount=hits(text,businessSignals)
  const isBusiness=businessCount>=2||includesAny(text,explicitBusinessSignals)
  const completeCount=hits(text,completeSignals)
  const analysisCount=hits(text,analysisSignals)
  const clarityCount=hits(text,claritySignals)
  const insuranceDamageCount=hits(text,insuranceDamageSignals)
  const hasContractRoot=includesAny(text,contractRootSignals)

  let planKey='start'
  if(isBusiness)planKey='business'
  else if(completeCount>0)planKey='komplett'
  else if(analysisCount>0)planKey='analyse'
  else if(clarityCount>0)planKey='klar'

  // Organisation features define a Business workflow; an active insurance/damage
  // conflict takes precedence over a merely mentioned landlord or property.
  if(isBusiness)caseKey='business'
  else if(completeCount>0&&insuranceDamageCount>0)caseKey='insurance'
  else if(hasContractRoot)caseKey='contract'

  return {caseKey,planKey,reason:profile.reasons[planKey]||profile.reasons.start}
}
