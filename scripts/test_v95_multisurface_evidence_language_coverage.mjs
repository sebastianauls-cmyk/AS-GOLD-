import assert from 'node:assert/strict'
import fs from 'node:fs'
import { LANGUAGE_CATALOG } from '../app/modules/language/languageRegistry.mjs'

const panelPath=new URL('../app/modules/intelligence/EvidenceActionPanel.js',import.meta.url)
const injectorPath=new URL('../app/modules/intelligence/ContextEvidenceInjector.js',import.meta.url)
const shellPath=new URL('../app/modules/workspace/ProtectedWorkspaceShell.js',import.meta.url)

const panel=fs.readFileSync(panelPath,'utf8')
const injector=fs.readFileSync(injectorPath,'utf8')
const shell=fs.readFileSync(shellPath,'utf8')

for(const language of LANGUAGE_CATALOG){
  assert.match(panel,new RegExp(`\\b${language.key}:\\{`),`EvidenceActionPanel missing ${language.key}`)
  assert.match(injector,new RegExp(`\\b${language.key}:\\{`),`ContextEvidenceInjector missing ${language.key}`)
}

for(const dot of ['🟢','🟡','🔴','⚪']) assert.ok(panel.includes(dot),`Missing traffic-light dot ${dot}`)
assert.ok(injector.includes("case:'.caseTitleRow'"),'Case evidence selector missing')
assert.ok(injector.includes("document:'.documentReviewHead'"),'Document evidence selector missing')
assert.ok(injector.includes("comparison:'.countryComparison, .countryComparisonPanel, [data-country-comparison]'"),'Country comparison evidence selector missing')
assert.ok(injector.includes('buildEvidenceActionResult'),'Evidence layer is not connected')
assert.ok(injector.includes("from('country_legal_modules')"),'Country legal source lookup missing')
assert.ok(shell.includes('<ContextEvidenceInjector language={language} countryCode={countryContext}/>'),'Workspace shell does not activate evidence injector')
console.log(`V95 multi-surface evidence guard passed for ${LANGUAGE_CATALOG.length} languages.`)
