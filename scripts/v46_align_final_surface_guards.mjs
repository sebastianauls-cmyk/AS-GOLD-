import fs from 'node:fs'

// The last deterministic refactor step also carries the current V51–V56
// production behavior into the modular owners before any regression guard runs.
await import('./v46_port_main_v56_parity.mjs')

const path='scripts/test_v46_modular_boundaries.mjs'
let source=fs.readFileSync(path,'utf8')
source=source.replace(
  "assert.match(workspace,/DocumentSection/)",
  "assert.match(read('app/modules/documents/DocumentsSurface.js'),/DocumentSection/)\nassert.match(workspace,/DocumentsSurface/)"
)

const oldLanguageOrder=`const publicStart=publicLanding.indexOf('return <>')
const interfaceControl=publicLanding.indexOf('<LanguageSwitcher value={language} onChange={setLanguage} label={t.language} publicPicker',publicStart)
const outputControl=publicLanding.indexOf('<LanguageSwitcher value={outputLanguage} onChange={setOutputLanguage} label={t.outputLanguage}/>',publicStart)
assert.ok(publicStart>=0,'public landing must render a React fragment')
assert.ok(interfaceControl>publicStart,'interface language control must exist on public landing')
assert.ok(outputControl>interfaceControl,'output language must follow interface language in natural source order')`
const newLanguageOrder=`const publicStart=publicLanding.indexOf('return <>')
const publicLanguageModules=read('app/modules/public/PublicLanguageModules.js')
const interfaceControl=publicLanguageModules.indexOf('<LanguageSwitcher value={language} onChange={onLanguageChange}')
const outputControl=publicLanguageModules.indexOf('<LanguageSwitcher value={outputLanguage} onChange={onOutputLanguageChange}')
assert.ok(publicStart>=0,'public landing must render a React fragment')
assert.match(publicLanding,/PublicLanguageModules/,'public landing must delegate language controls to the language module')
assert.ok(interfaceControl>=0,'interface language control must exist in the public language module')
assert.ok(outputControl>interfaceControl,'output language must follow interface language in natural source order')`
source=source.replace(oldLanguageOrder,newLanguageOrder)

const oldTester=`const tester=read('app/testen/page.js')+read('app/modules/tester/TesterPaused.js')
assert.match(tester,/TesterPaused/)
assert.match(tester,/Testerzugang vorübergehend geschlossen/)
assert.doesNotMatch(tester,/Kostenlos testen|start=register/)`
const newTester=`const tester=read('app/testen/page.js')+read('app/modules/tester/TesterGuide.js')
assert.match(tester,/TesterGuide/)
assert.match(tester,/synthetischen oder wirksam anonymisierten Testdaten/)
assert.match(tester,/genau ein Zurück-Element|Genau ein Sprachmenü/)
assert.doesNotMatch(tester,/Testerzugang vorübergehend geschlossen/)`
source=source.replace(oldTester,newTester)

const oldV50=`// V50 current-behavior guard
assert.match(publicLanding,/publicBackBtn/)
assert.match(publicLanding,/returnToPublicTop/)
assert.match(publicLanding,/data-output-language-status/)
assert.match(publicLanding,/publicNav\\.output/)
assert.match(switcher,/publicPicker=false/)
assert.match(switcher,/active\\.label/)
assert.match(switcher,/flagLanguageMenuBack/)
const currentCss=read('app/globals.css')
assert.match(currentCss,/\\.publicLanguageStack/)
assert.match(currentCss,/\\.flagLanguageMenu \\.flagLanguageMenuBack/)
const currentMicrophone=read('app/modules/public/ProblemNavigator.js')
assert.match(currentMicrophone,/window\\.SpeechRecognition\\|\\|window\\.webkitSpeechRecognition/)
assert.match(currentMicrophone,/navigator\\.permissions/)
assert.doesNotMatch(currentMicrophone,/getUserMedia/)
assert.match(currentMicrophone,/rec\\.onaudiostart/)
assert.match(currentMicrophone,/aria-live=\"polite\"/)
const currentExplainer=read('app/modules/public/ExplainerVideo.js')
assert.match(currentExplainer,/as-gold-explainer-de-female\\.mp4/)
assert.match(currentExplainer,/as-gold-explainer-de-male\\.mp4/)`
const newV50=`// V50 current-behavior guard, expressed through the V51–V56 modular owners
assert.match(publicLanding,/PublicLanguageModules/)
assert.match(publicLanguageModules,/publicBackButton/)
assert.match(publicLanguageModules,/data-output-language-status/)
assert.match(publicLanguageModules,/outputCustomerButton/)
assert.match(switcher,/active\\.label/)
assert.match(switcher,/flagLanguageMenuBack/)
const currentCss=read('app/globals.css')
assert.match(currentCss,/\\.publicLanguageModules/)
assert.match(currentCss,/\\.flagLanguageMenu \\.flagLanguageMenuBack/)
assert.match(currentCss,/\\.publicTop\\{position:relative;top:auto\\}/)
const currentMicrophone=read('app/modules/public/ProblemNavigator.js')
assert.match(currentMicrophone,/window\\.SpeechRecognition\\|\\|window\\.webkitSpeechRecognition/)
assert.match(currentMicrophone,/navigator\\.permissions/)
assert.doesNotMatch(currentMicrophone,/getUserMedia/)
assert.match(currentMicrophone,/\\.onaudiostart/)
assert.match(currentMicrophone,/data-problem-voice/)
assert.match(currentMicrophone,/data-customer-language/)
assert.match(currentMicrophone,/aria-live=\"polite\"/)
const currentExplainer=read('app/modules/public/ExplainerVideo.js')
assert.match(currentExplainer,/as-gold-explainer-de-female\\.mp4/)
assert.match(currentExplainer,/as-gold-explainer-de-male\\.mp4/)`
source=source.replace(oldV50,newV50)

const marker="console.log('V46 modular-boundary guard passed: thin root entry, extracted public/auth/workspace surfaces, domain-owned catalogs and services, direct output-language flow, single language-menu back control, tester lock and thin compatibility adapters verified.')"
if(source.includes(marker)&&!source.includes('V46 final protected surface boundaries')){
  const finalAssertions=`\nfor(const path of [\n  'app/modules/workspace/DashboardSurface.js',\n  'app/modules/cases/WorkspaceCaseSurfaces.js',\n  'app/modules/cases/ApprovalsSurface.js',\n  'app/modules/documents/DocumentsSurface.js',\n  'app/modules/pricing/UpgradePanel.js',\n  'app/modules/compliance/AccountControlPanel.js'\n]) exists(path)\nassert.match(workspace,/DashboardSurface/)\nassert.match(workspace,/CasesSurface/)\nassert.match(workspace,/ClientsSurface/)\nassert.match(workspace,/DocumentsSurface/)\nassert.match(workspace,/ApprovalsSurface/)\nassert.doesNotMatch(workspace,/className=\\"accountControl\\"/,'account-control presentation belongs to compliance module')\nassert.doesNotMatch(workspace,/className=\\"detailCard upgradeBox\\"/,'upgrade presentation belongs to pricing module')\nassert.match(read('app/modules/compliance/AccountControlPanel.js'),/accountControl/)\nassert.match(read('app/modules/pricing/UpgradePanel.js'),/PromoCodeControl/)\nassert.match(read('app/modules/workspace/DashboardSurface.js'),/AccountControlPanel/)\nassert.match(read('app/modules/workspace/DashboardSurface.js'),/UpgradePanel/)\nconsole.log('V46 final protected surface boundaries verified: dashboard, cases, clients, documents, approvals, pricing and compliance presentation are explicitly owned.')\n`
  source=source.replace(marker,finalAssertions+'\n'+marker)
}
source=source.replace('tester lock and thin compatibility adapters verified.','reopened safe tester guide and thin compatibility adapters verified.')
fs.writeFileSync(path,source)
console.log('V46 final surface guard alignment and V51–V56 parity applied.')
