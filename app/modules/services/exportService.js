import { readableDocumentSummary } from '../language/documentLanguageWorkflow.mjs'
import { createTextPdf } from './textPdf.mjs'
import { assessmentEvidenceText } from '../cases/lib/assessmentEvidenceText.mjs'
import { OFFICE_EXPORT_RENDER_VERSION, createPptxBlob, createXlsxBlob } from './officeExportsUnicode.js'
import { normalizeOutputLanguage, outputLanguageLabels } from '../language/outputLanguage.js'
import { composeBilingualLetter } from '../language/bilingualLetter.mjs'
import { roadmapExportBlocks } from './customerRoadmapExport.mjs'

function safeBase(value,fallback){
  return String(value||fallback).replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g,'_').slice(0,80)
}

const outputLanguageFieldLabels={
  de:'Ausgabesprache',en:'Output language',fr:'Langue de sortie',tr:'Çıktı dili',pl:'Język wyjściowy',ru:'Язык вывода',ar:'لغة الإخراج',fa:'زبان خروجی',ro:'Limba de ieșire',bg:'Език на изхода',vi:'Ngôn ngữ đầu ra'
}

function trafficLightDot(value){
  const normalized=String(value||'').trim().toLowerCase()
  return normalized==='red'||normalized==='rot'?'🔴':normalized==='green'||normalized==='grün'||normalized==='gruen'?'🟢':normalized==='yellow'||normalized==='gelb'?'🟡':'⚪'
}

const DOCX_TRAFFIC_COLORS={'🟢':'2F855A','🟡':'D69E2E','🔴':'C53030','⚪':'94A3B8'}
const REQUIRED_OFFICE_EXPORT_RENDER_VERSION='v131-traffic-rich-runs'

function assertOfficeExportRenderer(){
  if(OFFICE_EXPORT_RENDER_VERSION!==REQUIRED_OFFICE_EXPORT_RENDER_VERSION){
    throw new Error(`Office export renderer mismatch: expected ${REQUIRED_OFFICE_EXPORT_RENDER_VERSION}, got ${OFFICE_EXPORT_RENDER_VERSION||'unknown'}`)
  }
}

function trafficMarker(line){
  const match=String(line).match(/(🟢|🟡|🔴|⚪)/)
  if(!match) return null
  return {symbol:match[1],text:String(line).replace(match[1],'').trim()}
}

function createDocxValueRuns(TextRun,value){
  const lines=String(value||'').split(/\r?\n/)
  const runs=[]
  lines.forEach((line,index)=>{
    const marker=trafficMarker(line)
    const breakCount=index?1:undefined
    if(marker){
      runs.push(new TextRun({text:'● ',color:DOCX_TRAFFIC_COLORS[marker.symbol],bold:true,break:breakCount}))
      runs.push(new TextRun({text:marker.text||'—'}))
    }else{
      runs.push(new TextRun({text:line||'—',break:breakCount}))
    }
  })
  return runs
}

async function createUnicodePdfBlob({rows,outputLanguage}){
  const blocks=rows.flatMap((row,index)=>index===0?[{text:String(row[0]),kind:'title'}]:[
    {text:String(row[0]),kind:'heading'},{text:String(row[1]||'—'),kind:'body'}])
  return createTextPdf({blocks,language:outputLanguage})
}

export function buildWorkspaceExportRows({ref,data,copy,outputLanguage='de',roadmap}){
  const {ex,core,approvalUi}=copy
  const language=normalizeOutputLanguage(outputLanguage)
  const languageLabel=outputLanguageFieldLabels[language]||outputLanguageFieldLabels.de
  const languageName=outputLanguageLabels[language]||outputLanguageLabels.de
  const languageRow=[languageLabel,languageName]
  const localStatus=value=>value==='open'?ex.open:value==='closed'?ex.closed:value||'—'
  const localLight=value=>{
    const normalized=String(value||'').trim().toLowerCase()
    const label=normalized==='yellow'||normalized==='gelb'?ex.yellow:normalized==='green'||normalized==='grün'||normalized==='gruen'?ex.green:normalized==='red'||normalized==='rot'?ex.red:value||'—'
    return trafficLightDot(value)+' '+label
  }
  if(ref.kind==='document')return [[ex.documentTitle,''],languageRow,[ex.document,ref.item.title||ex.document],[ex.documentType,ref.item.document_type||''],[ex.documentDate,ref.item.document_date||''],[ex.analysis,readableDocumentSummary(ref.item.analysis_summary,ref.item.extracted_text)||ex.noAnalysis],[ex.traffic,localLight(ref.item.analysis_traffic_light)],[ex.nextStep,ref.item.analysis_next_step||''],[ex.extracted,ref.item.extracted_text||''],[approvalUi.body,composeBilingualLetter(ref.item,ref.item.customer_copy_language||language)]]
  const caseDocuments=data.documents.filter(item=>item.case_id===ref.item.id)
  const caseAssessments=data.assessments.filter(item=>item.case_id===ref.item.id)
  const caseSources=data.sourceStatus.filter(item=>item.case_id===ref.item.id)
  const caseApprovals=data.approvals.filter(item=>item.case_id===ref.item.id)
  const rows=[[ex.caseTitle,''],languageRow,[ex.case,ref.item.title||ex.case],[ex.status,localStatus(ref.item.status)],[ex.traffic,localLight(ref.item.traffic_light)],[core.homeCountry,ref.item.home_country||'DE'],[core.targetCountry,ref.item.target_country||'DE'],[core.goal,ref.item.goal||''],[ex.summary,ref.item.summary||''],[core.deadline,ref.item.deadline_at?new Date(ref.item.deadline_at).toLocaleString():''],[core.nextAction,ref.item.next_action||''],[ex.documents,caseDocuments.map(item=>item.title).join(', ')||ex.none],[core.currentAssessments,caseAssessments.map(item=>localLight(item.traffic_light)+' · '+item.title+': '+(item.reasoning||'')+'\n'+assessmentEvidenceText(item,caseDocuments,language,caseAssessments)+(item.next_step?' · '+core.nextAction+': '+item.next_step:'')).join('\n')||ex.none],[core.sourceBasis,caseSources.map(item=>(item.source_label||item.source_kind)+': '+item.status+(item.details?' · '+item.details:'')).join('\n')||ex.none],[approvalUi.title,caseApprovals.map(item=>(item.subject||item.approval_type)+' · '+(approvalUi[item.status]||item.status)+' · '+approvalUi.revision+' '+item.preview_revision).join('\n')||ex.none]]
  if(roadmap){
    let heading=null,body=[]
    const flush=()=>{rows.push([heading,body.join('\n')]);body=[]}
    for(const block of roadmapExportBlocks(roadmap)){
      if(['title','heading','step'].includes(block.kind)){
        if(heading!==null)flush()
        heading=(block.light?trafficLightDot(block.light)+' ':'')+block.text
      }else body.push((block.light?trafficLightDot(block.light)+' ':'')+block.text)
    }
    if(heading!==null)flush()
  }
  return rows
}

export async function createWorkspaceExportArtifact({ref,type,data,copy,outputLanguage='de',roadmap}){
  const rows=buildWorkspaceExportRows({ref,data,copy,outputLanguage,roadmap})
  const base=safeBase(ref.item.title,ref.kind==='case'?'Fall':'Dokument')
  if(type==='docx'){
    const {Document,Packer,Paragraph,TextRun}=await import('docx')
    const children=rows.flatMap((row,index)=>index===0?[new Paragraph({children:[new TextRun({text:row[0],bold:true,size:32})]})]:[new Paragraph({children:[new TextRun({text:row[0]+': ',bold:true}),...createDocxValueRuns(TextRun,row[1]) ]})])
    return {blob:await Packer.toBlob(new Document({sections:[{children}]})),filename:base+'.docx'}
  }
  if(type==='pdf'){
    return {blob:await createUnicodePdfBlob({rows,outputLanguage:normalizeOutputLanguage(outputLanguage)}),filename:base+'.pdf'}
  }
  if(type==='xlsx'){
    assertOfficeExportRenderer()
    return {blob:await createXlsxBlob(rows),filename:base+'.xlsx'}
  }
  if(type==='pptx'){
    assertOfficeExportRenderer()
    return {blob:await createPptxBlob(rows),filename:base+'.pptx'}
  }
  if(type==='csv'){const quote=value=>'"'+String(value??'').replace(/"/g,'""')+'"';return {blob:new Blob(['\uFEFF'+rows.map(row=>row.map(quote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),filename:base+'.csv'}}
  if(type==='txt')return {blob:new Blob([rows.map((row,index)=>index===0?row[0]:row[0]+': '+(row[1]||'')).join('\r\n\r\n')],{type:'text/plain;charset=utf-8'}),filename:base+'.txt'}
  throw new Error('Unsupported export format: '+type)
}

export function createAccountDataArtifact(payload){
  return {blob:new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),filename:'ASH_Workspace_Gold_Datenexport_'+new Date().toISOString().slice(0,10)+'.json'}
}

export function downloadExportArtifact({blob,filename}){
  const url=URL.createObjectURL(blob)
  const anchor=document.createElement('a')
  anchor.href=url
  anchor.download=filename
  anchor.hidden=true
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}
