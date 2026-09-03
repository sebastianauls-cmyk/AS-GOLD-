import { multilingualKeywords } from './problemNavigatorLanguagesV36.mjs'
import { caseFrequencyWeight } from './casePriorityV56.mjs'

function normalize(value){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/đ/g,'d').replace(/ı/g,'i').replace(/ß/g,'ss')
}

function hits(text,words){
  return words.reduce((total,word)=>total+(text.includes(normalize(word))?1:0),0)
}

function includesAny(text,terms){return terms.some(term=>text.includes(normalize(term)))}

function withoutNegatedSignals(text){
  return text
    .replace(/\b(?:kein|keine|keinen|keiner|keinem|ohne)\s+(?:streit|frist|deadline|widerspruch|widerspruche|risiko|schaden)\b/g,' ')
    .replace(/\b(?:no|without)\s+(?:dispute|deadline|contradiction|risk|damage)\b/g,' ')
}

function weightedHits(text,entries){
  return entries.reduce((total,[term,weight])=>total+(text.includes(normalize(term))?weight:0),0)
}

const businessSignals=[
  'mehrere kunden','viele kunden','firmenkunden','kundenfalle','kundenakten','alle kundenfalle','mehrere mandanten','mandantenakten','mehrere falle','viele falle','fallbestand','mehrere vorgange','wiederkehrende vorgange','parallel','team','teams','mitarbeitende','beschaftigte','sachbearbeiter','mehrere nutzer','sechs nutzer','rollen','rechte','admin','administration','freigaben','freigabeketten','audit','prufprotokoll','statuskontrolle','gesamtexport','zentrale auswertungen','regelmaßige berichte','wiederkehrender workflow','wiederkehrende prozesse','portfolio',
  'multiple clients','many clients','multiple customers','customer cases','client files','multiple cases','case portfolio','parallel cases','team','employees','users','roles','rights','administration','admin access','approvals','audit log','status control','full export','central reports','recurring workflow','recurring processes',
  'plusieurs clients','plusieurs dossiers','equipe','administration','journal d’audit','processus recurrents','birden fazla musteri','birden fazla dosya','ekip','yonetim','denetim kaydi','tekrarlayan surec','wielu klientow','wiele spraw','zespol','administracja','dziennik audytu','powtarzalne procesy',
  'несколько клиентов','несколько дел','команда','администрирование','журнал аудита','повторяющиеся процессы','عدة عملاء','عدة قضايا','فريق','إدارة','سجل تدقيق','عمليات متكررة','چند مشتری','چند پرونده','تیم','مدیریت','گزارش ممیزی','فرایندهای تکراری',
  'mai multi clienti','mai multe cazuri','echipa','administrare','jurnal de audit','procese recurente','няколко клиента','няколко случая','екип','администриране','одитен дневник','повтарящи се процеси','nhieu khach hang','nhieu ho so','doi nhom','quan tri','nhat ky kiem toan','quy trinh lap lai'
]

const businessScopeSignals=[
  'mehrere kunden','viele kunden','firmenkunden','kundenfalle','kundenakten','alle kundenfalle','mehrere mandanten','mandantenakten','mehrere falle','viele falle','fallbestand','mehrere vorgange','wiederkehrende vorgange','sechzig mietverhaltnisse','parallel',
  'multiple clients','many clients','multiple customers','customer cases','client files','multiple cases','case portfolio','parallel cases','recurring cases',
  'plusieurs clients','plusieurs dossiers','birden fazla musteri','birden fazla dosya','wielu klientow','wiele spraw','несколько клиентов','несколько дел','عدة عملاء','عدة قضايا','چند مشتری','چند پرونده','mai multi clienti','mai multe cazuri','няколко клиента','няколко случая','nhieu khach hang','nhieu ho so'
]

const businessOperationSignals=[
  'team','teams','mitarbeitende','beschaftigte','sachbearbeiter','nutzer','rollen','rechte','admin','administration','freigabe','audit','prufprotokoll','statuskontrolle','gesamtexport','zentrale auswertungen','berichte','wiederkehrend','standards','gemeinsame bearbeitung',
  'employees','users','roles','rights','administration','admin','approval','audit','status control','export','reports','recurring','standards',
  'equipe','administration','audit','ekip','yonetim','denetim','zespol','administracja','команда','администрирование','فريق','إدارة','تیم','مدیریت','echipa','administrare','екип','администриране','doi nhom','quan tri'
]

const completeSignals=[
  'strom ist gesperrt','strom wurde gesperrt','versorgung ist gesperrt','versorgung wurde gesperrt','seit 56 stunden','abgestellt','betriebsunterbrechung','betriebsausfall','verdorben','warenverlust','existenzbedrohend','schadensberechnung','versicherung lehnt ab','anwaltsubergabe','mehrparteienstrategie',
  'power is disconnected','power was disconnected','supply was cut off','business interruption','operational shutdown','spoiled goods','loss of goods','existential threat','damage calculation','insurance denied','lawyer handoff','multi-party strategy',
  'coupure effective','interruption d’activite','marchandises perdues','menace existentielle','calcul du dommage','assurance refuse','elektrik kesildi','isletme kesintisi','mal kaybi','varolussal tehdit','sigorta reddetti','odcieto prad','przerwa w dzialalnosci','utrata towaru','zagrozenie egzystencji','ubezpieczyciel odmowil',
  'электричество отключено','остановка деятельности','потеря товара','угроза существованию','страховая отказала','تم قطع الكهرباء','توقف العمل','خسارة البضائع','تهديد وجودي','رفض التأمين','برق قطع شده','توقف کسب و کار','از بین رفتن کالا','تهدید موجودیت','بیمه رد کرد',
  'curentul a fost oprit','intreruperea activitatii','pierdere de marfa','amenintare existentiala','asigurarea a refuzat','токът е спрян','прекъсване на дейността','загуба на стока','екзистенциална заплаха','застрахователят отказа','dien da bi cat','gian doan kinh doanh','hang hoa hu hong','de doa ton tai','bao hiem tu choi'
]

const fullHandlingSignals=[
  'vollstandige fallakte','vollstandiger fall','vollstandige bearbeitung','komplette bearbeitung','vollstandig geordnet','vollstandig bewertet','vollstandige chronologie','mehrere schreiben','mehreren schreiben','vorbereitete schreiben','antwortentwurfe','alle antwortentwurfe','ubergabeakte','chronologie, analyse, maßnahmen','chronologie, prufung','an alle beteiligten','an alle stellen','gesamte akte','rundumbearbeitung',
  'complete case file','complete handling','fully organized','full chronology','multiple letters','prepared letters','all reply drafts','handover file','to all parties','end-to-end handling',
  'dossier complet','traitement complet','plusieurs courriers','lettres preparees','dosya tamami','tam isleme','birden fazla yazi','pelna dokumentacja','pelna obsluga','wiele pism','полное дело','полная обработка','несколько писем','ملف كامل','معالجة كاملة','رسائل متعددة','پرونده کامل','رسیدگی کامل','نامه‌های متعدد','dosar complet','procesare completa','mai multe scrisori','пълно досие','цялостна обработка','няколко писма','ho so day du','xu ly toan dien','nhieu thu'
]

const analysisSignals=[
  'bonitatsmeldung','bonitat','schufa','kreditlinie','kreditrahmen','sperrandrohung','abschaltandrohung','datensperre','datenkorrektur','widerspruchliche unterlagen','widerspruche in den unterlagen','widersprechen sich','passen zeitlich nicht zusammen','beweismatrix','beweiskette','beweislage','beweiswert','risikobewertung','deckungsrisiko','handlungsrisiko','handlungsoptionen','vertiefte prufung','vertiefte zuordnung','ursache und hohe unterschiedlich','mehrere beteiligte','mehrere parteien',
  'credit report','credit rating','credit line','disconnection warning','shutoff warning','data correction','contradictory documents','contradict each other','evidence matrix','chain of evidence','evidentiary position','risk assessment','options for action','multiple parties','in-depth review',
  'signalement de solvabilite','ligne de credit','menace de coupure','documents contradictoires','matrice de preuves','evaluation des risques','kredi notu','kredi limiti','kesme uyarisi','celiskili belgeler','kanit matrisi','risk degerlendirmesi','informacja kredytowa','linia kredytowa','ostrzezenie o odcieciu','sprzeczne dokumenty','matryca dowodow','ocena ryzyka',
  'кредитный рейтинг','кредитная линия','угроза отключения','противоречивые документы','матрица доказательств','оценка рисков','التصنيف الائتماني','حد الائتمان','تهديد بالقطع','مستندات متناقضة','مصفوفة الأدلة','تقييم المخاطر','اعتبارسنجی','خط اعتباری','اخطار قطع','اسناد متناقض','ماتریس شواهد','ارزیابی ریسک',
  'raport de credit','linie de credit','amenintare cu deconectarea','documente contradictorii','matrice de probe','evaluarea riscului','кредитен рейтинг','кредитна линия','предупреждение за спиране','противоречиви документи','матрица на доказателствата','оценка на риска','xep hang tin dung','han muc tin dung','canh bao cat dien','tai lieu mau thuan','ma tran bang chung','danh gia rui ro','rủi ro'
]

const claritySignals=[
  'mahnung','inkasso','zahlungsaufforderung','frist','fristablauf','antwortfrist','einwendungsfrist','bis freitag','widerspruch','offene punkte','unterlagen fehlen','belege fehlen','fehlt','nicht beigefugt','unklar','unklare','anderer zeitraum','was fehlt','fehlenden unterlagen','lucke','prioritat','nachster schritt',
  'dunning notice','debt collection','payment demand','deadline','objection','open points','documents missing','missing','not attached','unclear','what is missing','next step',
  'mise en demeure','recouvrement','delai','opposition','points ouverts','documents manquants','ihtar','tahsilat','sure','itiraz','acik noktalar','eksik belgeler','wezwanie do zaplaty','windykacja','termin','sprzeciw','otwarte kwestie','brak dokumentow',
  'требование об оплате','взыскание долга','срок','возражение','открытые вопросы','не хватает документов','إنذار بالدفع','تحصيل الديون','موعد نهائي','اعتراض','نقاط مفتوحة','مستندات مفقودة','اخطار پرداخت','وصول مطالبات','مهلت','اعتراض','موارد باز','مدارک ناقص',
  'somatie de plata','colectare datorii','termen','contestatie','puncte deschise','documente lipsa','покана за плащане','събиране на дълг','срок','възражение','отворени въпроси','липсващи документи','thu nhac no','thu hoi no','thoi han','thời hạn','phan doi','van de con mo','thieu tai lieu'
]

const domainSignals={
  work:[['lohnabrechnung',12],['lohn',6],['arbeitgeberbescheinigung',9],['arbeitgeber',5],['arbeitszeit',6],['stundenzettel',7],['krankengeld',7],['krankmeldung',5],['kundigung',5],['zuschlage',4],['payroll',8],['employer',5],['working hours',6],['sick pay',7]],
  authority:[['behorde',9],['bescheid',9],['sozialversicherung',8],['krankenkasse',5],['kasse',2],['anmeldung',5],['formular',5],['agency',7],['authority',8],['social insurance',8],['official notice',8]],
  property:[['betriebskostenabrechnung',12],['mietvertrag',11],['mietverhaltnis',9],['vermieter',7],['miete',6],['beendete pacht',15],['pacht',20],['ubergabeprotokoll',9],['gebaude',4],['immobiliengesellschaft',5],['tenancy',8],['landlord',7],['lease',8]],
  insurance:[['versicherung',9],['versicherer',10],['versicherungsschutz',10],['deckungsrisiko',10],['deckung',7],['wasserschaden',7],['schaden',5],['gutachter',5],['insurer',10],['insurance',12],['coverage',8],['damage',5],['assurance',12],['sigorta',12],['ubezpieczenie',12],['страхов',12],['تأمين',12],['بیمه',12],['asigurare',12],['застрахов',12],['bao hiem',12]],
  contract:[['stromrechnung',10],['rechnung',6],['mahnung',6],['inkasso',8],['forderung',7],['liefernachweis',7],['dienstleister',7],['versorger',7],['bank',3],['vertrag',5],['invoice',6],['debt collection',8],['supplier',6],['contract',5],['utility bill',10],['recouvrement',10],['fournisseur d’energie',10],['tahsilat',10],['enerji tedarikcisi',10],['rachunek za energie',10],['windykacja',10],['dostawca energii',10],['взыскание долга',10],['поставщик энергии',10],['تحصيل الديون',10],['مزود الطاقة',10],['قبض برق',10],['وصول مطالبات',10],['تامین کننده انرژی',10],['factura de energie',10],['colectare datorii',10],['furnizor de energie',10],['сметка за ток',10],['събиране на дълг',10],['доставчик на енергия',10],['hoa don tien dien',10],['thu hoi no',10],['nha cung cap nang luong',10]],
  private:[['reise',12],['veranstalter',8],['airline',9],['gepack',9],['hotel',4],['kreditkartenanbieter',7],['fahrzeug',8],['travel',12],['tour operator',8],['luggage',9],['vehicle',8]],
  dispute:[['streit',4],['beweiskette',5],['beweislage',5],['zeuge',4],['konflikt',4],['dispute',4],['evidence chain',5]],
  business:[['unternehmen',4],['betrieb',3],['firma',3],['company',4],['business',4]]
}

export function recommendProblem(value,profile){
  const text=withoutNegatedSignals(normalize(value))
  const matches=Object.fromEntries(Object.entries(multilingualKeywords).map(([key,words])=>[key,hits(text,words)]))
  const weightedScores=Object.fromEntries(Object.keys(matches).map(key=>[
    key,
    (matches[key]*3)+weightedHits(text,domainSignals[key]||[])+((caseFrequencyWeight[key]||0)/1000)
  ]))
  let caseKey=Object.entries(weightedScores).sort((left,right)=>right[1]-left[1])[0]?.[0]||'private'
  if(Math.max(...Object.values(matches))===0&&Math.max(...Object.values(weightedScores))<1)caseKey=text.length>180?'dispute':'private'

  const businessScope=includesAny(text,businessScopeSignals)
  const businessOperations=hits(text,businessOperationSignals)
  const businessCount=hits(text,businessSignals)
  const isBusiness=(businessScope&&businessOperations>=1)||businessOperations>=3||businessCount>=5
  const completeCount=hits(text,completeSignals)
  const fullHandlingCount=hits(text,fullHandlingSignals)
  const analysisCount=hits(text,analysisSignals)
  const clarityCount=hits(text,claritySignals)

  let planKey='start'
  if(isBusiness)planKey='business'
  else if(completeCount>0||fullHandlingCount>=2)planKey='komplett'
  else if(analysisCount>0)planKey='analyse'
  else if(clarityCount>0)planKey='klar'

  if(isBusiness)caseKey='business'

  return {caseKey,planKey,reason:profile.reasons[planKey]||profile.reasons.start}
}
