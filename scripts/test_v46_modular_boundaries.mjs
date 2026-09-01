import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const exists=path=>assert.ok(fs.existsSync(path),`missing module file: ${path}`)

for(const path of [
  'app/modules/language/LanguageSwitcher.js',
  'app/modules/language/useLanguagePreferences.js',
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
  'app/modules/public/PublicLanding.js',
  'app/modules/public/caseNavigation.js',
  'app/modules/public/ProblemNavigator.js',
  'app/modules/public/problemNavigatorLanguages.mjs',
  'app/modules/public/problemNavigatorLanguagesV36.mjs',
  'app/modules/tester/TesterPaused.js',
  'app/modules/auth/PasswordPolicy.js',
  'app/modules/auth/v29PasswordPolicy.mjs',
  'app/modules/auth/PasswordField.js',
  'app/modules/auth/AuthSurface.js',
  'app/modules/cases/V24Workspace.js',
  'app/modules/cases/V42ActionableGaps.js',
  'app/modules/documents/V26DocumentAnalysis.js',
  'app/modules/documents/uploadConfig.js',
  'app/modules/documents/exportUi.js',
  'app/modules/workspace/workspaceText.js',
  'app/modules/workspace/stateConfig.js',
  'app/modules/workspace/ProtectedWorkspaceShell.js',
  'app/modules/workspace/LoadingSurface.js',
  'app/modules/workspace/AppLogo.js',
  'app/modules/workspace/WorkspaceApp.js',
  'app/modules/compliance/AccountSurface.js',
  'app/modules/pricing/PricingSurface.js',
  'app/modules/compliance/workspaceControlText.js',
  'app/modules/compliance/LegalDocument.js',
  'app/modules/compliance/PrivacyDashboard.js',
  'app/modules/compliance/WithdrawalForm.js',
  'app/modules/compliance/v31InteractiveLegalTranslations.mjs',
  'app/modules/compliance/v31LegalTranslations.mjs',
  'app/modules/public/catalog.js',
  'app/modules/public/publicUi.js',
  'app/modules/pricing/catalog.js',
  'app/modules/pricing/PromoCodeControl.js',
  'app/modules/pricing/v31PromoTranslations.mjs',
  'app/modules/auth/passwordUi.js',
  'app/modules/integrations/IntegrationHub.js',
  'app/modules/services/officeExports.js',
  'app/modules/services/supabaseClient.js',
  'app/modules/services/documentAnalysis.js',
  'app/modules/services/documentAnalysis.js'
]) exists(path)

const pageEntry=read('app/page.js')
assert.match(pageEntry,/modules\/workspace\/WorkspaceApp/)
assert.ok(pageEntry.length<500,'root page must remain a thin workspace-module entry point')

const workspace=read('app/modules/workspace/WorkspaceApp.js')
const languagePreferences=read('app/modules/language/useLanguagePreferences.js')
assert.match(workspace,/useLanguagePreferences/)
assert.doesNotMatch(workspace,/localStorage\.setItem\('asgold-language'/)
assert.doesNotMatch(workspace,/document\.documentElement\.dir/)
assert.match(languagePreferences,/asgold-language/)
assert.match(languagePreferences,/asgold-output-language/)
assert.match(languagePreferences,/asgold:output-language/)
assert.match(languagePreferences,/rtlLanguages/)
assert.match(workspace,/signInSession/)
assert.match(read('app/modules/services/authRepository.js'),/signInWithPassword/)
assert.match(read('app/modules/documents/DocumentsSurface.js'),/DocumentSection/)
assert.match(workspace,/DocumentsSurface/)
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
assert.match(workspace,/\.\.\/services\/supabaseClient/)
assert.match(workspace,/\.\.\/services\/documentAnalysis/)
assert.match(workspace,/\.\.\/documents\/uploadConfig/)
assert.match(workspace,/\.\.\/auth\/passwordUi/)
assert.match(workspace,/\.\.\/public\/publicUi/)
assert.match(workspace,/\.\.\/documents\/exportUi/)
assert.match(workspace,/\.\.\/pricing\/catalog/)
assert.match(workspace,/\.\.\/public\/catalog/)
assert.match(workspace,/\.\.\/compliance\/workspaceControlText/)
assert.match(workspace,/\.\/stateConfig/)
assert.match(workspace,/ProtectedWorkspaceShell/)
assert.match(workspace,/LoadingSurface/)
assert.doesNotMatch(workspace,/<header className=\"appTop\">/)
assert.match(read('app/modules/workspace/ProtectedWorkspaceShell.js'),/<header className=\"appTop\">/)
assert.match(workspace,/LoadingSurface/)
assert.match(workspace,/AuthSurface/)
assert.match(workspace,/PublicLanding/)
assert.match(workspace,/invokeDocumentAnalysis/)
assert.doesNotMatch(workspace,/from '@supabase\/supabase-js'/)
assert.doesNotMatch(workspace,/const supabase = createClient\(/)
assert.doesNotMatch(workspace,/<header className="appTop">/)
assert.doesNotMatch(workspace,/className="card authCard"/)
assert.doesNotMatch(workspace,/className="publicTop"/)
assert.doesNotMatch(workspace,/function PasswordField\(/)
assert.doesNotMatch(workspace,/function Logo\(/)
assert.doesNotMatch(workspace,/const maxUploadBytes =/)
assert.doesNotMatch(workspace,/const passwordUi =/)
assert.doesNotMatch(workspace,/const ui =/)
assert.doesNotMatch(workspace,/const exportUi =/)
assert.doesNotMatch(workspace,/const appText =/)
for (const name of ['terms','plans','planJourney','planText','journeyLabels','recommendationText','periodText','goalTier','tierRank','notices','dashboardGuide','transparencyText','caseDiscoveryText','publicAudienceText','testerLinkText','launchTrustText','serverControlText','accessPendingMessages','emptyData','emptyCase','sectionNames']) {
  assert.doesNotMatch(workspace,new RegExp('const '+name+'\\s*='))
}

const authSurface=read('app/modules/auth/AuthSurface.js')
assert.match(authSurface,/\.\/PasswordField/)
assert.match(authSurface,/\.\.\/workspace\/AppLogo/)
assert.match(authSurface,/\.\.\/language\/LanguageSwitcher/)
assert.match(authSurface,/\.\.\/compliance\/LegalFooter/)
assert.match(authSurface,/backExplanation/)
assert.match(authSurface,/lt\.passwordReset/)
assert.match(workspace,/lt=\{lt\}/)

const protectedShell=read('app/modules/workspace/ProtectedWorkspaceShell.js')
assert.match(protectedShell,/<header className="appTop">/)

const publicLanding=read('app/modules/public/PublicLanding.js')
assert.match(publicLanding,/className="publicTop"/)
assert.match(publicLanding,/V37FirstAction/)
assert.match(publicLanding,/ProblemNavigator/)
assert.match(publicLanding,/ExplainerVideo/)
assert.match(publicLanding,/ProductIntroCompact/)
for(const path of ['app/modules/public/V37FirstAction.js','app/modules/public/ProblemNavigator.js','app/modules/public/ExplainerVideo.js','app/modules/public/ProductIntroCompact.js']) {
  const source=read(path)
  assert.doesNotMatch(source,/createPortal|MutationObserver|document\.createElement/,'public module must render directly: '+path)
}
assert.match(publicLanding,/id="preise"/)
assert.match(publicLanding,/PublicLanguageModules/)
assert.match(publicLanding,/\.\.\/compliance\/LegalFooter/)
const publicLanguageModules=read('app/modules/public/PublicLanguageModules.js')
const publicStart=publicLanding.indexOf('return <>')
const interfaceControl=publicLanguageModules.indexOf('<LanguageSwitcher value={language} onChange={onLanguageChange}')
const outputControl=publicLanguageModules.indexOf('<LanguageSwitcher value={outputLanguage} onChange={onOutputLanguageChange}')
assert.ok(publicStart>=0,'public landing must render a React fragment')
assert.ok(interfaceControl>=0,'interface language control must exist in the owning public language module')
assert.ok(outputControl>interfaceControl,'output language must follow interface language in natural source order')
assert.match(publicLanguageModules,/customerModuleSlot/)
assert.match(publicLanguageModules,/\{customerModule\}/)
assert.doesNotMatch(publicLanguageModules,/createPortal|MutationObserver|document\.createElement/)
assert.match(publicLanding,/id=\"asgold-user-audience\"/,'audience content must be direct React markup')
assert.match(publicLanding,/jumpToPublicCaseResult\(\)/,'case selection must trigger direct React-owned navigation')
const heroTitleModule=read('app/modules/public/HeroTitleStabilizer.js')
const heroCopyModule=read('app/modules/public/HeroCopyEnhancer.js')
const caseNavigation=read('app/modules/public/caseNavigation.js')
assert.doesNotMatch(heroTitleModule,/MutationObserver|querySelector|useEffect/)
assert.doesNotMatch(heroCopyModule,/MutationObserver|querySelector|createElement|innerHTML|useEffect/)
assert.doesNotMatch(caseNavigation,/addEventListener/)
assert.match(caseNavigation,/getElementById\('asgold-public-case-result'\)/)

const layout=read('app/layout.js')
for(const name of ['V37FirstAction','ProblemNavigator','ExplainerVideo','ProductIntroCompact']) assert.doesNotMatch(layout,new RegExp(name),'public portal modules must not be mounted globally')
assert.doesNotMatch(layout,/components\/V4[0-5]/)
assert.doesNotMatch(layout,/V43VisibilityFix|V44LanguageOrder|V38IntegrationAvailabilityGuard/)
assert.doesNotMatch(layout,/HeroCopyEnhancer|HeroTitleStabilizer|CaseChoiceJumpEnhancer/)
assert.doesNotMatch(layout,/OutputLanguageBridge/)
assert.match(layout,/modules\/navigation\/AccessibilityHardening/)
assert.match(layout,/modules\/navigation\/MobileResilience/)
assert.match(publicLanding,/\.\/ProblemNavigator/)
assert.doesNotMatch(layout,/V38DeadlineCardEnhancer/)
const directCaseModule=read('app/modules/cases/V24Workspace.js')
const deadlineModule=read('app/modules/cases/V38DeadlineCardEnhancer.js')
assert.match(directCaseModule,/DeadlineWarningCard/)
assert.doesNotMatch(deadlineModule,/MutationObserver|document\.createElement|querySelector|innerHTML/)
const assessmentModule=read('app/modules/cases/V38AssessmentExplainability.js')
const primaryStepModule=read('app/modules/cases/V38PrimaryNextStep.js')
assert.doesNotMatch(layout,/V38AssessmentExplainability|V38PrimaryNextStep/)
assert.match(directCaseModule,/AssessmentExplainability/)
assert.match(directCaseModule,/PrimaryNextStepCard/)
assert.doesNotMatch(assessmentModule,/MutationObserver|document\.createElement|querySelector|appendChild/)
assert.doesNotMatch(primaryStepModule,/MutationObserver|document\.createElement|querySelector|innerHTML/)
const v39Module=read('app/modules/cases/V39CaseTimelineAutoAssessment.js')
assert.doesNotMatch(layout,/V39CaseTimelineAutoAssessment/)
assert.match(directCaseModule,/DocumentAutoAssessment/)
assert.match(directCaseModule,/CaseTimeline/)
assert.doesNotMatch(v39Module,/MutationObserver|document\.createElement|querySelector|innerHTML|setInterval/)

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
assert.match(privacyModule,/\.\.\/services\/supabaseClient/)
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


// V58 current-behavior guard
assert.match(publicLanding,/PublicLanguageModules/)
assert.match(publicLanding,/data-output-language-status/)
assert.match(publicLanguageModules,/publicBackButton/)
assert.match(publicLanguageModules,/returnToStart/)
assert.match(publicLanguageModules,/outputLanguageStatus/)
assert.match(publicLanguageModules,/customerModuleSlot/)
assert.match(switcher,/publicPicker=false/)
assert.match(switcher,/active\.label/)
assert.match(switcher,/flagLanguageMenuBack/)
const currentCss=read('app/globals.css')
assert.match(currentCss,/\.publicLanguageModules/)
assert.match(currentCss,/\.customerModuleSlot/)
assert.match(currentCss,/\.flagLanguageMenu \.flagLanguageMenuBack/)
const currentMicrophone=read('app/modules/public/ProblemNavigator.js')
assert.match(currentMicrophone,/window\.SpeechRecognition\|\|window\.webkitSpeechRecognition/)
assert.match(currentMicrophone,/navigator\.permissions/)
assert.doesNotMatch(currentMicrophone,/getUserMedia/)
assert.match(currentMicrophone,/recognition\.onaudiostart/)
assert.match(currentMicrophone,/aria-live="polite"/)
const currentExplainer=read('app/modules/public/ExplainerVideo.js')
assert.match(currentExplainer,/as-gold-explainer-de-female\.mp4/)
assert.match(currentExplainer,/as-gold-explainer-de-male\.mp4/)


for(const path of [
  'app/modules/workspace/DashboardSurface.js',
  'app/modules/cases/WorkspaceCaseSurfaces.js',
  'app/modules/cases/ApprovalsSurface.js',
  'app/modules/documents/DocumentsSurface.js',
  'app/modules/pricing/UpgradePanel.js',
  'app/modules/compliance/AccountControlPanel.js'
]) exists(path)
assert.match(workspace,/DashboardSurface/)
assert.match(workspace,/CasesSurface/)
assert.match(workspace,/ClientsSurface/)
assert.match(workspace,/DocumentsSurface/)
assert.match(workspace,/ApprovalsSurface/)
assert.doesNotMatch(workspace,/className=\"accountControl\"/,'account-control presentation belongs to compliance module')
assert.doesNotMatch(workspace,/className=\"detailCard upgradeBox\"/,'upgrade presentation belongs to pricing module')
assert.match(read('app/modules/compliance/AccountControlPanel.js'),/accountControl/)
assert.match(read('app/modules/pricing/UpgradePanel.js'),/PromoCodeControl/)
console.log('V46 final protected surface boundaries verified: dashboard, cases, clients, documents, approvals, pricing and compliance presentation are explicitly owned.')

console.log('V46 modular-boundary guard passed: thin root entry, extracted public/auth/workspace surfaces, domain-owned catalogs and services, direct output-language flow, single language-menu back control, tester lock and thin compatibility adapters verified.')

assert.match(read('app/modules/auth/AuthSurface.js'),/backExplanation/)
assert.match(read('app/modules/auth/AuthSurface.js'),/lt\.passwordReset/)
assert.match(workspace,/lt=\{lt\}/)

for(const path of ['app/modules/services/pricingRepository.js','app/modules/services/complianceRepository.js','app/modules/services/documentRepository.js','app/modules/services/approvalRepository.js']) exists(path)
assert.match(workspace,/pricingRepository/)
assert.match(workspace,/complianceRepository/)
assert.match(workspace,/documentRepository/)
assert.match(workspace,/approvalRepository/)
for(const legacyCall of ["supabase.rpc('gold_upgrade_quote'","supabase.rpc('gold_request_upgrade'","supabase.from('approvals')","supabase.from('documents').update","supabase.from('account_privacy_settings').upsert","supabase.storage.from('goldstandard-private').upload","supabase.from('exports').insert"]) assert.ok(!workspace.includes(legacyCall),`workspace controller must not own low-level transaction: ${legacyCall}`)
console.log('V46 transactional service boundaries verified.')

exists('app/modules/services/authRepository.js')
assert.match(workspace,/authRepository/)
for(const directAuth of ['supabase.auth.getSession','supabase.auth.onAuthStateChange','supabase.auth.signInWithPassword','supabase.auth.resetPasswordForEmail','supabase.auth.signUp','supabase.auth.signOut']) assert.ok(!workspace.includes(directAuth),`workspace controller must not own auth transport: ${directAuth}`)
console.log('V46 auth service boundary verified.')

exists('app/modules/services/exportService.js')
const exportService=read('app/modules/services/exportService.js')
assert.match(workspace,/createWorkspaceExportArtifact/)
assert.match(exportService,/Packer\.toBlob/)
assert.match(exportService,/jsPDF/)
assert.match(exportService,/createXlsxBlob/)
assert.match(exportService,/createPptxBlob/)
assert.ok(!workspace.includes("await import('docx')"),'workspace controller must not generate DOCX directly')
assert.ok(!workspace.includes("await import('jspdf')"),'workspace controller must not generate PDF directly')
assert.ok(!workspace.includes("document.createElement('a')"),'workspace controller must not own browser download DOM')
console.log('V46 export service boundary verified.')

const directPublicLanding=read('app/modules/public/PublicLanding.js')
const directProblemNavigator=read('app/modules/public/ProblemNavigator.js')
assert.ok(!directPublicLanding.includes('document.querySelector'),'PublicLanding must not locate/click ProblemNavigator controls through the DOM')
assert.match(directProblemNavigator,/voiceSignal/)
assert.match(directProblemNavigator,/rootRef/)
assert.match(directProblemNavigator,/useEffect/)
console.log('V46 direct public voice boundary verified.')

const dashboardSurface=read('app/modules/workspace/DashboardSurface.js')
assert.doesNotMatch(dashboardSurface,/AccountControlPanel|UpgradePanel/,'dashboard must not own account or pricing controls')
assert.match(dashboardSurface,/setSection\('pricing'\)/)
assert.match(dashboardSurface,/setSection\('account'\)/)
assert.match(read('app/modules/pricing/PricingSurface.js'),/UpgradePanel/)
assert.match(read('app/modules/compliance/AccountSurface.js'),/AccountControlPanel/)
assert.match(workspace,/PricingSurface/)
assert.match(workspace,/AccountSurface/)
assert.match(workspace,/section==='pricing'/)
assert.match(workspace,/section==='account'/)

const caseCompletionPanels=read('app/modules/cases/CaseCompletionPanels.js')
assert.match(read('app/modules/cases/V24Workspace.js'),/CaseCompletionPanels/)
assert.doesNotMatch(read('app/layout.js'),/V40ProfessionalHandoff|V41CaseConsistency|V42ActionableGaps/,'V40-V42 must not be mounted globally')
assert.doesNotMatch(caseCompletionPanels,/MutationObserver|querySelector/,'direct V40-V42 panels must not patch rendered DOM')
assert.doesNotMatch(caseCompletionPanels,/createClient|from\('documents'\)|from\('assessments'\)/,'case consistency must consume existing case data')
assert.match(caseCompletionPanels,/data-v40-handoff="direct"/)
assert.match(caseCompletionPanels,/data-v41-consistency="direct"/)
assert.match(caseCompletionPanels,/data-v42-actions="direct"/)
console.log('V46 direct V40-V42 case-completion boundary verified.')
