import assert from 'node:assert/strict'
import fs from 'node:fs'

const workspace=fs.readFileSync(new URL('../app/modules/workspace/WorkspaceApp.js',import.meta.url),'utf8')
const publicPath=new URL('../app/modules/public/PublicLanding.js',import.meta.url)
const publicSurface=fs.existsSync(publicPath)?fs.readFileSync(publicPath,'utf8'):workspace
const pageEntry=fs.readFileSync(new URL('../app/page.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
const legacyPath=new URL('../app/components/V44LanguageOrder.js',import.meta.url)

const publicStart=publicSurface.indexOf('return <>')
const interfaceControl=publicSurface.indexOf('<LanguageSwitcher value={language} onChange={setLanguage} label={t.language} publicPicker',publicStart)
const outputControl=publicSurface.indexOf('<LanguageSwitcher value={outputLanguage} onChange={setOutputLanguage} label={t.outputLanguage}/>',publicStart)

assert.match(pageEntry,/modules\/workspace\/WorkspaceApp/,'root page must delegate to workspace module')
assert.ok(publicStart>=0,'public surface must exist in the public module or pre-extraction workspace')
assert.ok(interfaceControl>publicStart,'public interface-language control must exist')
assert.ok(outputControl>interfaceControl,'public output-language control must follow interface-language control in source order')
assert.doesNotMatch(layout,/V44LanguageOrder/,'legacy V44 DOM rearranger must not be mounted')
assert.equal(fs.existsSync(legacyPath),false,'legacy V44 DOM rearranger must be removed after modular replacement')
console.log('V44 replacement guard passed: interface language naturally precedes output language in the modular public React source; DOM rearranger is removed.')
