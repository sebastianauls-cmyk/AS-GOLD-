const commonPasswords = new Set([
  '123456789012',
  'password123!',
  'passwort123!',
  'qwertzuiop12!',
  'qwertyuiop12!',
  'willkommen123!',
  'asgold123456!',
])

function normalise(value=''){
  return value.normalize('NFKC').toLocaleLowerCase()
}

function personalFragments(email='',displayName=''){
  const emailName=(email.split('@')[0]||'').split(/[._+-]+/)
  const names=displayName.split(/[\s,.;:_-]+/)
  return [...emailName,...names].map(normalise).filter(fragment=>fragment.length>=4)
}

export function validateV29Password(password,{email='',displayName=''}={}){
  const normalized=normalise(password)
  const fragments=personalFragments(email,displayName)
  const rules={
    length:password.length>=12,
    letter:/\p{L}/u.test(password),
    number:/\p{N}/u.test(password),
    symbol:/[^\p{L}\p{N}\s]/u.test(password),
    variety:new Set([...password]).size>=8,
    personal:password.length>0&&!commonPasswords.has(normalized)&&!fragments.some(fragment=>normalized.includes(fragment)),
  }
  return {rules,valid:Object.values(rules).every(Boolean)}
}
