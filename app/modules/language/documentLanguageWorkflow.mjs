import { LANGUAGE_CATALOG } from './languageRegistry.mjs'

// Central language/document contract for AS Workspace Gold.
// New languages inherit this workflow automatically through LANGUAGE_CATALOG.
// New workflow outputs are defined here once and guarded against backend drift.
export const DOCUMENT_LANGUAGE_WORKFLOW_VERSION='v2'

export const DOCUMENT_LANGUAGE_WORKFLOW_STEPS=Object.freeze([
  'original',
  'translation',
  'explanation',
  'next_step',
  'reference_copy',
  'customer_copy'
])

export const DOCUMENT_LANGUAGE_WORKFLOW_FIELDS=Object.freeze({
  original:'extracted_text',
  translation:'document_translation',
  explanation:'summary',
  next_step:'next_step',
  reference_copy:'reference_copy',
  customer_copy:'customer_copy'
})

export const DOCUMENT_LANGUAGE_WORKFLOW_LANGUAGES=Object.freeze(
  LANGUAGE_CATALOG.map(language=>Object.freeze({
    key:language.key,
    label:language.label,
    locale:language.locale,
    rtl:language.rtl
  }))
)

export function documentLanguageWorkflowLanguage(key){
  return DOCUMENT_LANGUAGE_WORKFLOW_LANGUAGES.find(language=>language.key===key)||DOCUMENT_LANGUAGE_WORKFLOW_LANGUAGES[0]
}

export function composeDocumentLanguageWorkflowSummary(result={},outputLanguage='de',referenceLanguage='de'){
  const language=documentLanguageWorkflowLanguage(outputLanguage)
  const reference=documentLanguageWorkflowLanguage(referenceLanguage)
  const referenceCopy=result.reference_copy||result.response_letter_de||''
  const sections=[]
  if(result.document_translation) sections.push(`ÜBERSETZUNG DES ORIGINALDOKUMENTS (${language.label})\n${result.document_translation}`)
  if(result.summary) sections.push(`ERKLÄRUNG FÜR DEN KUNDEN (${language.label})\n${result.summary}`)
  if(referenceCopy) sections.push(`REFERENZFASSUNG / REFERENCE VERSION (${reference.label})\n${referenceCopy}`)
  if(result.customer_copy) sections.push(`KUNDENKOPIE / ÜBERSETZUNG (${language.label})\n${result.customer_copy}`)
  return sections.join('\n\n────────────────────────\n\n')
}

export function mapDocumentLanguageWorkflowResult(result={},document={},outputLanguage='de',referenceLanguage='de'){
  const customerCopyLanguage=documentLanguageWorkflowLanguage(outputLanguage).key
  const referenceCopyLanguage=documentLanguageWorkflowLanguage(result.reference_language||referenceLanguage).key
  const referenceCopy=result.reference_copy||result.response_letter_de||''
  return {
    fields:{
      extracted_text:result.extracted_text||'',
      document_translation:result.document_translation||'',
      document_type:result.document_type||document.document_type||'',
      document_date:/^\d{4}-\d{2}-\d{2}$/.test(result.document_date||'')?result.document_date:(document.document_date||''),
      analysis_summary:composeDocumentLanguageWorkflowSummary(result,outputLanguage,referenceCopyLanguage)||result.summary||'',
      analysis_next_step:result.next_step||'',
      reference_copy:referenceCopy,
      reference_copy_language:referenceCopyLanguage,
      response_letter_de:referenceCopyLanguage==='de'?referenceCopy:'',
      customer_copy:result.customer_copy||'',
      customer_copy_language:customerCopyLanguage,
      response_recipient:result.response_recipient||result.sender_or_author||'',
      response_subject:result.response_subject||document.title||'',
      analysis_traffic_light:result.traffic_light||'yellow',
      analysis_reasoning:result.assessment_reasoning||result.summary||'',
      analysis_confidence:result.confidence||null
    },
    facts:{
      sender_or_author:result.sender_or_author||null,
      recipient:result.recipient||null,
      reference_numbers:Array.isArray(result.reference_numbers)?result.reference_numbers:[],
      deadlines:Array.isArray(result.deadlines)?result.deadlines:[],
      monetary_amounts:Array.isArray(result.monetary_amounts)?result.monetary_amounts:[],
      confidence:result.confidence||null
    }
  }
}

export function documentLanguageWorkflowContract(){
  return {
    version:DOCUMENT_LANGUAGE_WORKFLOW_VERSION,
    languages:DOCUMENT_LANGUAGE_WORKFLOW_LANGUAGES.map(language=>language.key),
    steps:[...DOCUMENT_LANGUAGE_WORKFLOW_STEPS],
    fields:{...DOCUMENT_LANGUAGE_WORKFLOW_FIELDS}
  }
}
