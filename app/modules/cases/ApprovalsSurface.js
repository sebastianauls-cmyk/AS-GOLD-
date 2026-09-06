import { ApprovalSection } from './V25ApprovalWorkflow'

export function ApprovalsSurface({a,approvalUi,outputLanguage,cases,documents,approvals,approvalDefaults,createApproval,setSelectedApproval,onBack}){
  return <><div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{approvalUi.title}</h2></div><ApprovalSection copy={approvalUi} outputLanguage={outputLanguage} cases={cases} documents={documents} approvals={approvals} defaults={approvalDefaults} onCreate={createApproval} onSelect={setSelectedApproval}/></>
}
