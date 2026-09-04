export const APP_RELEASE=Object.freeze({
  number:99,
  version:'V99',
  updated:'4. September 2026'
})

export const APP_VERSION=APP_RELEASE.version

export function withAppVersion(text){
  return text.includes(APP_VERSION)?text:`${text} · ${APP_VERSION}`
}
