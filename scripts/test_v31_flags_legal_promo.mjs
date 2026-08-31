import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { supportedLanguages } from '../app/lib/v30Languages.mjs'
import { legalPageIds, legalShellCopy, legalTranslations } from '../app/lib/v31LegalTranslations.mjs'
import { privacyDashboardCopy, withdrawalCopy } from '../app/lib/v31InteractiveLegalTranslations.mjs'
import { promoTranslations } from '../app/lib/v31PromoTranslations.mjs'

const languageKeys=['de','en','fr','tr','pl','ru','ar','fa']
assert.deepEqual(supportedLanguages.map(item=>item.key),languageKeys)
for(const language of supportedLanguages){
  assert.ok(language.flags,`${language.key}: flag missing`)
  assert.ok(language.countryCodes?.length,`${language.key}: SVG country flag missing`)
  assert.ok(legalShellCopy[language.key],`${language.key}: legal shell missing`)
  assert.ok(withdrawalCopy[language.key],`${language.key}: withdrawal copy missing`)
  assert.ok(privacyDashboardCopy[language.key],`${language.key}: privacy controls missing`)
  assert.ok(promoTranslations[language.key],`${language.key}: promo copy missing`)
}
for(const key of ['en','ar','fa']) assert.ok(supportedLanguages.find(item=>item.key===key).flags.includes(' '),`${key}: multiple country flags expected`)
for(const key of ['en','ar','fa']) assert.equal(supportedLanguages.find(item=>item.key===key).countryCodes.length,2,`${key}: multiple SVG country flags expected`)
for(const language of languageKeys.filter(key=>key!=='de')){
  for(const pageId of legalPageIds){
    const page=legalTranslations[language]?.[pageId]
    assert.ok(page,`${language}/${pageId}: translation missing`)
    assert.ok(page.title?.trim()&&page.intro?.trim(),`${language}/${pageId}: heading copy missing`)
    assert.ok(page.sections?.length>0,`${language}/${pageId}: sections missing`)
    assert.ok(page.sections.every(section=>section.title?.trim()),`${language}/${pageId}: section title missing`)
  }
}

const migration=await readFile(new URL('../supabase/migrations/20260830203459_v31_secure_promo_codes.sql',import.meta.url),'utf8')
assert.match(migration,/create table if not exists private\.gold_promo_codes/i)
assert.match(migration,/extensions\.digest\(v_code,'sha256'\)/i)
assert.match(migration,/security definer/i)
assert.match(migration,/security invoker/i)
assert.match(migration,/'payment_enabled',false/i)
assert.match(migration,/revoke all on table private\.gold_promo_codes from public, anon, authenticated/i)
assert.doesNotMatch(migration,/insert\s+into\s+private\.gold_promo_codes/i,'No commercial promo code may be seeded')

const pageSource=await readFile(new URL('../app/page.js',import.meta.url),'utf8')
const switcherSource=await readFile(new URL('../app/components/LanguageSwitcher.js',import.meta.url),'utf8')
assert.match(pageSource,/p_promo_code/)
assert.match(pageSource,/LanguageSwitcher/)
assert.match(pageSource,/PromoCodeControl/)
assert.match(switcherSource,/country-flag-icons\/react\/3x2/)
assert.match(switcherSource,/FlagSet/)
console.log('V31 flags, legal translations and secure promo contract: OK')
