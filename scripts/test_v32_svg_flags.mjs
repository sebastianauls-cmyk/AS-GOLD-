import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as countryFlags from 'country-flag-icons/react/3x2'
import { supportedLanguages } from '../app/lib/v30Languages.mjs'

const expectedCountryCodes={
  de:['DE'],
  en:['GB','US'],
  fr:['FR'],
  tr:['TR'],
  pl:['PL'],
  ru:['RU'],
  ar:['SA','AE'],
  fa:['IR','AF']
}

for(const language of supportedLanguages){
  assert.deepEqual(language.countryCodes,expectedCountryCodes[language.key],`${language.key}: wrong SVG flag assignment`)
  for(const countryCode of language.countryCodes){
    const CountryFlag=countryFlags[countryCode]
    assert.equal(typeof CountryFlag,'function',`${countryCode}: SVG component missing`)
    assert.match(renderToStaticMarkup(React.createElement(CountryFlag,{title:countryCode})),/^<svg\b/,`${countryCode}: SVG render failed`)
  }
}

const switcherSource=await readFile(new URL('../app/components/LanguageSwitcher.js',import.meta.url),'utf8')
const pageSource=await readFile(new URL('../app/page.js',import.meta.url),'utf8')
assert.match(switcherSource,/country-flag-icons\/react\/3x2/)
assert.match(switcherSource,/flagIconSet/)
assert.match(pageSource,/label=\{t\.outputLanguage\} showLabel/)

console.log('V32 SVG-Flaggen: 8 Sprachen und 11 Landesflaggen erfolgreich geprüft.')
