export const CASE_LEGAL_COMPARISON_VERSION='v131'

export const CASE_LEGAL_COMPARISON_TOPICS=Object.freeze([
  'applicable_law_jurisdiction',
  'contract_consumer',
  'employment',
  'rent_property',
  'claims_payments',
  'insurance',
  'administrative_social',
  'travel_residence',
  'data_protection',
  'other'
])

export const CASE_LEGAL_COMPARISON_LIGHTS=Object.freeze({
  green:Object.freeze({key:'green',symbol:'🟢'}),
  yellow:Object.freeze({key:'yellow',symbol:'🟡'}),
  red:Object.freeze({key:'red',symbol:'🔴'}),
  white:Object.freeze({key:'white',symbol:'⚪'})
})

const safeStatus=new Set(['same','different','risk','unclear'])
const safeConfidence=new Set(['high','medium','low'])

export function safeLegalSourceUrl(value){
  try{
    const url=new URL(String(value||''))
    return url.protocol==='https:'&&!url.username&&!url.password?url.href:null
  }catch{return null}
}

function strings(value){return Array.isArray(value)?value.map(String).map(item=>item.trim()).filter(Boolean):[]}
function sourceUrls(value){return strings(value).map(safeLegalSourceUrl).filter(Boolean)}
function side(value={}){return {explanation:String(value?.explanation||''),source_urls:sourceUrls(value?.source_urls)}}

export function normalizeCaseLegalComparisonRecord(record={}){
  const payload=record?.result&&typeof record.result==='object'?record.result:{}
  const sources=(Array.isArray(record?.sources)?record.sources:Array.isArray(payload.sources)?payload.sources:[])
    .map(source=>({
      title:String(source?.title||source?.url||''),
      url:safeLegalSourceUrl(source?.url),
      publisher:String(source?.publisher||''),
      country:String(source?.country||''),
      source_type:String(source?.source_type||'other')
    }))
    .filter(source=>source.url)
  const allowedUrls=new Set(sources.map(source=>source.url))
  const keepKnown=urls=>urls.filter(url=>allowedUrls.has(url))
  const rows=(Array.isArray(payload.rows)?payload.rows:[]).map(row=>{
    const home=side(row?.home)
    const target=side(row?.target)
    const normalizedHome={...home,source_urls:keepKnown(home.source_urls)}
    const normalizedTarget={...target,source_urls:keepKnown(target.source_urls)}
    const complete=normalizedHome.source_urls.length>0&&normalizedTarget.source_urls.length>0
    return {
      issue:String(row?.issue||''),
      difference_status:complete&&safeStatus.has(row?.difference_status)?row.difference_status:'unclear',
      home:normalizedHome,
      target:normalizedTarget,
      practical_meaning:String(row?.practical_meaning||''),
      confidence:complete&&safeConfidence.has(row?.confidence)?row.confidence:'low'
    }
  })
  const applicabilitySources=keepKnown(sourceUrls(payload?.applicable_law?.source_urls))
  const applicabilityMissingFactors=strings(payload?.applicable_law?.missing_factors)
  const applicabilityProposedStatus=applicabilitySources.length&&['known','likely'].includes(payload?.applicable_law?.status)?payload.applicable_law.status:'unclear'
  const applicability={
    status:applicabilityProposedStatus==='known'&&applicabilityMissingFactors.length?'likely':applicabilityProposedStatus,
    explanation:String(payload?.applicable_law?.explanation||''),
    missing_factors:applicabilityMissingFactors,
    source_urls:applicabilitySources
  }
  const completeRows=rows.filter(row=>row.home.source_urls.length>0&&row.target.source_urls.length>0)
  const hasRisk=completeRows.some(row=>row.difference_status==='risk')
  const hasDifference=completeRows.some(row=>row.difference_status==='different')
  const hasGap=completeRows.length<rows.length||rows.some(row=>row.difference_status==='unclear')||applicability.status==='unclear'
  const light=completeRows.length===0?CASE_LEGAL_COMPARISON_LIGHTS.white:hasRisk?CASE_LEGAL_COMPARISON_LIGHTS.red:hasGap||hasDifference?CASE_LEGAL_COMPARISON_LIGHTS.yellow:CASE_LEGAL_COMPARISON_LIGHTS.green
  return {
    id:record?.id||null,
    title:String(payload.title||''),
    light,
    overall_summary:String(payload.overall_summary||''),
    applicable_law:applicability,
    rows,
    open_questions:strings(payload.open_questions),
    next_steps:strings(payload.next_steps),
    customer_explanation:String(payload.customer_explanation||''),
    professional_review_required:true,
    sources,
    source_checked_at:record?.source_checked_at||null,
    created_at:record?.created_at||null
  }
}

export function caseLegalComparisonContract(){
  return {
    version:CASE_LEGAL_COMPARISON_VERSION,
    scope:'case-specific home-country versus target-country legal research overview',
    topics:[...CASE_LEGAL_COMPARISON_TOPICS],
    required_sections:['applicable_law','rows','customer_explanation','open_questions','next_steps','sources'],
    rules:{
      official_sources_only:true,
      visible_clickable_sources:true,
      home_country_is_not_automatically_applicable_law:true,
      target_country_is_not_automatically_applicable_law:true,
      unsupported_claims_become_unknown:true,
      professional_review_required:true,
      output_language_independent:true
    }
  }
}
