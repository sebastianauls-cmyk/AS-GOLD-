import { createPptxBlob, createXlsxBlob } from './officeExports'
import { normalizeOutputLanguage, outputLanguageLabels } from '../language/outputLanguage'

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

const PDF_COLORS={gold:'#9a7414',ink:'#1f2937',muted:'#5f6874',line:'#d9dde3',green:'#2f855a',yellow:'#d69e2e',red:'#c53030',white:'#ffffff'}

function canvasLines(context,value,maxWidth){
  const lines=[]
  for(const paragraph of String(value??'').split(/\r?\n/)){
    if(!paragraph){lines.push('');continue}
    const words=paragraph.split(/\s+/)
    let line=''
    for(const word of words){
      const next=line?`${line} ${word}`:word
      if(line&&context.measureText(next).width>maxWidth){lines.push(line);line=word}
      else line=next
    }
    lines.push(line)
  }
  return lines
}

function trafficMarker(line){
  const match=String(line).match(/(🟢|🟡|🔴|⚪)/)
  if(!match) return null
  const colors={'🟢':PDF_COLORS.green,'🟡':PDF_COLORS.yellow,'🔴':PDF_COLORS.red,'⚪':PDF_COLORS.white}
  return {color:colors[match[1]],text:String(line).replace(match[1],'').trim()}
}

async function createUnicodePdfBlob({jsPDF,rows,outputLanguage}){
  if(typeof document==='undefined') throw new Error('PDF export is only available in the browser.')
  const rtl=outputLanguage==='ar'||outputLanguage==='fa'
  const width=1240,height=1754,margin=90,contentWidth=width-margin*2
  const pages=[]
  let canvas,context,y

  function newPage(){
    canvas=document.createElement('canvas');canvas.width=width;canvas.height=height
    context=canvas.getContext('2d')
    context.fillStyle='#ffffff';context.fillRect(0,0,width,height)
    context.fillStyle='#fff6d8';context.fillRect(margin,55,contentWidth,56)
    context.fillStyle=PDF_COLORS.gold;context.font='700 23px Arial, "Noto Sans", "Segoe UI", sans-serif';context.textAlign='center';context.direction='ltr';context.fillText('AS WORKSPACE GOLD',width/2,91)
    y=155
    pages.push({canvas,context})
  }

  function finishPage(page,index){
    const ctx=page.context
    ctx.strokeStyle=PDF_COLORS.line;ctx.beginPath();ctx.moveTo(margin,height-72);ctx.lineTo(width-margin,height-72);ctx.stroke()
    ctx.fillStyle=PDF_COLORS.muted;ctx.font='18px Arial, "Noto Sans", "Segoe UI", sans-serif';ctx.textAlign='left';ctx.direction='ltr';ctx.fillText('AS Workspace Gold · geprüfter Export',margin,height-42)
    ctx.textAlign='right';ctx.fillText(`${index+1} / ${pages.length}`,width-margin,height-42)
  }

  function ensureSpace(required){if(y+required>height-105)newPage()}

  newPage()
  rows.forEach((row,index)=>{
    const label=String(row?.[0]??'')
    const value=String(row?.[1]??'')
    if(index===0){
      context.font='700 42px Arial, "Noto Sans", "Segoe UI", sans-serif'
      const titleLines=canvasLines(context,label,contentWidth)
      ensureSpace(titleLines.length*54+28)
      context.fillStyle=PDF_COLORS.ink;context.textAlign=rtl?'right':'left';context.direction=rtl?'rtl':'ltr'
      for(const line of titleLines){context.fillText(line,rtl?width-margin:margin,y);y+=54}
      y+=22
      return
    }

    context.font='700 23px Arial, "Noto Sans", "Segoe UI", sans-serif'
    const labelLines=canvasLines(context,label,contentWidth)
    context.font='24px Arial, "Noto Sans", "Segoe UI", sans-serif'
    const valueLines=canvasLines(context,value||'—',contentWidth-18)
    ensureSpace(labelLines.length*31+valueLines.length*34+44)
    context.textAlign=rtl?'right':'left';context.direction=rtl?'rtl':'ltr';context.fillStyle=PDF_COLORS.gold;context.font='700 23px Arial, "Noto Sans", "Segoe UI", sans-serif'
    for(const line of labelLines){context.fillText(line,rtl?width-margin:margin,y);y+=31}
    context.fillStyle=PDF_COLORS.ink;context.font='24px Arial, "Noto Sans", "Segoe UI", sans-serif'
    for(const rawLine of valueLines){
      const marker=trafficMarker(rawLine)
      const text=marker?.text??rawLine
      const textX=rtl?width-margin-34:margin+34
      if(marker){
        const circleX=rtl?width-margin-14:margin+14
        context.beginPath();context.arc(circleX,y-8,11,0,Math.PI*2);context.fillStyle=marker.color;context.fill();context.strokeStyle=marker.color===PDF_COLORS.white?'#94a3b8':marker.color;context.stroke();context.fillStyle=PDF_COLORS.ink
      }
      context.fillText(text,marker?textX:(rtl?width-margin:margin),y)
      y+=34
    }
    context.strokeStyle=PDF_COLORS.line;context.beginPath();context.moveTo(margin,y+4);context.lineTo(width-margin,y+4);context.stroke();y+=32
  })

  pages.forEach(finishPage)
  const pdf=new jsPDF({unit:'pt',format:'a4',compress:true})
  pages.forEach((page,index)=>{
    if(index) pdf.addPage()
    pdf.addImage(page.canvas.toDataURL('image/jpeg',0.94),'JPEG',0,0,595.28,841.89,undefined,'FAST')
  })
  pdf.setProperties({title:String(rows[0]?.[0]||'AS Workspace Gold Export'),subject:'AS Workspace Gold Export',creator:'AS Workspace Gold'})
  return pdf.output('blob')
}

export function buildWorkspaceExportRows({ref,data,copy,outputLanguage='de'}){
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
  if(ref.kind==='document')return [[ex.documentTitle,''],languageRow,[ex.document,ref.item.title||ex.document],[ex.documentType,ref.item.document_type||''],[ex.documentDate,ref.item.document_date||''],[ex.analysis,ref.item.analysis_summary||ex.noAnalysis],[ex.traffic,localLight(ref.item.analysis_traffic_light)],[ex.nextStep,ref.item.analysis_next_step||''],[ex.extracted,ref.item.extracted_text||''],[approvalUi.body,ref.item.response_letter_de||'']]
  const caseDocuments=data.documents.filter(item=>item.case_id===ref.item.id)
  const caseAssessments=data.assessments.filter(item=>item.case_id===ref.item.id)
  const caseSources=data.sourceStatus.filter(item=>item.case_id===ref.item.id)
  const caseApprovals=data.approvals.filter(item=>item.case_id===ref.item.id)
  return [[ex.caseTitle,''],languageRow,[ex.case,ref.item.title||ex.case],[ex.status,localStatus(ref.item.status)],[ex.traffic,localLight(ref.item.traffic_light)],[core.homeCountry,ref.item.home_country||'DE'],[core.targetCountry,ref.item.target_country||'DE'],[core.goal,ref.item.goal||''],[ex.summary,ref.item.summary||''],[core.deadline,ref.item.deadline_at?new Date(ref.item.deadline_at).toLocaleString():''],[core.nextAction,ref.item.next_action||''],[ex.documents,caseDocuments.map(item=>item.title).join(', ')||ex.none],[core.currentAssessments,caseAssessments.map(item=>localLight(item.traffic_light)+' · '+item.title+': '+(item.reasoning||'')+(item.next_step?' · '+core.nextAction+': '+item.next_step:'')).join('\n')||ex.none],[core.sourceBasis,caseSources.map(item=>(item.source_label||item.source_kind)+': '+item.status+(item.details?' · '+item.details:'')).join('\n')||ex.none],[approvalUi.title,caseApprovals.map(item=>(item.subject||item.approval_type)+' · '+(approvalUi[item.status]||item.status)+' · '+approvalUi.revision+' '+item.preview_revision).join('\n')||ex.none]]
}

export async function createWorkspaceExportArtifact({ref,type,data,copy,outputLanguage='de'}){
  const rows=buildWorkspaceExportRows({ref,data,copy,outputLanguage})
  const base=safeBase(ref.item.title,ref.kind==='case'?'Fall':'Dokument')
  if(type==='docx'){
    const {Document,Packer,Paragraph,TextRun}=await import('docx')
    const children=rows.flatMap((row,index)=>index===0?[new Paragraph({children:[new TextRun({text:row[0],bold:true,size:32})]})]:[new Paragraph({children:[new TextRun({text:row[0]+': ',bold:true}),new TextRun(String(row[1]||''))]})])
    return {blob:await Packer.toBlob(new Document({sections:[{children}]})),filename:base+'.docx'}
  }
  if(type==='pdf'){
    const {jsPDF}=await import('jspdf')
    return {blob:await createUnicodePdfBlob({jsPDF,rows,outputLanguage:normalizeOutputLanguage(outputLanguage)}),filename:base+'.pdf'}
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
