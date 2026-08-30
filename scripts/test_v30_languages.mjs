import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { componentTranslations } from '../app/lib/v30ComponentTranslations.mjs'
import { outputLanguageNames, pageTranslations, rtlLanguages, supportedLanguages } from '../app/lib/v30Languages.mjs'

const require = createRequire(import.meta.url)
const parser = require('next/dist/compiled/babel/parser')
const languageKeys = supportedLanguages.map(item => item.key)

assert.deepEqual(languageKeys, ['de','en','fr','tr','pl','ru','ar','fa'])
assert.equal(new Set(languageKeys).size, languageKeys.length)
assert.equal(rtlLanguages.has('ar'), true)
assert.equal(rtlLanguages.has('fa'), true)
assert.equal(rtlLanguages.has('fr'), false)

for (const uiLanguage of languageKeys) {
  assert.ok(outputLanguageNames[uiLanguage], `Missing output-language labels for ${uiLanguage}`)
  assert.deepEqual(Object.keys(outputLanguageNames[uiLanguage]).sort(), [...languageKeys].sort())
}

function readCatalog(file, variableName) {
  const source = fs.readFileSync(file, 'utf8')
  const ast = parser.parse(source, { sourceType:'module', plugins:['jsx'] })
  for (const declaration of ast.program.body.filter(node => node.type === 'VariableDeclaration')) {
    for (const item of declaration.declarations) {
      if (item.id?.name !== variableName || !item.init) continue
      const expression = source.slice(item.init.start, item.init.end)
      return Function('confidenceLabels', `return (${expression})`)((high,medium,low)=>({hoch:high,high,mittel:medium,medium,mid:medium,niedrig:low,low}))
    }
  }
  throw new Error(`Catalog ${variableName} not found in ${file}`)
}

const legacyUiOutputKeys = new Set(['germanOutput','englishOutput','turkishOutput','polishOutput','russianOutput','arabicOutput'])

function placeholders(value) {
  if (typeof value !== 'string') return []
  return [...value.matchAll(/\{[^}]+\}/g)].map(match => match[0]).filter(token => token !== '{plural}').sort()
}

function assertTranslationShape(base, translation, path, ignoredKeys = new Set()) {
  if (Array.isArray(base)) {
    assert.ok(Array.isArray(translation), `${path} must be an array`)
    assert.equal(translation.length, base.length, `${path} array length differs`)
    base.forEach((item,index)=>assertTranslationShape(item,translation[index],`${path}[${index}]`,ignoredKeys))
    return
  }
  if (base && typeof base === 'object') {
    assert.ok(translation && typeof translation === 'object' && !Array.isArray(translation), `${path} must be an object`)
    for (const key of Object.keys(base)) {
      if (ignoredKeys.has(key)) continue
      assert.ok(Object.hasOwn(translation,key), `${path}.${key} is missing`)
      assertTranslationShape(base[key],translation[key],`${path}.${key}`,ignoredKeys)
    }
    return
  }
  assert.equal(typeof translation, typeof base, `${path} has the wrong value type`)
  assert.deepEqual(placeholders(translation), placeholders(base), `${path} does not preserve placeholders`)
}

const pageFile = new URL('../app/page.js', import.meta.url)
for (const [catalogName, translations] of Object.entries(pageTranslations)) {
  const baseCatalog = readCatalog(pageFile, catalogName)
  assert.ok(!Object.hasOwn(baseCatalog,'uk'), `${catalogName} still contains Ukrainian`)
  const ignored = catalogName === 'ui' ? legacyUiOutputKeys : new Set()
  assertTranslationShape(baseCatalog.en, translations.fr, `${catalogName}.fr`, ignored)
  assertTranslationShape(baseCatalog.en, translations.fa, `${catalogName}.fa`, ignored)
}

const componentChecks = [
  ['../app/components/V24Workspace.js','copy','workspaceCopy'],
  ['../app/components/V25ApprovalWorkflow.js','copy','approvalCopy'],
  ['../app/components/V26DocumentAnalysis.js','copy','analysisCopy'],
  ['../app/components/V28PrivacyControls.js','copy','privacyCopy'],
  ['../app/components/V28PrivacyControls.js','aiControlCopy','aiControlCopy'],
  ['../app/components/V29PasswordPolicy.js','copy','passwordCopy'],
  ['../app/components/LegalFooter.js','footerCopy','footerCopy']
]

for (const [relativeFile, variableName, translationName] of componentChecks) {
  const catalog = readCatalog(new URL(relativeFile, import.meta.url), variableName)
  assert.ok(!Object.hasOwn(catalog,'uk'), `${relativeFile}:${variableName} still contains Ukrainian`)
  assertTranslationShape(catalog.en,componentTranslations[translationName].fr,`${translationName}.fr`)
  assertTranslationShape(catalog.en,componentTranslations[translationName].fa,`${translationName}.fa`)
}

const activeSources = [
  '../app/page.js','../app/lib/v30Languages.mjs','../app/lib/v30ComponentTranslations.mjs',
  '../app/components/V24Workspace.js','../app/components/V25ApprovalWorkflow.js',
  '../app/components/V26DocumentAnalysis.js','../app/components/V28PrivacyControls.js',
  '../app/components/V29PasswordPolicy.js','../app/components/LegalFooter.js'
]

for (const relativeFile of activeSources) {
  const source = fs.readFileSync(new URL(relativeFile, import.meta.url),'utf8')
  assert.equal(/(?:\b|['"])uk(?:\b|['"])/.test(source),false,`${relativeFile} still references locale uk`)
  assert.equal(/[ІіЇїЄєҐґ]/.test(source),false,`${relativeFile} still contains Ukrainian copy`)
}

const globalCss = fs.readFileSync(new URL('../app/globals.css', import.meta.url),'utf8')
assert.match(globalCss,/html\[dir="rtl"\] input\[type="email"\].*direction:ltr/,'RTL email fields must isolate LTR identifiers')
assert.match(globalCss,/html\[dir="rtl"\] \.priceHead strong.*direction:ltr/,'RTL price values must remain LTR')

console.log('V30-Sprachen: 8 aktive Sprachen, FR vollständig, FA vollständig/RTL, UK entfernt.')
