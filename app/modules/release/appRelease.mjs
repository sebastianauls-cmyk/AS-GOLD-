export const APP_RELEASE=Object.freeze({
  number:107,
  version:'V107',
  updated:'5. September 2026'
})

export const APP_VERSION=APP_RELEASE.version

export function withAppVersion(text){
  return text.includes(APP_VERSION)?text:`${text} · ${APP_VERSION}`
}
