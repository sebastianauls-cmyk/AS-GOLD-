import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const must=(condition,message)=>{if(!condition)throw new Error(message)}

// V50 is now a compatibility checkpoint, not a source transformer. The V51–V56
// behavior is owned directly by the modular public/language components.
const landing=read('app/modules/public/PublicLanding.js')
const navigator=read('app/modules/public/ProblemNavigator.js')
const explainer=read('app/modules/public/ExplainerVideo.js')
const switcher=read('app/modules/language/LanguageSwitcher.js')

must(landing.includes('ProblemNavigator'),'V50 compatibility: public problem navigator missing')
must(landing.includes('ExplainerVideo'),'V50 compatibility: explainer module missing')
must(switcher.includes('flagLanguageMenuBack'),'V50 compatibility: language-menu back control missing')
must((switcher.match(/← Zurück/g)||[]).length===1,'V50 compatibility: exactly one German menu-back label required')

for(const token of ['navigator.permissions','aria-live="polite"','voiceStarting']){
  must(navigator.includes(token),'V50 compatibility: microphone marker missing: '+token)
}
must(navigator.includes('.onaudiostart'),'V50 compatibility: microphone audio-start handler missing')
must(!navigator.includes('getUserMedia'),'V50 compatibility: direct getUserMedia preflight must remain removed')

must(explainer.includes('as-gold-explainer-de-female.mp4'),'V50 compatibility: German female explainer missing')
must(explainer.includes('as-gold-explainer-de-male.mp4'),'V50 compatibility: German male explainer missing')

console.log('V50 compatibility checkpoint passed inside the current modular V51–V56 architecture.')
