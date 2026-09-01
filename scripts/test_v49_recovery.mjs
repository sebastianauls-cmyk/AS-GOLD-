import assert from 'node:assert/strict'
import fs from 'node:fs'

const layout=fs.readFileSync('app/layout.js','utf8')
const language=fs.readFileSync('app/components/LanguageSwitcher.js','utf8')
const publicModules=fs.readFileSync('app/components/PublicLanguageModules.js','utf8')
const video=fs.readFileSync('app/components/ExplainerVideo.js','utf8')
const page=fs.readFileSync('app/page.js','utf8')
const consistency=fs.readFileSync('app/components/V41CaseConsistency.js','utf8')
const privacy=fs.readFileSync('app/datenschutzsteuerung/PrivacyDashboard.js','utf8')
const supabase=fs.readFileSync('app/lib/supabaseClient.js','utf8')
const legalTranslations=fs.readFileSync('app/lib/v31LegalTranslations.mjs','utf8')

assert.doesNotMatch(layout,/V43VisibilityFix/)
assert.match(language,/flagLanguageMenuBack/)
assert.match(language,/backButtonText/)
assert.match(language,/new CustomEvent\('asgold:open-explainer'/)
assert.equal((publicModules.match(/className="publicBackButton"/g)||[]).length,1)
assert.match(publicModules,/back:'Zurück'/)
assert.match(publicModules,/new CustomEvent\('asgold:open-explainer'/)
assert.doesNotMatch(language,/role="dialog"/)
assert.match(video,/addEventListener\('asgold:open-explainer'/)
assert.match(video,/as-gold-explainer-de-female\.mp4/)
assert.match(video,/as-gold-explainer-de-male\.mp4/)
assert.match(video,/aria-pressed=\{presenter==='female'\}/)
assert.match(video,/aria-pressed=\{presenter==='male'\}/)
assert.match(supabase,/createClient\(/)
assert.doesNotMatch(legalTranslations,/V33/)
assert.match(legalTranslations,/V49 is a controlled product test/)
for(const source of [page,consistency,privacy]){
  assert.match(source,/import \{ supabase \} from/)
  assert.doesNotMatch(source,/from '@supabase\/supabase-js'/)
}

console.log('V49 recovery guard passed: one navigation layer, two presenter videos, one shared Supabase client and current tester copy verified.')
