import { ApprovalSection } from './V25ApprovalWorkflow'
import { documentNavigationCopy } from '../documents/documentNavigationCopy.mjs'

export function ApprovalsSurface({a,approvalUi,language='de',outputLanguage,cases,documents,approvals,approvalDefaults,createApproval,setSelectedApproval,onBack,onReturnToDocument}){
  const sourceDocument=documents.find(item=>item.id===approvalDefaults?.documentId)
  const returnToDocument=sourceDocument&&onReturnToDocument?()=>onReturnToDocument(sourceDocument):undefined
  const returnLabel=documentNavigationCopy(language).backToDocument
  return <><div className="sectionHead"><button className="backBtn" data-persistent-back type="button" onClick={returnToDocument||onBack}>{returnToDocument?returnLabel:a.backOverview}</button><h2>{approvalUi.title}</h2></div><ApprovalSection copy={approvalUi} outputLanguage={outputLanguage} cases={cases} documents={documents} approvals={approvals} defaults={approvalDefaults} onCreate={createApproval} onSelect={setSelectedApproval} onCancel={returnToDocument} cancelLabel={returnLabel}/></>
}
