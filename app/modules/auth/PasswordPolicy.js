import { validateV29Password } from '../../lib/v29PasswordPolicy.mjs'
import { componentTranslations } from '../../lib/v30ComponentTranslations.mjs'

export { validateV29Password }

const copy = {
  de:{title:'Sicheres Testpasswort',intro:'Mindestens 12 Zeichen und nur für AS Workspace Gold verwenden.',length:'Mindestens 12 Zeichen',letter:'Mindestens ein Buchstabe',number:'Mindestens eine Zahl',symbol:'Mindestens ein Sonderzeichen',variety:'Mindestens 8 unterschiedliche Zeichen',personal:'Kein Name, E-Mail-Bestandteil oder häufiges Passwort',match:'Beide Eingaben stimmen überein',invalid:'Das Passwort erfüllt die Sicherheitsanforderungen noch nicht.'},
  en:{title:'Secure test password',intro:'Use at least 12 characters and use it only for AS Workspace Gold.',length:'At least 12 characters',letter:'At least one letter',number:'At least one number',symbol:'At least one special character',variety:'At least 8 different characters',personal:'No name, email fragment or common password',match:'Both entries match',invalid:'The password does not yet meet the security requirements.'},
  tr:{title:'Güvenli test parolası',intro:'En az 12 karakter kullanın ve bu parolayı yalnızca AS Workspace Gold için seçin.',length:'En az 12 karakter',letter:'En az bir harf',number:'En az bir rakam',symbol:'En az bir özel karakter',variety:'En az 8 farklı karakter',personal:'Ad, e-posta parçası veya yaygın parola yok',match:'İki giriş eşleşiyor',invalid:'Parola henüz güvenlik gereksinimlerini karşılamıyor.'},
  pl:{title:'Bezpieczne hasło testowe',intro:'Użyj co najmniej 12 znaków i stosuj to hasło tylko w AS Workspace Gold.',length:'Co najmniej 12 znaków',letter:'Co najmniej jedna litera',number:'Co najmniej jedna cyfra',symbol:'Co najmniej jeden znak specjalny',variety:'Co najmniej 8 różnych znaków',personal:'Bez imienia, części adresu e-mail i popularnego hasła',match:'Oba wpisy są zgodne',invalid:'Hasło nie spełnia jeszcze wymagań bezpieczeństwa.'},
  ru:{title:'Безопасный тестовый пароль',intro:'Используйте не менее 12 символов и только для AS Workspace Gold.',length:'Не менее 12 символов',letter:'Не менее одной буквы',number:'Не менее одной цифры',symbol:'Не менее одного специального символа',variety:'Не менее 8 разных символов',personal:'Без имени, части e-mail или распространённого пароля',match:'Оба ввода совпадают',invalid:'Пароль пока не соответствует требованиям безопасности.'},
  ar:{title:'كلمة مرور آمنة للاختبار',intro:'استخدم 12 محرفًا على الأقل واجعلها خاصة بـ AS Workspace Gold فقط.',length:'12 محرفًا على الأقل',letter:'حرف واحد على الأقل',number:'رقم واحد على الأقل',symbol:'رمز خاص واحد على الأقل',variety:'8 محارف مختلفة على الأقل',personal:'من دون الاسم أو جزء البريد أو كلمة شائعة',match:'الإدخالان متطابقان',invalid:'كلمة المرور لا تستوفي متطلبات الأمان بعد.'},
}

Object.assign(copy, componentTranslations.passwordCopy)

export function getV29PasswordCopy(language='de'){
  return copy[language]||copy.de
}

export function PasswordPolicyChecklist({language='de',password='',passwordRepeat='',email='',displayName=''}){
  const on=getV29PasswordCopy(language)
  const {rules}=validateV29Password(password,{email,displayName})
  const items=[['length',on.length],['letter',on.letter],['number',on.number],['symbol',on.symbol],['variety',on.variety],['personal',on.personal]]
  const matches=password.length>0&&password===passwordRepeat
  return <div className="passwordPolicy" id="v29-password-policy" aria-live="polite">
    <b>{on.title}</b><small>{on.intro}</small>
    <ul>{items.map(([key,label])=><li className={rules[key]?'isMet':'isMissing'} key={key}><span aria-hidden="true">{rules[key]?'✓':'○'}</span>{label}</li>)}<li className={matches?'isMet':'isMissing'}><span aria-hidden="true">{matches?'✓':'○'}</span>{on.match}</li></ul>
  </div>
}
