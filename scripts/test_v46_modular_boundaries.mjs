import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const exists=path=>assert.ok(fs.existsSync(path),`missing module file: ${path}`)

for(const path of [
  'app/modules/language/LanguageSwitcher.js',
  'app/modules/language/OutputLanguageBridge.js',
  'app/modules/language/outputLanguage.js',
  'app/modules/language/LegalLanguageContext.js',
  'app/modules/language/v30Languages.base.mjs',
  'app/modules/language/v35Languages.mjs',
  'app/modules/language/v35RoBgExtras.mjs',
  'app/modules/language/v36Languages.mjs',
  'app/modules/language/v30ComponentTranslations.base.mjs',
  'app/modules/language/v35ComponentTranslations.mjs',
  'app/modules/navigation/AccessibilityHardening.js',
  'app/modules/navigation/MobileResilience.js',
  'app/modules/public/ProblemNavigator.js',
  'app/modules/public/problemNavigatorLanguages.mjs',
  'app/modules/public/problemNavigatorLanguagesV36.mjs',
  'app/modules/tester/TesterPaused.js',
  'app/modules/auth/PasswordPolicy.js',
  'app/modules/auth/v29PasswordPolicy.mjs',
  'app/modules/cases/V24Workspace.js',
  'app/modules/cases/V42ActionableGaps.js',
  'app/modules/documents/V26DocumentAnalysis.js',
  'app/modules/documents/uploadConfig.js',
  'app/modules/pricing/PromoCodeControl.js',
  'app/modules/pricing/v31PromoTranslations.mjs',
  'app/modules/compliance/LegalDocument.js',
  'app/modules/compliance/PrivacyDashboard.js',
  'app/modules/compliance/WithdrawalForm.js',
  'app/modules/compliance/v31InteractiveLegalTranslations.mjs',
  'app/modules/compliance/v31LegalTranslations.mjs',
  'app/modules/integrations/IntegrationHub.js',
  'app/modules/services/officeExports.js',
  'app/modules/services/supabaseClient.js',
  'app/modules/services/documentAnalysis.js',
  'app/modules/workspace/WorkspaceApp.js'
]) exists(path)

const pageEntry=read('app/page.js')
assert.match(pageEntry,/modules\/workspace\/WorkspaceApp/)
assert.ok(pageEntry.length<500,'root page must remain a thin workspace-module entry point')
const workspace=read('app/modules/workspace/WorkspaceApp.js')
assert.match(workspace,/signInWithPassword/)
assert.match(workspace,/DocumentSection/)
assert.match(workspace,/doExport/)
assert.match(workspace,/\.\.\/services\/supabaseClient/)
assert.match(workspace,/\.\.\/services\/documentAnalysis/)
assert.doesNotMatch(workspace,/from '@supabase\/supabase-js'/)
assert.doesNotMatch(workspace,/const supabase = createClient\(/)
assert.match(workspace,/invokeDocumentAnalysis/)
assert.match(workspace,/\.\.\/services\/supabaseClient/)
assert.match(workspace,/\.\.\/services\/documentAnalysis/)
assert.doesNotMatch(workspace,/from '@supabase\/supabase-js'/)
assert.doesNotMatch(workspace,/const supabase = createClient\(/)
assert.match(workspace,/invokeDocumentAnalysis/)
assert.match(workspace,/\.\.\/documents\/uploadConfig/)
assert.doesNotMatch(workspace,/const maxUploadBytes =/)
assert.match(workspace,/\.\.\/services\/supabaseClient/)
assert.match(workspace,/\.\.\/services\/documentAnalysis/)
assert.doesNotMatch(workspace,/from '@supabase\/supabase-js'/)
assert.doesNotMatch(workspace,/const supabase = createClient\(/)
assert.match(workspace,/invokeDocumentAnalysis/)

const layout=read('app/layout.js')
assert.doesNotMatch(layout,/components\/V4[0-5]/)
assert.doesNotMatch(layout,/V43VisibilityFix|V44LanguageOrder|V38IntegrationAvailabilityGuard/)
assert.doesNotMatch(layout,/OutputLanguageBridge/)
assert.match(layout,/modules\/navigation\/AccessibilityHardening/)
assert.match(layout,/modules\/navigation\/MobileResilience/)
assert.match(layout,/modules\/public\/ProblemNavigator/)
assert.match(layout,/modules\/cases\/V42ActionableGaps/)

const outputBridge=read('app/modules/language/OutputLanguageBridge.js')
const analysisService=read('app/modules/services/documentAnalysis.js')
assert.doesNotMatch(outputBridge,/window\.fetch|gold-ocr-v28/)
assert.match(analysisService,/output_language:outputLanguage/)

const switcher=read('app/modules/language/LanguageSwitcher.js')
assert.equal((switcher.match(/← Zurück/g)||[]).length,1,'language menu must have exactly one visible back/close control')
assert.match(switcher,/setOpen\(false\)/)
assert.match(switcher,/Escape/)
assert.doesNotMatch(switcher,/history\.(back|pushState|replaceState)/)

const tester=read('app/testen/page.js')+read('app/modules/tester/TesterPaused.js')
assert.match(tester,/TesterPaused/)
assert.match(tester,/Testerzugang vorübergehend geschlossen/)
assert.doesNotMatch(tester,/Kostenlos testen|start=register/)

const privacyRoute=read('app/datenschutzsteuerung/page.js')
const privacyModule=read('app/modules/compliance/PrivacyDashboard.js')
const withdrawalRoute=read('app/widerruf/page.js')
const withdrawalModule=read('app/modules/compliance/WithdrawalForm.js')
assert.match(privacyRoute,/modules\/compliance\/PrivacyDashboard/)
assert.match(withdrawalRoute,/modules\/compliance\/WithdrawalForm/)
assert.match(privacyModule,/modules\/services\/supabaseClient|\.\.\/services\/supabaseClient/)
assert.doesNotMatch(privacyModule,/createClient\(/)
assert.match(withdrawalModule,/\.\.\/language\/LegalLanguageContext/)
assert.match(withdrawalModule,/\.\/v31InteractiveLegalTranslations\.mjs/)

for(const [compat,modulePath] of [
  ['app/components/LanguageSwitcher.js','modules/language/LanguageSwitcher'],
  ['app/components/HeroCopyEnhancer.js','modules/public/HeroCopyEnhancer'],
  ['app/components/V38DeadlineCardEnhancer.js','modules/cases/V38DeadlineCardEnhancer'],
  ['app/components/V39CaseTimelineAutoAssessment.js','modules/cases/V39CaseTimelineAutoAssessment'],
  ['app/components/V40ProfessionalHandoff.js','modules/cases/V40ProfessionalHandoff'],
  ['app/components/V41CaseConsistency.js','modules/cases/V41CaseConsistency'],
  ['app/components/V42ActionableGaps.js','modules/cases/V42ActionableGaps'],
  ['app/components/V45OutputLanguageBridge.js','modules/language/OutputLanguageBridge'],
  ['app/components/LegalLanguageContext.js','modules/language/LegalLanguageContext'],
  ['app/lib/v30Languages.mjs','modules/language/v36Languages'],
  ['app/lib/v36Languages.mjs','modules/language/v36Languages'],
  ['app/lib/v35Languages.mjs','modules/language/v35Languages'],
  ['app/lib/v35RoBgExtras.mjs','modules/language/v35RoBgExtras'],
  ['app/lib/v30Languages.base.mjs','modules/language/v30Languages.base'],
  ['app/lib/v30ComponentTranslations.mjs','modules/language/v35ComponentTranslations'],
  ['app/lib/v35ComponentTranslations.mjs','modules/language/v35ComponentTranslations'],
  ['app/lib/v30ComponentTranslations.base.mjs','modules/language/v30ComponentTranslations.base'],
  ['app/lib/v31PromoTranslations.mjs','modules/pricing/v31PromoTranslations'],
  ['app/lib/problemNavigatorLanguages.mjs','modules/public/problemNavigatorLanguages'],
  ['app/lib/problemNavigatorLanguagesV36.mjs','modules/public/problemNavigatorLanguagesV36'],
  ['app/lib/v29PasswordPolicy.mjs','modules/auth/v29PasswordPolicy'],
  ['app/lib/v31InteractiveLegalTranslations.mjs','modules/compliance/v31InteractiveLegalTranslations'],
  ['app/lib/v31LegalTranslations.mjs','modules/compliance/v31LegalTranslations'],
  ['app/lib/officeExports.js','modules/services/officeExports'],
  ['app/datenschutzsteuerung/PrivacyDashboard.js','modules/compliance/PrivacyDashboard'],
  ['app/widerruf/WithdrawalForm.js','modules/compliance/WithdrawalForm']
]) assert.match(read(compat),new RegExp(modulePath.replaceAll('/','\\/')))

for(const path of [
  'app/lib/v30Languages.mjs','app/lib/v36Languages.mjs','app/lib/v35Languages.mjs','app/lib/v35RoBgExtras.mjs','app/lib/v30Languages.base.mjs',
  'app/lib/v30ComponentTranslations.mjs','app/lib/v35ComponentTranslations.mjs','app/lib/v30ComponentTranslations.base.mjs','app/lib/v31PromoTranslations.mjs',
  'app/lib/problemNavigatorLanguages.mjs','app/lib/problemNavigatorLanguagesV36.mjs','app/lib/v29PasswordPolicy.mjs',
  'app/lib/v31InteractiveLegalTranslations.mjs','app/lib/v31LegalTranslations.mjs','app/lib/officeExports.js',
  'app/datenschutzsteuerung/PrivacyDashboard.js','app/widerruf/WithdrawalForm.js'
]) assert.ok(read(path).length<140,`${path} should be a thin compatibility adapter`)

console.log('V46 modular-boundary guard passed: thin page entry, domain-owned language/public/auth/compliance/pricing catalogs, route-owned compliance surfaces, shared service ownership, single language-menu back control, tester lock and compatibility adapters verified.')
