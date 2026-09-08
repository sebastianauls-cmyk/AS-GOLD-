import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { buildWorkspaceExportRows, createWorkspaceExportArtifact } from '../app/modules/services/exportService.js'

const exportCopy={
  ex:{
    documentTitle:'Dokumentausgabe',document:'Dokument',documentType:'Dokumenttyp',documentDate:'Dokumentdatum',analysis:'Analyse',traffic:'Ampel',nextStep:'Nächster Schritt',extracted:'Erkannter Inhalt',noAnalysis:'Keine Analyse',
    caseTitle:'Fallausgabe',case:'Fall',status:'Status',open:'Offen',closed:'Geschlossen',yellow:'Gelb',green:'Grün',red:'Rot',summary:'Zusammenfassung',documents:'Dokumente',none:'Keine'
  },
  core:{homeCountry:'Heimatland',targetCountry:'Zielland',goal:'Ziel',deadline:'Frist',nextAction:'Nächste Aktion',currentAssessments:'Aktuelle Bewertungen',sourceBasis:'Grundlage'},
  approvalUi:{body:'Schreiben',title:'Freigaben',approved:'Freigegeben',pending:'Ausstehend',rejected:'Abgelehnt',revision:'Version'}
}

const CASE_ID='synthetic-extreme-120'
const DOCUMENT_COUNT=120
const ASSESSMENT_COUNT=60

const documents=Array.from({length:DOCUMENT_COUNT},(_,index)=>({
  id:`extreme-doc-${index+1}`,
  case_id:CASE_ID,
  title:`Synthetisches Dokument ${String(index+1).padStart(3,'0')}`,
  document_type:index%5===0?'authority_letter':index%5===1?'invoice':index%5===2?'evidence':index%5===3?'contract':'correspondence',
  document_date:`2026-09-${String((index%8)+1).padStart(2,'0')}`,
  analysis_summary:index%3===0?'Frist oder Reaktionsbedarf erkannt.':index%3===1?'Nachweis vollständig und plausibel.':'Widerspruch zu einer weiteren synthetischen Unterlage erkannt.',
  analysis_traffic_light:index%3===0?'red':index%3===1?'green':'yellow',
  analysis_next_step:index%3===0?'Frist prüfen und sofortige Reaktion vorbereiten.':index%3===1?'Als belastbaren Nachweis vormerken.':'Widerspruch mit Gegenunterlage abgleichen.',
  extracted_text:`Rein synthetischer Inhalt Dokument ${index+1}. Keine realen personenbezogenen Daten.`,
  reference_copy:index===0?'Madame, Monsieur,\n\nveuillez trouver ci-joint notre réponse synthétique.':'',
  reference_copy_language:index===0?'fr':'de',
  customer_copy:index===0?'السادة المحترمون،\n\nنرفق لكم الرد الاصطناعي المطلوب.':'',
  customer_copy_language:index===0?'ar':'de'
}))

const assessments=Array.from({length:ASSESSMENT_COUNT},(_,index)=>{
  const traffic=index%3===0?'green':index%3===1?'yellow':'red'
  const type=index%6
  const title=type===0?'Formprüfung':type===1?'Nachweislücke':type===2?'Fristprüfung':type===3?'Widerspruch':type===4?'Rechtsraumhinweis':'Nächster Schritt'
  return {
    case_id:CASE_ID,
    traffic_light:traffic,
    title:`${title} ${index+1}`,
    reasoning:traffic==='green'?'Synthetisch vollständig belegt.':traffic==='yellow'?'Weitere Unterlage oder Gegenprüfung erforderlich.':'Kurze Frist oder wesentlicher Widerspruch erfordert sofortige Bearbeitung.',
    next_step:traffic==='green'?'Dokumentiert lassen.':traffic==='yellow'?'Fehlende Information gezielt ergänzen.':'Sofort prüfen und Reaktion vorbereiten.'
  }
})

const sourceStatus=Array.from({length:24},(_,index)=>({
  case_id:CASE_ID,
  source_label:`Synthetische Quelle ${index+1}`,
  source_kind:index%2?'document':'official_source',
  status:index%4===0?'needs_review':'verified',
  details:index%4===0?'Quellenbezug im Extremfall nochmals prüfen.':'Nur synthetische Testgrundlage.'
}))

const approvals=[
  {case_id:CASE_ID,subject:'Extremfall Antwortentwurf',approval_type:'letter',status:'approved',preview_revision:7},
  {case_id:CASE_ID,subject:'Anlagenübersicht',approval_type:'attachment_list',status:'approved',preview_revision:4},
  {case_id:CASE_ID,subject:'Interne Prüfnotiz',approval_type:'note',status:'pending',preview_revision:2}
]

const extremeCase={
  id:CASE_ID,
  title:'Synthetischer Extremfall 120 Dokumente',
  status:'open',
  traffic_light:'red',
  home_country:'FR',
  target_country:'DE',
  goal:'Mehrsprachige, fristgebundene Reaktion mit vollständiger Nachweis- und Widerspruchskontrolle.',
  summary:'Extremer synthetischer v131-Abnahmefall mit hoher Dokumentdichte, gemischter Beweislage, mehreren Frist- und Rechtsraumhinweisen.',
  deadline_at:'2026-09-10T10:00:00.000Z',
  next_action:'Rote Frist- und Widerspruchsbewertungen zuerst bearbeiten, danach Freigabe der Antwortfassung prüfen.'
}

const data={documents,assessments,sourceStatus,approvals}

assert.equal(documents.length,DOCUMENT_COUNT)
assert.equal(assessments.length,ASSESSMENT_COUNT)
assert.equal(new Set(documents.map(item=>item.id)).size,DOCUMENT_COUNT,'Extreme case document IDs must stay unique')
assert.equal(new Set(documents.map(item=>item.title)).size,DOCUMENT_COUNT,'Extreme case document titles must stay unique')
assert.ok(assessments.some(item=>item.traffic_light==='green'))
assert.ok(assessments.some(item=>item.traffic_light==='yellow'))
assert.ok(assessments.some(item=>item.traffic_light==='red'))
assert.ok(assessments.filter(item=>item.title.startsWith('Fristprüfung')).length>=10,'Extreme case must contain repeated deadline pressure')
assert.ok(assessments.filter(item=>item.title.startsWith('Widerspruch')).length>=10,'Extreme case must contain repeated contradiction checks')

const rows=buildWorkspaceExportRows({ref:{kind:'case',item:extremeCase},data,copy:exportCopy,outputLanguage:'de'})
const rowText=rows.map(row=>`${row[0]}: ${row[1]}`).join('\n')
for(const token of [
  'Synthetischer Extremfall 120 Dokumente',
  'Synthetisches Dokument 001',
  'Synthetisches Dokument 120',
  '🟢 Grün',
  '🟡 Gelb',
  '🔴 Rot',
  'Nachweislücke',
  'Fristprüfung',
  'Widerspruch',
  'Rechtsraumhinweis',
  'Synthetische Quelle 24',
  'Extremfall Antwortentwurf',
  'Freigegeben',
  'Interne Prüfnotiz',
  'Ausstehend'
]) assert.match(rowText,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))

const bilingualRows=buildWorkspaceExportRows({ref:{kind:'document',item:documents[0]},data,copy:exportCopy,outputLanguage:'ar'})
const bilingualText=bilingualRows.map(row=>`${row[0]}: ${row[1]}`).join('\n')
assert.match(bilingualText,/Madame, Monsieur/)
assert.match(bilingualText,/السادة المحترمون/)
assert.match(bilingualText,/Français/)
assert.match(bilingualText,/العربية/)
assert.match(bilingualText,/🔴\s+Rot/)

async function inspectArtifact(type){
  const artifact=await createWorkspaceExportArtifact({ref:{kind:'case',item:extremeCase},type,data,copy:exportCopy,outputLanguage:'de'})
  assert.ok(artifact.blob.size>1000,`${type}: extreme export must be non-empty`)
  return {artifact,zip:await JSZip.loadAsync(await artifact.blob.arrayBuffer())}
}

const word=await inspectArtifact('docx')
const wordXml=await word.zip.file('word/document.xml').async('string')
for(const token of ['Synthetischer Extremfall 120 Dokumente','Synthetisches Dokument 120','Extremfall Antwortentwurf','2F855A','D69E2E','C53030','●']) assert.match(wordXml,new RegExp(token))

const excel=await inspectArtifact('xlsx')
const sheetXml=await excel.zip.file('xl/worksheets/sheet1.xml').async('string')
for(const token of ['Synthetischer Extremfall 120 Dokumente','Synthetisches Dokument 120','Extremfall Antwortentwurf','FF2F855A','FFD69E2E','FFC53030','●']) assert.match(sheetXml,new RegExp(token))

const powerPoint=await inspectArtifact('pptx')
const slideFiles=Object.keys(powerPoint.zip.files).filter(name=>/^ppt\/slides\/slide\d+\.xml$/.test(name))
const slideXml=(await Promise.all(slideFiles.map(name=>powerPoint.zip.file(name).async('string')))).join('\n')
for(const token of ['Synthetischer Extremfall 120 Dokumente','Synthetisches Dokument 120','Extremfall Antwortentwurf','2F855A','D69E2E','C53030','●']) assert.match(slideXml,new RegExp(token))

console.log(`V131 extreme end-to-end guard passed: 1 synthetic extreme case, ${DOCUMENT_COUNT} documents, ${ASSESSMENT_COUNT} assessments, 24 sources, mixed deadlines/evidence, French-Arabic letter pair, approval state and real Word/Excel/PowerPoint artifacts.`)
