import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const expectedLanguages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
const localLanguages=expectedLanguages.filter(language=>language!=='vi')
const explainerSource=await readFile(new URL('../app/modules/public/ExplainerVideo.js',import.meta.url),'utf8')
const compatibilitySource=await readFile(new URL('../app/components/ExplainerVideo.js',import.meta.url),'utf8')
const configSource=await readFile(new URL('../next.config.mjs',import.meta.url),'utf8')

function objectBody(name){const match=explainerSource.match(new RegExp('const '+name+'=\\{([\\s\\S]*?)\\n\\}'));assert.ok(match,'missing '+name+' catalog');return match[1]}
const languageMatch=explainerSource.match(/const languages=\[([\s\S]*?)\n\]/);assert.ok(languageMatch,'missing explainer language selector')
const languageBlock=languageMatch[1]
const copyBlock=objectBody('copy')
const femaleLocalBlock=objectBody('femaleLocalVideos')
const femaleRemoteBlock=objectBody('femaleRemoteVideos')
const maleRemoteBlock=objectBody('maleRemoteVideos')
for(const language of expectedLanguages){assert.ok(languageBlock.includes("['"+language+"',"),'missing selector '+language);assert.ok(copyBlock.includes(language+':{'),'missing copy '+language);assert.match(femaleRemoteBlock,new RegExp('\\b'+language+":'https://resource2\\.heygen\\.ai/video_translate/[^']+/original\\.mp4'"),'missing female remote '+language);assert.match(maleRemoteBlock,new RegExp('\\b'+language+":'https://(?:resource2|files2)\\.heygen\\.ai/[^']+\\.mp4'"),'missing male remote '+language)}
for(const language of localLanguages){const expectedLocal=language==='de'?'/videos/as-gold-explainer-de-female.mp4':'/videos/as-gold-v35-'+language+'.mp4';assert.ok(femaleLocalBlock.includes(language+":'"+expectedLocal+"'"),'missing local female '+language)}
assert.doesNotMatch(femaleLocalBlock,/\bvi:/)
assert.match(femaleRemoteBlock,/c853c1c7508249c9933e9ecf2fa664c1-vi_vi-VN/)
assert.match(maleRemoteBlock,/d61639497f924841be3bdf8058881470-vi_vi-VN/)
assert.match(explainerSource,/const \[presenter,setPresenter\]=useState\('female'\)/)
assert.match(explainerSource,/savedPresenter==='male'\|\|savedPresenter==='female'/)
assert.match(explainerSource,/role='group' aria-label=\{c\.voice\}/)
assert.match(explainerSource,/aria-pressed=\{presenter==='female'\}/)
assert.match(explainerSource,/aria-pressed=\{presenter==='male'\}/)
assert.match(explainerSource,/presenter==='male'&&videoLanguage!=='de'/)
assert.doesNotMatch(explainerSource,/createPortal|MutationObserver|document\.createElement/)
assert.match(compatibilitySource,/modules\/public\/ExplainerVideo/)
assert.match(configSource,/https:\/\/resource2\.heygen\.ai https:\/\/files2\.heygen\.ai/)
console.log('V36/V72 explainer guard: eleven languages, accessible presenter controls, verified Vietnamese translations and direct module ownership verified.')