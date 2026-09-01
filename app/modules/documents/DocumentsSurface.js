import { DocumentSection } from '../cases/V24Workspace'

export function DocumentsSurface({a,access,documents,core,v28,cases,documentMode,setDocumentMode,uploadCaseId,uploadDocument,uploading,allowedUploadAccept,setSelectedDocument,onBack}){
  return <><div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{a.sections.documents}</h2></div>{access?.app_role!=='owner'&&Number(access?.permissions?.document_limit||0)>0&&<p className="muted">{a.used.replace('{used}',documents.length).replace('{limit}',access.permissions.document_limit)}</p>}<DocumentSection copy={core} privacy={v28} cases={cases} documents={documents} mode={documentMode} setMode={setDocumentMode} defaultCaseId={uploadCaseId} onSubmit={uploadDocument} uploading={uploading} accept={allowedUploadAccept} onSelect={setSelectedDocument}/></>
}
