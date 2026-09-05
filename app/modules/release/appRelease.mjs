export const APP_RELEASE=Object.freeze({
  number:112,
  version:'V112',
  updated:'5. September 2026'
})

export const APP_VERSION=APP_RELEASE.version

export function withAppVersion(text){
  return text.includes(APP_VERSION)?text:`${text} · ${APP_VERSION}`
}
