export const APP_RELEASE=Object.freeze({
  number:158,
  version:'V158',
  updated:'30. Oktober 2026'
})

export const APP_VERSION=APP_RELEASE.version

export function withAppVersion(text){
  return text.includes(APP_VERSION)?text:`${text} · ${APP_VERSION}`
}
