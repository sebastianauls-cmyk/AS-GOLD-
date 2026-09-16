import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { EXPLAINER_VIDEO_LANGUAGES, explainerVideoCatalog } from '../app/modules/public/explainerVideoCatalogV133.mjs'

const expectedLanguages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
const explainerSource=await readFile(new URL('../app/modules/public/ExplainerVideo.js',import.meta.url),'utf8')
const dialogSource=await readFile(new URL('../app/modules/language/ExplainerVideoDialog.js',import.meta.url),'utf8')
const compatibilitySource=await readFile(new URL('../app/components/ExplainerVideo.js',import.meta.url),'utf8')
const configSource=await readFile(new URL('../next.config.mjs',import.meta.url),'utf8')

assert.deepEqual([...EXPLAINER_VIDEO_LANGUAGES],expectedLanguages)
for(const presenter of ['female','male']){
  for(const language of expectedLanguages){
    const video=explainerVideoCatalog[presenter]?.[language]
    assert.ok(video?.src,`missing ${presenter} video for ${language}`)
    assert.ok(video?.captions,`missing ${presenter} captions for ${language}`)
  }
}

for(const language of expectedLanguages)assert.ok(explainerSource.includes("['"+language+"',"),'missing selector '+language)
assert.match(explainerSource,/const \[presenter,setPresenter\]=useState\('female'\)/)
assert.match(explainerSource,/savedPresenter==='male'\|\|savedPresenter==='female'/)
assert.match(explainerSource,/role='group' aria-label=\{c\.voice\}/)
assert.match(explainerSource,/aria-pressed=\{presenter==='female'\}/)
assert.match(explainerSource,/aria-pressed=\{presenter==='male'\}/)
assert.match(explainerSource,/getExplainerVideo\(videoLanguage,presenter\)/)
assert.match(explainerSource,/<track src=\{selectedVideo\.captions\}/)
assert.doesNotMatch(explainerSource,/as-gold-v35-|femaleLocalVideos|maleLocalVideos|maleFallback\}<\/p>/)
assert.doesNotMatch(explainerSource,/createPortal|MutationObserver|document\.createElement/)
assert.match(dialogSource,/getExplainerVideo\(videoLanguage,presenter\)/)
assert.match(dialogSource,/kind="subtitles"/)
assert.match(compatibilitySource,/modules\/public\/ExplainerVideo/)
assert.match(configSource,/https:\/\/resource2\.heygen\.ai https:\/\/files2\.heygen\.ai/)
console.log('V36/V133 explainer guard: eleven languages, both presenters, subtitles and the current ASH video catalog are wired without legacy fallbacks.')
