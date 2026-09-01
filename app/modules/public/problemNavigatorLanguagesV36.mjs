import {problemLanguageProfiles as baseProfiles,multilingualKeywords as baseKeywords} from './problemNavigatorLanguages.mjs'

const extraProfiles={
  ro:{locale:'ro-RO',ui:{title:'Care este problema dvs.?',lead:'Descrieți pe scurt ce s-a întâmplat – sau spuneți cu voce tare. AS Gold vă sugerează fără obligații tipul de caz și nivelul potrivit.',placeholder:'Exemplu: Am primit o factură greșită și nu știu cum să răspund.',voice:'Dictează problema',stop:'Oprește înregistrarea',analyse:'Găsește soluția potrivită',empty:'Descrieți pe scurt problema.',unsupported:'Introducerea vocală directă nu este disponibilă aici. Atingeți câmpul de text și folosiți microfonul tastaturii.',denied:'Accesul la microfon nu a fost permis.',listening:'Ascult …',recommendation:'Recomandare fără caracter obligatoriu',caseLabel:'Tip de caz potrivit',planLabel:'Nivel recomandat',why:'De ce?',showCase:'Vezi tipul de caz',showPlans:'Compară nivelurile',change:'Puteți modifica recomandarea oricând.',back:'← Înapoi la selecție'},cases:{insurance:'Asigurare și daună',property:'Chirie, leasing și imobiliare',contract:'Contract și creanță',authority:'Autorități și asigurări sociale',work:'Muncă și salarizare',business:'Companie și clienți',dispute:'Litigiu și dovezi',private:'Situație personală complexă'},reasons:{start:'Mai întâi aveți nevoie în principal de organizare și o imagine de ansamblu clară.',klar:'Trebuie evidențiate punctele deschise, termenele sau contradicțiile.',analyse:'Descrierea indică necesitatea unei evaluări aprofundate a riscurilor și pașilor următori.',komplett:'Situația pare amplă și ar trebui procesată ca un întreg.',business:'Descrierea indică mai mulți clienți sau procese recurente.'}},
  bg:{locale:'bg-BG',ui:{title:'Какъв е вашият проблем?',lead:'Опишете накратко какво се е случило – или го кажете с глас. AS Gold ще предложи необвързващо подходящ вид случай и ниво.',placeholder:'Пример: Получих грешна фактура и не знам как да отговоря.',voice:'Диктувай проблема',stop:'Спри записа',analyse:'Намери подходящо решение',empty:'Моля, опишете накратко проблема.',unsupported:'Директното гласово въвеждане не е налично тук. Натиснете текстовото поле и използвайте микрофона на клавиатурата.',denied:'Достъпът до микрофона не е разрешен.',listening:'Слушам …',recommendation:'Необвързваща препоръка',caseLabel:'Подходящ вид случай',planLabel:'Препоръчано ниво',why:'Защо?',showCase:'Виж вида случай',showPlans:'Сравни нивата',change:'Можете да промените препоръката по всяко време.',back:'← Назад към избора'},cases:{insurance:'Застраховка и щета',property:'Наем, аренда и имоти',contract:'Договор и вземане',authority:'Администрация и социално осигуряване',work:'Работа и заплащане',business:'Бизнес и клиенти',dispute:'Спор и доказателства',private:'Сложна лична ситуация'},reasons:{start:'Първо са нужни подредба и ясен общ преглед.',klar:'Трябва да се покажат откритите точки, сроковете или противоречията.',analyse:'Описанието показва необходимост от по-задълбочена оценка на рисковете и следващите стъпки.',komplett:'Случаят изглежда обширен и трябва да се обработи цялостно.',business:'Описанието сочи към няколко клиента или повтарящи се процеси.'}}
}

export const problemLanguageProfiles={...baseProfiles,...extraProfiles}
export const multilingualKeywords={
  ...baseKeywords,
  insurance:[...baseKeywords.insurance,'asigurare','daună','pagubă','застраховка','щета'],
  property:[...baseKeywords.property,'chirie','proprietar','apartament','imobil','наем','наемодател','жилище','имот'],
  contract:[...baseKeywords.contract,'contract','factură','creanță','договор','фактура','вземане'],
  authority:[...baseKeywords.authority,'autoritate','administrație','decizie','администрация','ведомство','решение'],
  work:[...baseKeywords.work,'angajator','salariu','muncă','работодател','заплата','работа'],
  business:[...baseKeywords.business,'client','companie','firmă','клиент','компания','фирма'],
  dispute:[...baseKeywords.dispute,'litigiu','avocat','instanță','dovadă','спор','адвокат','съд','доказателство'],
  private:[...baseKeywords.private,'călătorie','mașină','familie','пътуване','автомобил','семейство']
}
export function normalizeProblemLanguage(value){return String(value||'de').toLowerCase().split('-')[0]}
export function getProblemLanguageProfile(language){return problemLanguageProfiles[normalizeProblemLanguage(language)]||problemLanguageProfiles.en}
export function getSpeechLocale(language){
  const code=normalizeProblemLanguage(language)
  const configured=problemLanguageProfiles[code]?.locale
  if(configured)return configured
  if(typeof navigator!=='undefined'){
    const device=(navigator.languages||[navigator.language]).find(item=>String(item||'').toLowerCase().startsWith(code))
    if(device)return device
  }
  return code
}
