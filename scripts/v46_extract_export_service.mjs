import fs from 'node:fs'

const workspacePath='app/modules/workspace/WorkspaceApp.js'
let source=fs.readFileSync(workspacePath,'utf8')

function ensureImport(anchor,line){
  if(source.includes(line))return
  if(!source.includes(anchor))throw new Error(`import anchor missing: ${anchor}`)
  source=source.replace(anchor,`${anchor}\n${line}`)
}
function replaceFunction(startName,nextName,replacement){
  const startCandidates=[`  async function ${startName}`,`  function ${startName}`]
  const startIndexes=startCandidates.map(token=>source.indexOf(token)).filter(index=>index>=0)
  const startIndex=startIndexes.length?Math.min(...startIndexes):-1
  const nextCandidates=[source.indexOf(`\n  async function ${nextName}`,startIndex),source.indexOf(`\n  function ${nextName}`,startIndex)].filter(index=>index>=0)
  const nextIndex=nextCandidates.length?Math.min(...nextCandidates):-1
  if(startIndex<0||nextIndex<0)throw new Error(`Could not isolate ${startName}`)
  source=source.slice(0,startIndex)+replacement+source.slice(nextIndex)
}

fs.writeFileSync('app/modules/services/exportService.js',`import { createPptxBlob, createXlsxBlob } from './officeExports'\n\nfunction safeBase(value,fallback){\n  return String(value||fallback).replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g,'_').slice(0,80)\n}\n\nexport function buildWorkspaceExportRows({ref,data,copy}){\n  const {ex,core,approvalUi}=copy\n  const localStatus=value=>value==='open'?ex.open:value==='closed'?ex.closed:value||'—'\n  const localLight=value=>value==='yellow'?\\`🟡 \\${ex.yellow}\\`:value==='green'?\\`🟢 \\${ex.green}\\`:value==='red'?\\`🔴 \\${ex.red}\\`:value||'—'\n  if(ref.kind==='document')return [[ex.documentTitle,''],[ex.document,ref.item.title||ex.document],[ex.documentType,ref.item.document_type||''],[ex.documentDate,ref.item.document_date||''],[ex.analysis,ref.item.analysis_summary||ex.noAnalysis],[ex.nextStep,ref.item.analysis_next_step||''],[ex.extracted,ref.item.extracted_text||'']]\n  const caseDocuments=data.documents.filter(item=>item.case_id===ref.item.id)\n  const caseAssessments=data.assessments.filter(item=>item.case_id===ref.item.id)\n  const caseSources=data.sourceStatus.filter(item=>item.case_id===ref.item.id)\n  const caseApprovals=data.approvals.filter(item=>item.case_id===ref.item.id)\n  return [[ex.caseTitle,''],[ex.case,ref.item.title||ex.case],[ex.status,localStatus(ref.item.status)],[ex.traffic,localLight(ref.item.traffic_light)],[core.goal,ref.item.goal||''],[ex.summary,ref.item.summary||''],[core.deadline,ref.item.deadline_at?new Date(ref.item.deadline_at).toLocaleString():''],[core.nextAction,ref.item.next_action||''],[ex.documents,caseDocuments.map(item=>item.title).join(', ')||ex.none],[core.currentAssessments,caseAssessments.map(item=>\\`\\${localLight(item.traffic_light)} · \\${item.title}: \\${item.reasoning||''}\\${item.next_step?\\` · \\${core.nextAction}: \\${item.next_step}\\`:''}\\`).join('\\n')||ex.none],[core.sourceBasis,caseSources.map(item=>\\`\\${item.source_label||item.source_kind}: \\${item.status}\\${item.details?\\` · \\${item.details}\\`:''}\\`).join('\\n')||ex.none],[approvalUi.title,caseApprovals.map(item=>\\`\\${item.subject||item.approval_type} · \\${approvalUi[item.status]||item.status} · \\${approvalUi.revision} \\${item.preview_revision}\\`).join('\\n')||ex.none]]\n}\n\nexport async function createWorkspaceExportArtifact({ref,type,data,copy}){\n  const rows=buildWorkspaceExportRows({ref,data,copy})\n  const base=safeBase(ref.item.title,ref.kind==='case'?'Fall':'Dokument')\n  if(type==='docx'){\n    const {Document,Packer,Paragraph,TextRun}=await import('docx')\n    const children=rows.flatMap((row,index)=>index===0?[new Paragraph({children:[new TextRun({text:row[0],bold:true,size:32})]})]:[new Paragraph({children:[new TextRun({text:\\`\\${row[0]}: \\`,bold:true}),new TextRun(String(row[1]||''))]})])\n    return {blob:await Packer.toBlob(new Document({sections:[{children}]})),filename:\\`\\${base}.docx\\`}\n  }\n  if(type==='pdf'){\n    const {jsPDF}=await import('jspdf');const pdf=new jsPDF();let y=18\n    rows.forEach((row,index)=>{const line=index===0?row[0]:\\`\\${row[0]}: \\${row[1]||''}\\`;const split=pdf.splitTextToSize(String(line),175);if(y+7*split.length>280){pdf.addPage();y=18}pdf.setFont(undefined,index===0?'bold':'normal');pdf.text(split,18,y);y+=7*split.length+4})\n    return {blob:pdf.output('blob'),filename:\\`\\${base}.pdf\\`}\n  }\n  if(type==='xlsx')return {blob:await createXlsxBlob(rows),filename:\\`\\${base}.xlsx\\`}\n  if(type==='pptx')return {blob:await createPptxBlob(rows),filename:\\`\\${base}.pptx\\`}\n  if(type==='csv'){const quote=value=>\\`"\\${String(value??'').replace(/"/g,'""')}"\\`;return {blob:new Blob(['\\uFEFF'+rows.map(row=>row.map(quote).join(';')).join('\\r\\n')],{type:'text/csv;charset=utf-8'}),filename:\\`\\${base}.csv\\`}}\n  if(type==='txt')return {blob:new Blob([rows.map((row,index)=>index===0?row[0]:\\`\\${row[0]}: \\${row[1]||''}\\`).join('\\r\\n\\r\\n')],{type:'text/plain;charset=utf-8'}),filename:\\`\\${base}.txt\\`}\n  throw new Error(\\`Unsupported export format: \\${type}\\`)\n}\n\nexport function createAccountDataArtifact(payload){\n  return {blob:new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),filename:\\`AS_Gold_Datenexport_\\${new Date().toISOString().slice(0,10)}.json\\`}\n}\n\nexport function downloadExportArtifact({blob,filename}){\n  const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();URL.revokeObjectURL(url)\n}\n`)

const anchor="import { getAuthSession, registerTestAccount, sendPasswordReset, signInSession, signOutSession, watchAuthState } from '../services/authRepository'"
ensureImport(anchor,"import { createAccountDataArtifact, createWorkspaceExportArtifact, downloadExportArtifact } from '../services/exportService'")

replaceFunction('doExport','exportMyData',`  async function doExport(ref,type){\n    if(!canExport(type)) return setMessage(n.exportLocked)\n    const ex=exportUi[outputLanguage]||exportUi.de\n    const outputCore=getV24Copy(outputLanguage)\n    const outputApprovalUi=getV25ApprovalCopy(outputLanguage)\n    try{\n      const artifact=await createWorkspaceExportArtifact({ref,type,data,copy:{ex,core:outputCore,approvalUi:outputApprovalUi}})\n      downloadExportArtifact(artifact)\n      const {error:exportLogError}=await recordExportEntry(supabase,{ref,type})\n      if(exportLogError) throw exportLogError\n      recordLocalAction('export_created')\n      const auditSaved=await recordServerAudit('export_created',{format:type.toUpperCase()},ref.kind,ref.item.id)\n      setMessage(auditSaved?\\`${'${a.export}: ${type.toUpperCase()} ✓'}\\`:\\`${'${a.export}: ${type.toUpperCase()} ✓ · ${sct.auditFailed}'}\\`)\n    } catch(err){ setMessage(\\`${'${a.export}: ${err.message}'}\\`) }\n  }\n`)

replaceFunction('exportMyData','downloadBlob',`  async function exportMyData(){\n    const packageData={\n      product:'AS Gold',\n      exported_at:new Date().toISOString(),\n      account:{email:user?.email||null,user_id:user?.id||null},\n      access:{tier:currentTier,plan:currentPlan.name,status:access?.status||null,active:!!access?.active,payment:'disabled'},\n      privacy_settings:privacySettings,\n      retention_note:a.pauseInfo,\n      data:{cases:data.cases,clients:data.clients,documents:data.documents,assessments:data.assessments,source_status:data.sourceStatus,approvals:data.approvals}\n    }\n    downloadExportArtifact(createAccountDataArtifact(packageData))\n    recordLocalAction('account_data_export')\n    await recordServerAudit('account_data_export',{format:'JSON'},'account',null)\n    setMessage(\\`${'${lt.dataExport} ✓'}\\`)\n  }\n`)

const downloadStart=source.indexOf('  function downloadBlob(')
if(downloadStart>=0){
  const next=source.indexOf('\n\n  function handleQuickAction',downloadStart)
  if(next<0)throw new Error('downloadBlob next anchor missing')
  source=source.slice(0,downloadStart)+source.slice(next+2)
}
fs.writeFileSync(workspacePath,source)

const guardPath='scripts/test_v46_modular_boundaries.mjs'
let guard=fs.readFileSync(guardPath,'utf8')
const marker="console.log('V46 export service boundary verified.')"
if(!guard.includes(marker)){
  guard += `\nexists('app/modules/services/exportService.js')\nconst exportService=read('app/modules/services/exportService.js')\nassert.match(workspace,/createWorkspaceExportArtifact/)\nassert.match(exportService,/Packer\.toBlob/)\nassert.match(exportService,/jsPDF/)\nassert.match(exportService,/createXlsxBlob/)\nassert.match(exportService,/createPptxBlob/)\nassert.ok(!workspace.includes("await import('docx')"),'workspace controller must not generate DOCX directly')\nassert.ok(!workspace.includes("await import('jspdf')"),'workspace controller must not generate PDF directly')\nassert.ok(!workspace.includes("document.createElement('a')"),'workspace controller must not own browser download DOM')\nconsole.log('V46 export service boundary verified.')\n`
  fs.writeFileSync(guardPath,guard)
}
const readmePath='app/modules/README.md'
let readme=fs.readFileSync(readmePath,'utf8')
const note='- `services/exportService.js`: workspace and account export artifact generation/download is isolated from WorkspaceApp; the controller only applies permissions, audit logging and user feedback.'
if(!readme.includes(note))fs.writeFileSync(readmePath,`${readme}\n${note}\n`)
console.log('V46 export service extraction applied')
