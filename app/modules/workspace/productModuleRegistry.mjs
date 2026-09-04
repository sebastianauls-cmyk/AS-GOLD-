// Central registry for AS Workspace Gold product modules.
// Every new product module must be registered here so country/legal checks,
// comparison guards and continuous-improvement monitoring inherit it automatically.
export const PRODUCT_MODULE_REGISTRY_VERSION='v86'

export const PRODUCT_MODULES=Object.freeze([
  {key:'cases',label:'Fälle',legal_relevance:true},
  {key:'documents',label:'Dokumente',legal_relevance:true},
  {key:'deadlines',label:'Fristen',legal_relevance:true},
  {key:'assessments',label:'Analysen / Ampel',legal_relevance:true},
  {key:'approvals',label:'Freigaben',legal_relevance:true},
  {key:'exports',label:'Exporte / Übergabe',legal_relevance:true},
  {key:'language_workflow',label:'Sprach- und Übersetzungsworkflow',legal_relevance:false},
  {key:'country_context',label:'Land / Rechtsraum',legal_relevance:true},
  {key:'country_legal',label:'Länderrechtsprüfung',legal_relevance:true},
  {key:'country_comparison',label:'Ländervergleich',legal_relevance:true},
  {key:'legal_monitor',label:'Rechtsprechungs- und Rechtsänderungsmonitor',legal_relevance:true},
  {key:'competitor_monitor',label:'Wettbewerbs- und Verbesserungsmonitor',legal_relevance:false},
  {key:'integrations',label:'Integrationen',legal_relevance:false},
  {key:'pricing',label:'Tarife / Upgrade',legal_relevance:true},
  {key:'privacy_compliance',label:'Datenschutz / Compliance',legal_relevance:true}
])

const keys=new Set(PRODUCT_MODULES.map(module=>module.key))

export const LEGALLY_RELEVANT_PRODUCT_MODULES=Object.freeze(
  PRODUCT_MODULES.filter(module=>module.legal_relevance)
)

export function productModuleByKey(key){
  return PRODUCT_MODULES.find(module=>module.key===key)||null
}

export function normalizeProductModuleKeys(values=[]){
  return [...new Set((Array.isArray(values)?values:[]).map(String).filter(key=>keys.has(key)))]
}

export function missingCountryModuleCoverage(countryRecord={}){
  const covered=new Set(normalizeProductModuleKeys(countryRecord.affected_workflows))
  return LEGALLY_RELEVANT_PRODUCT_MODULES.filter(module=>!covered.has(module.key))
}

export function productModuleRegistryContract(){
  return {
    version:PRODUCT_MODULE_REGISTRY_VERSION,
    modules:PRODUCT_MODULES.map(({key,label,legal_relevance})=>({key,label,legal_relevance})),
    rule:'Every new product module must be registered centrally. Legally relevant modules automatically become mandatory country-legal coverage dimensions.'
  }
}
