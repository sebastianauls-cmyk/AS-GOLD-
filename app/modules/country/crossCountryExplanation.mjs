import { countryByKey, normalizeCountryContext } from './countryRegistry.mjs'
import { languageByKey, isSupportedLanguage } from '../language/languageRegistry.mjs'
import { compareHomeCountryToTarget } from './homeCountryComparison.mjs'

export const CROSS_COUNTRY_EXPLANATION_VERSION='v89'

function normalizeLanguage(key){
  const value=String(key||'de').toLowerCase()
  return isSupportedLanguage(value)?value:'de'
}

export function buildCrossCountryExplanation({
  homeCountry,
  targetCountry,
  outputLanguage='de',
  homeRecord,
  targetRecord,
  topic=null
}){
  const home=countryByKey(normalizeCountryContext(homeCountry))
  const target=countryByKey(normalizeCountryContext(targetCountry))
  const language=languageByKey(normalizeLanguage(outputLanguage))
  const comparison=compareHomeCountryToTarget({homeCountry:home.key,targetCountry:target.key,homeRecord,targetRecord,topic})

  return {
    version:CROSS_COUNTRY_EXPLANATION_VERSION,
    home_country:{code:home.key,label:home.label,jurisdiction:home.jurisdictionLabel},
    target_country:{code:target.key,label:target.label,jurisdiction:target.jurisdictionLabel},
    output_language:{key:language.key,label:language.label,locale:language.locale,rtl:language.rtl},
    topic,
    overall:comparison.overall,
    same:comparison.same,
    different:comparison.different,
    unknown:comparison.unknown,
    rows:comparison.rows,
    explanation_contract:{
      lead:`Vergleiche das bekannte Rechtssystem ${home.label} mit dem Zielland ${target.label}.`,
      sections:['Was kenne ich aus meinem Heimatland?','Was ist im Zielland anders?','Was bedeutet das für mich?','Was muss ich dort anders machen?','Welche Quellen belegen das?'],
      translate_entire_explanation_to:language.key
    },
    rule:'Heimatland, Zielland und Ausgabesprache sind drei voneinander unabhängige Parameter. Ein Sprachwechsel darf weder Heimatland noch Zielland verändern. Rechtliche Unterschiede dürfen nur bei belastbar geprüfter Quellenlage als verifiziert dargestellt werden.'
  }
}

export function crossCountryExplanationContract(){
  return {
    version:CROSS_COUNTRY_EXPLANATION_VERSION,
    purpose:'Beliebiges Heimatland gegen beliebiges Zielland vergleichen und die Unterschiede in einer frei gewählten Ausgabesprache erklären.',
    independentParameters:['homeCountry','targetCountry','outputLanguage'],
    example:{homeCountry:'PL',targetCountry:'TR',outputLanguage:'pl'},
    ownerFirst:true
  }
}
