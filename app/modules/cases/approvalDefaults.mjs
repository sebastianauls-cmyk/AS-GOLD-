export function approvalDefaultsForDocument(document={}){
  return {caseId:document.case_id||'',documentId:document.id||'',recipient:document.response_recipient||'',subject:document.response_subject||document.title||'',body:document.response_letter_de||''}
}
