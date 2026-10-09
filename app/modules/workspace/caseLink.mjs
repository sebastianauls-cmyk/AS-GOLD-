const caseIdPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function readCaseLink(search=''){
  const values=new URLSearchParams(search).getAll('case')
  return values.length===1&&caseIdPattern.test(values[0])?values[0].toLowerCase():null
}

export function caseResultHref(caseId){
  if(!caseIdPattern.test(caseId||''))return null
  return '/?'+new URLSearchParams({start:'login',case:caseId.toLowerCase()})
}

// A link selects from the bundle loaded by the existing authenticated workspace.
// It never reads a record, grants access, or advances the authentication screen.
export function resolveCaseLink({caseId,screen,userId,access,privacyCurrent,cases=[]}){
  if(!caseId)return {kind:'none'}
  if(screen!=='app'||!userId||!access?.active||access.status!=='approved'||!privacyCurrent)return {kind:'waiting'}
  const item=cases.find(entry=>entry.id===caseId&&entry.owner_id===userId)
  return item?{kind:'open',item}:{kind:'unavailable'}
}

export function clearCaseLink(browser){
  const url=new URL(browser.location.href)
  url.searchParams.delete('case')
  if(url.searchParams.get('start')==='login')url.searchParams.delete('start')
  browser.history.replaceState(browser.history.state,'',url.pathname+url.search+url.hash)
}

const unavailable={
  de:'Dieser Fall ist in Ihrem angemeldeten Konto nicht verfügbar. Hier finden Sie Ihre Fälle.',
  en:'This case is not available in your signed-in account. Your cases are listed here.',
  tr:'Bu dosya oturum açtığınız hesapta mevcut değil. Dosyalarınız burada listelenir.',
  pl:'Ta sprawa nie jest dostępna na zalogowanym koncie. Tutaj znajdziesz swoje sprawy.',
  ru:'Это дело недоступно в текущей учетной записи. Здесь перечислены ваши дела.',
  ar:'هذه الحالة غير متاحة في الحساب الذي سجلت الدخول إليه. حالاتك مدرجة هنا.',
  fa:'این پرونده در حسابی که وارد آن شده‌اید در دسترس نیست. پرونده‌های شما در اینجا فهرست شده‌اند.',
  fr:'Ce dossier n’est pas disponible dans votre compte connecté. Vos dossiers sont affichés ici.',
  ro:'Acest caz nu este disponibil în contul conectat. Cazurile dvs. sunt afișate aici.',
  bg:'Този случай не е достъпен във вашия влязъл акаунт. Вашите случаи са показани тук.',
  vi:'Hồ sơ này không có trong tài khoản đang đăng nhập. Các hồ sơ của bạn được liệt kê tại đây.'
}
export const caseLinkUnavailable=language=>unavailable[language]||unavailable.en
