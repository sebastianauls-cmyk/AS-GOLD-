import assert from 'node:assert/strict'
import fs from 'node:fs'

const layout=fs.readFileSync('app/layout.js','utf8')
const language=fs.readFileSync('app/components/LanguageSwitcher.js','utf8')
const video=fs.readFileSync('app/components/ExplainerVideo.js','utf8')
const page=fs.readFileSync('app/page.js','utf8')
const consistency=fs.readFileSync('app/components/V41CaseConsistency.js','utf8')
const privacy=fs.readFileSync('app/datenschutzsteuerung/PrivacyDashboard.js','utf8')
const supabase=fs.readFileSync('app/lib/supabaseClient.js','utf8')

assert.doesNotMatch(layout,/V43VisibilityFix/)
assert.equal((language.match(/aria-label="Zurück"/g)||[]).length,1)
assert.equal((language.match(/>← Zurück<\/button>/g)||[]).length,1)
assert.match(language,/new CustomEvent\('asgold:open-explainer'/)
assert.doesNotMatch(language,/role="dialog"/)
assert.match(video,/addEventListener\('asgold:open-explainer'/)
assert.match(video,/as-gold-explainer-de-female\.mp4/)
assert.match(video,/as-gold-explainer-de-male\.mp4/)
assert.match(video,/aria-pressed=\{presenter==='female'\}/)
assert.match(video,/aria-pressed=\{presenter==='male'\}/)
assert.match(supabase,/createClient\(/)
for(const source of [page,consistency,privacy]){
  assert.match(source,/import \{ supabase \} from/)
  assert.doesNotMatch(source,/from '@supabase\/supabase-js'/)
}

console.log('V49 recovery guard passed: one navigation layer, two presenter videos and one shared Supabase client verified.')
