import assert from 'node:assert/strict'
import { LANGUAGE_CATALOG } from '../app/modules/language/languageRegistry.mjs'
import { EVIDENCE_PANEL_COPY } from '../app/modules/intelligence/EvidenceActionPanel.js'

const keys=LANGUAGE_CATALOG.map(item=>item.key)
assert.equal(keys.length,11)
for(const key of keys){
  const copy=EVIDENCE_PANEL_COPY[key]
  assert.ok(copy,`missing evidence panel translation for ${key}`)
  for(const required of ['title','verified','review','source','confidence','meaning','next','gaps','noSources','noAction','noGaps','high','medium','low']){
    assert.ok(String(copy[required]||'').trim(),`${key} missing ${required}`)
  }
}
const source=await (await import('node:fs/promises')).readFile(new URL('../app/modules/intelligence/EvidenceActionPanel.js',import.meta.url),'utf8')
for(const dot of ['🟢','🟡','🔴','⚪']) assert.ok(source.includes(dot),`missing traffic-light dot ${dot}`)
assert.match(source,/rtl.*ar.*fa|ar.*fa.*rtl/s)
console.log('V95 multilingual evidence panel guard passed for all 11 languages.')
