import assert from 'node:assert/strict'
import fs from 'node:fs'
import JSZip from 'jszip'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { jsPDF } from 'jspdf'
import { createXlsxBlob, createPptxBlob } from '../app/lib/officeExports.js'

process.env.INTEGRATION_TOKEN_KEY='v38-synthetic-integration-key-only-for-regression'
const {sealIntegrationToken,openIntegrationToken}=await import('../app/modules/integrations/tokens.js')

const page=fs.readFileSync(new URL('../app/modules/workspace/WorkspaceAppV2.js',import.meta.url),'utf8')
const authRepository=fs.readFileSync(new URL('../app/modules/services/authRepository.js',import.meta.url),'utf8')
const pageEntry=fs.readFileSync(new URL('../app/page.js',import.meta.url),'utf8')
const uploadConfig=fs.readFileSync(new URL('../app/modules/documents/uploadConfig.js',import.meta.url),'utf8')
const documentsSurface=fs.readFileSync(new URL('../app/modules/documents/DocumentsSurface.js',import.meta.url),'utf8')
const documentWorkflow=fs.readFileSync(new URL('../app/modules/documents/documentWorkflow.js',import.meta.url),'utf8')
const exportWorkflow=fs.readFileSync(new URL('../app/modules/documents/exportWorkflow.js',import.meta.url),'utf8')
const caseSurfaces=fs.readFileSync(new URL('../app/modules/cases/WorkspaceCaseSurfaces.js',import.meta.url),'utf8')
const googleStart=fs.readFileSync(new URL('../app/api/integrations/google/start/route.js',import.meta.url),'utf8')
const googleCallback=fs.readFileSync(new URL('../app/api/integrations/google/callback/route.js',import.meta.url),'utf8')
const microsoftStart=fs.readFileSync(new URL('../app/api/integrations/microsoft/start/route.js',import.meta.url),'utf8')
const microsoftCallback=fs.readFileSync(new URL('../app/api/integrations/microsoft/callback/route.js',import.meta.url),'utf8')

assert.match(pageEntry,/modules\/workspace\/WorkspaceAppCurrent/)

const rows=[
  ['AS Workspace Gold synthetischer Testfall',''],
  ['Fall','V80-Simulation'],
  ['Status','Offen'],
  ['Ampel','Gelb'],
  ['Frist','05.09.2026'],
  ['Sachstand','Vollständig erfundener Testinhalt ohne echte personenbezogene Daten.'],
  ['Nächster Schritt','Fristgrundlage prüfen und Antwort vorbereiten.']
]

for(const token of [
  'supabase.auth.signUp',
  'supabase.auth.signInWithPassword',
  'supabase.auth.resetPasswordForEmail'
]) assert.match(authRepository,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))
for(const token of ['acceptedLegal','validateV29Password']) assert.match(page,new RegExp(token))
assert.match(documentsSurface,/name="data_classification" value="personal"/)
assert.doesNotMatch(documentsSurface,/test_data_confirmed/,'current upload must not require obsolete synthetic-test confirmation')
assert.match(documentWorkflow,/dataClassification=.*personal/)

assert.match(uploadConfig,/tooLarge/)
assert.match(uploadConfig,/unsupported/)
assert.match(uploadConfig,/maxUploadBytes\s*=\s*50\s*\*\s*1024\s*\*\s*1024/)
assert.match(documentsSurface,/disabled=\{uploading\}/)
assert.match(exportWorkflow,/if\(!canExport\(type\)\)/)

const docxBuffer=await Packer.toBuffer(new Document({sections:[{children:rows.map((r,i)=>new Paragraph({children:[new TextRun({text:i===0?r[0]:`${r[0]}: ${r[1]}`,bold:i===0})]}))}]}))
assert.ok(docxBuffer.byteLength>1000,'DOCX-Simulation erzeugte keine belastbare Datei')
const docxZip=await JSZip.loadAsync(docxBuffer)
assert.ok(docxZip.file('word/document.xml'),'DOCX-Struktur unvollständig')
const docxXml=await docxZip.file('word/document.xml').async('string')
assert.match(docxXml,/V80-Simulation/)

const pdf=new jsPDF()
let y=18
for(const [label,value] of rows){pdf.text(`${label}${value?`: ${value}`:''}`,18,y);y+=8}
const pdfBytes=pdf.output('arraybuffer')
assert.ok(pdfBytes.byteLength>500,'PDF-Simulation erzeugte keine belastbare Datei')
assert.equal(Buffer.from(pdfBytes).subarray(0,4).toString(),'%PDF')

const xlsxBlob=await createXlsxBlob(rows)
assert.ok(xlsxBlob.size>1000,'XLSX-Simulation erzeugte keine belastbare Datei')
const xlsxZip=await JSZip.loadAsync(await xlsxBlob.arrayBuffer())
assert.ok(xlsxZip.file('xl/workbook.xml'))
assert.ok(xlsxZip.file('xl/worksheets/sheet1.xml'))
assert.match(await xlsxZip.file('xl/worksheets/sheet1.xml').async('string'),/V80-Simulation/)

const pptxBlob=await createPptxBlob(rows)
assert.ok(pptxBlob.size>1000,'PPTX-Simulation erzeugte keine belastbare Datei')
const pptxZip=await JSZip.loadAsync(await pptxBlob.arrayBuffer())
assert.ok(pptxZip.file('ppt/presentation.xml'))
assert.ok(pptxZip.file('ppt/slides/slide1.xml'))
const slideNames=Object.keys(pptxZip.files).filter(name=>/^ppt\/slides\/slide\d+\.xml$/.test(name))
assert.ok(slideNames.length>=1)

const syntheticToken={provider:'google',service:'drive',refresh_token:'synthetic-refresh-token',scope:'openid drive.file',connected_at:'2026-09-01T00:00:00.000Z'}
const sealed=sealIntegrationToken(syntheticToken)
assert.notEqual(sealed,syntheticToken.refresh_token)
assert.deepEqual(openIntegrationToken(sealed),syntheticToken)
assert.equal(openIntegrationToken(sealed.slice(0,-2)+'xx'),null,'Manipuliertes OAuth-Token muss verworfen werden')

for(const source of [googleStart,microsoftStart]){
  assert.match(source,/randomUUID\(\)/)
  assert.match(source,/httpOnly:true/)
  assert.match(source,/secure:true/)
  assert.match(source,/sameSite:'lax'/)
  assert.match(source,/maxAge:600/)
}
assert.match(googleCallback,/expected!==stateValue/)
assert.match(microsoftCallback,/state!==expected/)
assert.match(googleCallback,/sealIntegrationToken/)
assert.match(microsoftCallback,/sealIntegrationToken/)
assert.match(googleCallback,/refresh_token/)
assert.match(microsoftCallback,/refresh_token/)

for(const exportType of ['pdf','docx','xlsx','pptx','csv','txt']) assert.match(page,new RegExp(`value=\\"${exportType}\\"`))
assert.match(page,/onBack=\{\(\)=>setSelectedCase\(null\)\}/)
assert.match(caseSurfaces,/backClients/)
assert.match(caseSurfaces,/backOverview/)

console.log('V80 practical simulation passed: active workspace auth gates, real-document upload boundary, real DOCX/PDF/XLSX/PPTX generation, OAuth safeguards and navigation/export wiring verified.')
