import { composeBilingualLetter } from '../language/bilingualLetter.mjs'

export function approvalDefaultsForDocument(document={},outputLanguage='de'){
  return {caseId:document.case_id||'',documentId:document.id||'',recipient:document.response_recipient||'',subject:document.response_subject||document.title||'',body:composeBilingualLetter(document,outputLanguage)}
}
