import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const expectedLanguages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg']
const explainerSource=await readFile(new URL('../app/modules/public/ExplainerVideo.js',import.meta.url),'utf8')
const compatibilitySource=await readFile(new URL('../app/components/ExplainerVideo.js',import.meta.url),'utf8')
const configSource=await readFile(new URL('../next.config.mjs',import.meta.url),'utf8')

function objectBody(name){
  const match=explainerSource.match(new RegExp(`const ${name}=\\{([\\s\\S]*?)\\n\\}`))
  assert.ok(match,`missing ${name} catalog`)
  return match[1]
}

const languageMatch=explainerSource.match(/const languages=\[([\s\S]*?)\n\]/)
assert.ok(languageMatch,'missing explainer language selector')
const languageBlock=languageMatch[1]
const copyBlock=objectBody('copy')
const femaleLocalBlock=objectBody('femaleLocalVideos')
const femaleRemoteBlock=objectBody('femaleRemoteVideos')
const maleRemoteBlock=objectBody('maleRemoteVideos')

for(const language of expectedLanguages){
  assert.match(languageBlock,new RegExp(`\\['${language}',`),`missing ${language} in explainer language selector`)
  assert.match(copyBlock,new RegExp(`\\b${language}:\\{[^\\n]*voice:'[^']+'[^\\n]*female:'[^']+'[^\\n]*male:'[^']+'[^\\n]*maleFallback:'[^']+'`),`missing presenter or fallback controls for ${language}`)
  assert.match(femaleLocalBlock,new RegExp(`\\b${language}:'/videos/as-gold-v35-${language}\\.mp4'`),`missing local female video for ${language}`)
  assert.match(femaleRemoteBlock,new RegExp(`\\b${language}:'https://resource2\\.heygen\\.ai/video_translate/[^']+/original\\.mp4'`),`missing female fallback for ${language}`)
  assert.match(maleRemoteBlock,new RegExp(`\\b${language}:'https://(?:resource2|files2)\\.heygen\\.ai/[^']+\\.mp4'`),`missing male video for ${language}`)
}

assert.equal((femaleLocalBlock.match(/\/videos\/as-gold-v35-[a-z]{2}\.mp4/g)||[]).length,expectedLanguages.length,'local female catalog must contain exactly ten videos')
assert.equal((femaleRemoteBlock.match(/https:\/\/resource2\.heygen\.ai\/video_translate\//g)||[]).length,expectedLanguages.length,'female fallback catalog must contain exactly ten videos')
assert.equal((maleRemoteBlock.match(/https:\/\/(?:resource2|files2)\.heygen\.ai\//g)||[]).length,expectedLanguages.length,'male catalog must contain exactly ten videos')
assert.doesNotMatch(femaleRemoteBlock+maleRemoteBlock,/[?&](?:Expires|Signature|Key-Pair-Id)=/i,'video catalogs must not use expiring signed query parameters')

assert.match(explainerSource,/const \[presenter,setPresenter\]=useState\('female'\)/)
assert.match(explainerSource,/savedPresenter==='male'\|\|savedPresenter==='female'/)
assert.match(explainerSource,/localStorage\.setItem\('asgold-video-presenter',presenter\)/)
assert.match(explainerSource,/role='group' aria-label=\{c\.voice\}/)
assert.match(explainerSource,/aria-pressed=\{presenter==='female'\}/)
assert.match(explainerSource,/aria-pressed=\{presenter==='male'\}/)
assert.match(explainerSource,/onClick=\{\(\)=>setPresenter\('female'\)\}/)
assert.match(explainerSource,/onClick=\{\(\)=>setPresenter\('male'\)\}/)
assert.match(explainerSource,/presenter==='male'&&videoLanguage!=='de'/)
assert.match(explainerSource,/\{c\.maleFallback\}/)
assert.match(explainerSource,/presenter==='female'&&<source src=\{femaleLocal\}/)
assert.match(explainerSource,/<source src=\{presenter==='male'\?maleRemote:femaleRemote\}/)
assert.match(explainerSource,/presenter==='male'&&<source src=\{femaleRemote\}/)
assert.match(explainerSource,/const rtl=uiLanguage==='ar'\|\|uiLanguage==='fa'/)
assert.match(compatibilitySource,/modules\/public\/ExplainerVideo/)

assert.match(configSource,/https:\/\/resource2\.heygen\.ai https:\/\/files2\.heygen\.ai/)
assert.match(configSource,/media-src 'self' blob: \$\{heygenMediaOrigins\}/)
assert.match(configSource,/Permissions-Policy'.*payment=\(\)/)

console.log('V36 explainer guard: ten languages, accessible presenter controls, fallbacks, module ownership and payment lock verified.')
