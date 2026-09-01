import assert from 'node:assert/strict'
import fs from 'node:fs'

const guard=fs.readFileSync(new URL('../app/components/V48FinalUiGuard.js',import.meta.url),'utf8')
const nav=fs.readFileSync(new URL('../app/components/V43VisibilityFix.js',import.meta.url),'utf8')
const video=fs.readFileSync(new URL('../app/components/ExplainerVideo.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')

assert.match(guard,/keepSingle\(backPattern\)/)
assert.match(guard,/keepSingle\(germanPattern\)/)
assert.match(guard,/keepSingle\(videoPattern\)/)
assert.match(guard,/v48DuplicateHidden/)
assert.match(guard,/removeStaleVideoProcessingNotice/)
assert.match(nav,/history\.back/)
assert.match(nav,/bar\.hidden=bar\.childElementCount===0/)
assert.match(video,/femaleRemoteVideos/)
assert.match(video,/maleRemoteVideos/)
for(const code of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg']){
  assert.match(video,new RegExp(`${code}:'https?://`),`missing remote video for ${code}`)
}
assert.match(video,/presenter==='female'/)
assert.match(video,/presenter==='male'/)
assert.match(layout,/V48FinalUiGuard/)
console.log('V48 final UI guard passed: back navigation, deduplication, 10-language male/female video selection and stale notices are protected.')
