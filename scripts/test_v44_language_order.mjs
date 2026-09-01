import assert from 'node:assert/strict'
import fs from 'node:fs'

const page=fs.readFileSync(new URL('../app/page.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
const legacy=fs.readFileSync(new URL('../app/components/V44LanguageOrder.js',import.meta.url),'utf8')

const publicStart=page.indexOf('return <>')
const interfaceControl=page.indexOf('<LanguageSwitcher value={language} onChange={setLanguage} label={t.language}/>',publicStart)
const outputControl=page.indexOf('<LanguageSwitcher value={outputLanguage} onChange={setOutputLanguage} label={t.outputLanguage}/>',publicStart)

assert.ok(publicStart>=0,'public surface must exist')
assert.ok(interfaceControl>publicStart,'public interface-language control must exist')
assert.ok(outputControl>interfaceControl,'public output-language control must follow interface-language control in source order')
assert.doesNotMatch(layout,/V44LanguageOrder/,'legacy V44 DOM rearranger must not be mounted')
assert.match(legacy,/MutationObserver|prepend\(stack\)/,'legacy file remains traceable until final cleanup but must stay unmounted')
console.log('V44 replacement guard passed: interface language naturally precedes output language in React source; DOM rearranger is unmounted.')
