export const APP_RELEASE=Object.freeze({
  number:78,
  version:'V78',
  updated:'3. September 2026'
})

export const APP_VERSION=APP_RELEASE.version

export function withAppVersion(text){
  return text.includes(APP_VERSION)?text:`${text} · ${APP_VERSION}`
}
