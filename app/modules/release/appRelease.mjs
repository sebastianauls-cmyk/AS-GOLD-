export const APP_RELEASE=Object.freeze({
  number:157,
  version:'V157',
  updated:'21. September 2026'
})

export const APP_VERSION=APP_RELEASE.version

export function withAppVersion(text){
  return text.includes(APP_VERSION)?text:`${text} · ${APP_VERSION}`
}
