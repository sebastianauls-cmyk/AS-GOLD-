import { createPptxBlob, createXlsxBlob } from './officeExports'

function safeBase(value,fallback){
  return String(value||fallback).replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g,'_').slice(0,80)
}

export function buildWorkspaceExportRows({ref,data,copy}){
  const {ex,core,approvalUi}=copy
  const localStatus=value=>value==='open'?ex.open:value==='closed'?ex.closed:value||'—'
  const localLight=value=>value==='yellow'?'🟡 '+ex.yellow:value==='green'?'🟢 '+ex.green:value==='red'?'🔴 '+ex.red:value||'—'
  if(ref.kind==='document')return [[ex.documentTitle,''],[ex.document,ref.item.title||ex.document],[ex.documentType,ref.item.document_type||''],[ex.documentDate,ref.item.document_date||''],[ex.analysis,ref.item.analysis_summary||ex.noAnalysis],[ex.nextStep,ref.item.analysis_next_step||''],[ex.extracted,ref.item.extracted_text||'']]
  const caseDocuments=data.documents.filter(item=>item.case_id===ref.item.id)
  const caseAssessments=data.assessments.filter(item=>item.case_id===ref.item.id)
  const caseSources=data.sourceStatus.filter(item=>item.case_id===ref.item.id)
  const caseApprovals=data.approvals.filter(item=>item.case_id===ref.item.id)
  return [[ex.caseTitle,''],[ex.case,ref.item.title||ex.case],[ex.status,localStatus(ref.item.status)],[ex.traffic,localLight(ref.item.traffic_light)],[core.goal,ref.item.goal||''],[ex.summary,ref.item.summary||''],[core.deadline,ref.item.deadline_at?new Date(ref.item.deadline_at).toLocaleString():''],[core.nextAction,ref.item.next_action||''],[ex.documents,caseDocuments.map(item=>item.title).join(', ')||ex.none],[core.currentAssessments,caseAssessments.map(item=>localLight(item.traffic_light)+' · '+item.title+': '+(item.reasoning||'')+(item.next_step?' · '+core.nextAction+': '+item.next_step:'')).join('\n')||ex.none],[core.sourceBasis,caseSources.map(item=>(item.source_label||item.source_kind)+': '+item.status+(item.details?' · '+item.details:'')).join('\n')||ex.none],[approvalUi.title,caseApprovals.map(item=>(item.subject||item.approval_type)+' · '+(approvalUi[item.status]||item.status)+' · '+approvalUi.revision+' '+item.preview_revision).join('\n')||ex.none]]
}

export async function createWorkspaceExportArtifact({ref,type,data,copy}){
  const rows=buildWorkspaceExportRows({ref,data,copy})
  const base=safeBase(ref.item.title,ref.kind==='case'?'Fall':'Dokument')
  if(type==='docx'){
    const {Document,Packer,Paragraph,TextRun}=await import('docx')
    const children=rows.flatMap((row,index)=>index===0?[new Paragraph({children:[new TextRun({text:row[0],bold:true,size:32})]})]:[new Paragraph({children:[new TextRun({text:row[0]+': ',bold:true}),new TextRun(String(row[1]||''))]})])
    return {blob:await Packer.toBlob(new Document({sections:[{children}]})),filename:base+'.docx'}
  }
  if(type==='pdf'){
    const {jsPDF}=await import('jspdf');const pdf=new jsPDF();let y=18
    rows.forEach((row,index)=>{const line=index===0?row[0]:row[0]+': '+(row[1]||'');const split=pdf.splitTextToSize(String(line),175);if(y+7*split.length>280){pdf.addPage();y=18}pdf.setFont(undefined,index===0?'bold':'normal');pdf.text(split,18,y);y+=7*split.length+4})
    return {blob:pdf.output('blob'),filename:base+'.pdf'}
  }
  if(type==='xlsx')return {blob:await createXlsxBlob(rows),filename:base+'.xlsx'}
  if(type==='pptx')return {blob:await createPptxBlob(rows),filename:base+'.pptx'}
  if(type==='csv'){const quote=value=>'"'+String(value??'').replace(/"/g,'""')+'"';return {blob:new Blob(['\uFEFF'+rows.map(row=>row.map(quote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),filename:base+'.csv'}}
  if(type==='txt')return {blob:new Blob([rows.map((row,index)=>index===0?row[0]:row[0]+': '+(row[1]||'')).join('\r\n\r\n')],{type:'text/plain;charset=utf-8'}),filename:base+'.txt'}
  throw new Error('Unsupported export format: '+type)
}

export function createAccountDataArtifact(payload){
  return {blob:new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),filename:'AS_Gold_Datenexport_'+new Date().toISOString().slice(0,10)+'.json'}
}

export function downloadExportArtifact({blob,filename}){
  const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();URL.revokeObjectURL(url)
}
