import assert from 'node:assert/strict'
import fs from 'node:fs'

const workspace=fs.readFileSync(new URL('../app/modules/workspace/WorkspaceApp.js',import.meta.url),'utf8')
const publicSurface=fs.readFileSync(new URL('../app/modules/public/PublicLanding.js',import.meta.url),'utf8')
const languageSurface=fs.readFileSync(new URL('../app/modules/public/PublicLanguageModules.js',import.meta.url),'utf8')
const pageEntry=fs.readFileSync(new URL('../app/page.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
const legacyPath=new URL('../app/components/V44LanguageOrder.js',import.meta.url)

const interfaceControl=languageSurface.indexOf('<LanguageSwitcher value={language} onChange={onLanguageChange}')
const outputControl=languageSurface.indexOf('<LanguageSwitcher value={outputLanguage} onChange={onOutputLanguageChange}')

assert.match(pageEntry,/modules\/workspace\/WorkspaceApp/,'root page must delegate to workspace module')
assert.match(publicSurface,/PublicLanguageModules/,'public landing must compose the language module directly')
assert.ok(interfaceControl>=0,'public interface-language control must exist in its owning module')
assert.ok(outputControl>interfaceControl,'public output-language control must follow interface-language control in source order')
assert.doesNotMatch(languageSurface,/MutationObserver|createPortal/,'language controls must render directly without DOM rearrangement')
assert.doesNotMatch(layout,/V44LanguageOrder/,'legacy V44 DOM rearranger must not be mounted')
assert.equal(fs.existsSync(legacyPath),false,'legacy V44 DOM rearranger must be removed after modular replacement')
assert.match(workspace,/PublicLanding/,'workspace must delegate the public surface instead of owning language markup')
console.log('V44 replacement guard passed: interface language naturally precedes customer/output language in the owning modular React component; DOM rearranger is removed.')
