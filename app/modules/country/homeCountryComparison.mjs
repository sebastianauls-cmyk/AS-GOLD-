import { countryByKey, normalizeCountryContext } from './countryRegistry.mjs'
import { compareCountryLegalModules } from './countryLegalComparison.mjs'

export const HOME_COUNTRY_COMPARISON_VERSION='v87'

export function compareHomeCountryToTarget({homeCountry='DE',targetCountry,homeRecord,targetRecord,topic=null}){
  const home=countryByKey(normalizeCountryContext(homeCountry))
  const target=countryByKey(normalizeCountryContext(targetCountry))
  if(home.key===target.key) return {
    version:HOME_COUNTRY_COMPARISON_VERSION,
    home_country:home,
    target_country:target,
    topic,
    overall:{key:'green',symbol:'🟢',label:'Grün'},
    summary:'Heimatland und Zielland sind identisch; es ist kein Länderunterschied zu erklären.',
    same:[],different:[],unknown:[],rows:[]
  }
  const technical=compareCountryLegalModules(homeRecord,targetRecord)
  const unknown=[]
  const same=[]
  const different=[]
  for(const row of technical.rows){
    if(row.key==='green') same.push({dimension:row.dimension,explanation:row.explanation})
    else if(row.key==='yellow') different.push({dimension:row.dimension,explanation:row.explanation,verified:false})
    else unknown.push({dimension:row.dimension,explanation:row.explanation,verified:false})
  }
  return {
    version:HOME_COUNTRY_COMPARISON_VERSION,
    home_country:{code:home.key,label:home.label,jurisdiction:home.jurisdictionLabel},
    target_country:{code:target.key,label:target.label,jurisdiction:target.jurisdictionLabel},
    topic,
    overall:technical.overall,
    same,
    different,
    unknown,
    rows:technical.rows,
    rule:'Das Modul erklärt bekannte Gemeinsamkeiten und Unterschiede aus Sicht des Heimatlands. Inhaltliche Rechtsunterschiede dürfen nur als verifiziert dargestellt werden, wenn beide Länderprofile hierfür mit belastbaren Quellen geprüft sind; andernfalls erscheint der Punkt als noch nicht verifiziert.'
  }
}

export function homeCountryComparisonContract(){
  return {
    version:HOME_COUNTRY_COMPARISON_VERSION,
    purpose:'Automatischer Vergleich: Was kenne ich aus meinem Heimatland und was ist im Zielland anders?',
    output:['same','different','unknown','traffic-light'],
    ownerFirst:true
  }
}
