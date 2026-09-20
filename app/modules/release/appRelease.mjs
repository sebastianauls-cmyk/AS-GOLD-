export const APP_RELEASE=Object.freeze({
  number:151,
  version:'V151',
  updated:'20. September 2026'
})

export const APP_VERSION=APP_RELEASE.version

export function withAppVersion(text){
  return text.includes(APP_VERSION)?text:`${text} · ${APP_VERSION}`
}
