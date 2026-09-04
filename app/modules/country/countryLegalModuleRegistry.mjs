import { COUNTRY_CATALOG, countryByKey, normalizeCountryContext } from './countryRegistry.mjs'

export const COUNTRY_LEGAL_MODULE_VERSION='v84'

export const COUNTRY_LEGAL_STATUSES=Object.freeze([
  'setup_required',
  'source_review',
  'baseline_review',
  'ready',
  'suspended'
])

export const COUNTRY_LEGAL_CHECK_TYPES=Object.freeze(['baseline','delta'])

export const COUNTRY_LEGAL_REQUIRED_SOURCE_GROUPS=Object.freeze([
  'official_sources',
  'court_sources',
  'authority_sources'
])

export const COUNTRY_LEGAL_MODULES=Object.freeze(
  COUNTRY_CATALOG.map(country=>Object.freeze({
    country_code:country.key,
    label:country.label,
    jurisdiction_label:country.jurisdictionLabel,
    default_locale:country.defaultLocale,
    source_groups:[...COUNTRY_LEGAL_REQUIRED_SOURCE_GROUPS],
    check_types:[...COUNTRY_LEGAL_CHECK_TYPES],
    owner_first:true,
    may_auto_publish:false,
    may_auto_implement:false
  }))
)

export function countryLegalModuleByCode(code){
  const country=countryByKey(normalizeCountryContext(code))
  return COUNTRY_LEGAL_MODULES.find(module=>module.country_code===country.key)||COUNTRY_LEGAL_MODULES[0]
}

export function createCountryLegalModuleDraft(code){
  const module=countryLegalModuleByCode(code)
  return {
    country_code:module.country_code,
    jurisdiction_label:module.jurisdiction_label,
    status:'setup_required',
    official_sources:[],
    court_sources:[],
    authority_sources:[],
    covered_topics:[],
    affected_workflows:[],
    baseline_checked_at:null,
    delta_checked_at:null,
    next_delta_due_at:null,
    source_reviewed_at:null,
    notes:''
  }
}

export function validateCountryLegalModule(record={}){
  const countryCode=normalizeCountryContext(record.country_code)
  if(countryCode!==String(record.country_code||'').toUpperCase()) throw new Error('Unsupported country module')
  if(!COUNTRY_LEGAL_STATUSES.includes(record.status)) throw new Error('Invalid country legal module status')
  for(const group of COUNTRY_LEGAL_REQUIRED_SOURCE_GROUPS){
    if(!Array.isArray(record[group])) throw new Error(`Invalid source group: ${group}`)
  }
  if(record.status==='ready'){
    for(const group of COUNTRY_LEGAL_REQUIRED_SOURCE_GROUPS){
      if(record[group].length===0) throw new Error(`Ready modules require verified ${group}`)
    }
    if(!record.source_reviewed_at||!record.baseline_checked_at) throw new Error('Ready modules require source review and baseline check')
  }
  return true
}

export function countryLegalCheckPlan(record,now=new Date()){
  validateCountryLegalModule(record)
  if(record.status==='suspended') return {action:'none',reason:'module_suspended'}
  if(!record.baseline_checked_at) return {action:'baseline',reason:'no_baseline'}
  if(!record.delta_checked_at) return {action:'delta',reason:'no_delta_check'}
  if(record.next_delta_due_at&&new Date(record.next_delta_due_at)<=now) return {action:'delta',reason:'delta_due'}
  return {action:'none',reason:'current'}
}

export function countryLegalModuleContract(){
  return {
    version:COUNTRY_LEGAL_MODULE_VERSION,
    countries:COUNTRY_LEGAL_MODULES.map(({country_code,jurisdiction_label})=>({country_code,jurisdiction_label})),
    statuses:[...COUNTRY_LEGAL_STATUSES],
    checks:[...COUNTRY_LEGAL_CHECK_TYPES],
    sourceGroups:[...COUNTRY_LEGAL_REQUIRED_SOURCE_GROUPS],
    ownerFirst:true,
    approvalFlow:'source setup -> owner source review -> baseline check -> owner acknowledgement -> ready -> recurring delta checks -> owner-first proposals'
  }
}
