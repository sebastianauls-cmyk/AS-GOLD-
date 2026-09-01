import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const exists=path=>assert.ok(fs.existsSync(path),`missing module file: ${path}`)

for(const path of [
  'app/modules/language/LanguageSwitcher.js',
  'app/modules/language/OutputLanguageBridge.js',
  'app/modules/language/outputLanguage.js',
  'app/modules/language/LegalLanguageContext.js',
  'app/modules/navigation/AccessibilityHardening.js',
  'app/modules/navigation/MobileResilience.js',
  'app/modules/public/ProblemNavigator.js',
  'app/modules/tester/TesterPaused.js',
  'app/modules/auth/PasswordPolicy.js',
  'app/modules/cases/V24Workspace.js',
  'app/modules/cases/V42ActionableGaps.js',
  'app/modules/documents/V26DocumentAnalysis.js',
  'app/modules/pricing/PromoCodeControl.js',
  'app/modules/compliance/LegalDocument.js',
  'app/modules/integrations/IntegrationHub.js'
]) exists(path)

const layout=read('app/layout.js')
assert.doesNotMatch(layout,/components\/V4[0-5]/)
assert.doesNotMatch(layout,/V43VisibilityFix|V44LanguageOrder|V38IntegrationAvailabilityGuard/)
assert.match(layout,/modules\/language\/OutputLanguageBridge/)
assert.match(layout,/modules\/navigation\/AccessibilityHardening/)
assert.match(layout,/modules\/navigation\/MobileResilience/)
assert.match(layout,/modules\/public\/ProblemNavigator/)
assert.match(layout,/modules\/cases\/V42ActionableGaps/)

const switcher=read('app/modules/language/LanguageSwitcher.js')
assert.equal((switcher.match(/← Zurück/g)||[]).length,1,'language menu must have exactly one visible back/close control')
assert.match(switcher,/setOpen\(false\)/)
assert.match(switcher,/Escape/)
assert.doesNotMatch(switcher,/history\.(back|pushState|replaceState)/)

const tester=read('app/testen/page.js')+read('app/modules/tester/TesterPaused.js')
assert.match(tester,/TesterPaused/)
assert.match(tester,/Testerzugang vorübergehend geschlossen/)
assert.doesNotMatch(tester,/Kostenlos testen|start=register/)

for(const [compat,modulePath] of [
  ['app/components/LanguageSwitcher.js','modules/language/LanguageSwitcher'],
  ['app/components/V38DeadlineCardEnhancer.js','modules/cases/V38DeadlineCardEnhancer'],
  ['app/components/V39CaseTimelineAutoAssessment.js','modules/cases/V39CaseTimelineAutoAssessment'],
  ['app/components/V40ProfessionalHandoff.js','modules/cases/V40ProfessionalHandoff'],
  ['app/components/V41CaseConsistency.js','modules/cases/V41CaseConsistency'],
  ['app/components/V42ActionableGaps.js','modules/cases/V42ActionableGaps'],
  ['app/components/V45OutputLanguageBridge.js','modules/language/OutputLanguageBridge'],
  ['app/components/LegalLanguageContext.js','modules/language/LegalLanguageContext']
]) assert.match(read(compat),new RegExp(modulePath.replaceAll('/','\\/')))

console.log('V46 modular-boundary guard passed: module ownership, single language-menu back control, tester lock and compatibility adapters verified.')
