import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { EXPLAINER_VIDEO_LANGUAGES, explainerVideoCatalog } from '../app/modules/public/explainerVideoCatalogV133.mjs'

const expectedLanguages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
const sources=new Set()
const ids=new Set()

assert.ok(APP_RELEASE.number>=133)
assert.equal(APP_VERSION,`V${APP_RELEASE.number}`)
assert.deepEqual([...EXPLAINER_VIDEO_LANGUAGES],expectedLanguages)

for(const presenter of ['female','male']){
  for(const language of expectedLanguages){
    const video=explainerVideoCatalog[presenter]?.[language]
    assert.ok(video,`missing ${presenter}/${language}`)
    assert.ok(video.heygenId,`missing HeyGen provenance for ${presenter}/${language}`)
    assert.equal(ids.has(video.heygenId),false,`duplicate HeyGen id ${video.heygenId}`)
    ids.add(video.heygenId)
    assert.equal(sources.has(video.src),false,`duplicate video source ${video.src}`)
    sources.add(video.src)

    if(language==='de'){
      assert.equal(video.src,`/videos/ash-workspace-gold-v133-${presenter}-de.mp4`)
      const videoInfo=await stat(new URL(`../public${video.src}`,import.meta.url))
      assert.ok(videoInfo.isFile()&&videoInfo.size>5_000_000,`invalid local German ${presenter} video`)
    }else{
      assert.equal(video.src,`https://resource2.heygen.ai/video_translate/${video.heygenId}/original.mp4`)
    }

    assert.equal(video.captions,`/captions/ash-workspace-gold-v133-${presenter}-${language}.vtt`)
    const captionText=await readFile(new URL(`../public${video.captions}`,import.meta.url),'utf8')
    assert.match(captionText,/^WEBVTT/)
    assert.match(captionText,/ASH Workspace Gold/)
    assert.doesNotMatch(captionText,/\bAS Gold\b/)
  }
}

assert.equal(ids.size,22)
assert.equal(sources.size,22)
const publicExplainer=await readFile(new URL('../app/modules/public/ExplainerVideo.js',import.meta.url),'utf8')
const languageDialog=await readFile(new URL('../app/modules/language/ExplainerVideoDialog.js',import.meta.url),'utf8')
for(const source of [publicExplainer,languageDialog]){
  assert.match(source,/getExplainerVideo/)
  assert.match(source,/<track/)
  assert.doesNotMatch(source,/as-gold-v35-|as-gold-explainer-|2014388e973a4723907ce6f55851921d|612b49a63cc9445b91024a45151c6446/)
}

console.log('V133 ASH video guard passed: 22 current videos, 22 local subtitle tracks, no legacy AS Gold source and no presenter fallback.')
