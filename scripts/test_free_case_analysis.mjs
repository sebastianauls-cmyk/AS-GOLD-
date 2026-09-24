import assert from 'node:assert/strict'
import fs from 'node:fs'
import JSZip from 'jszip'
import {analyzeFreeCase,freeAnalysisInput,euroCents,hasFreeAnalysisAccess,readMoneyTables} from '../app/modules/cases/lib/freeCaseAnalysis.mjs'
import {freeAnalysisBlocks} from '../app/modules/cases/lib/freeAnalysisCopy.mjs'
import {createFreeAnalysisExport} from '../app/modules/services/freeAnalysisExport.mjs'

const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/freeAnalysisSarah.json',import.meta.url),'utf8'))
const input=freeAnalysisInput(fixture.item,fixture.documents)
const originalFetch=globalThis.fetch
let requests=0
globalThis.fetch=()=>{requests++;throw new Error('Free analysis must never request a provider or network resource')}
try{
  const result=analyzeFreeCase(input)
  assert.deepEqual(result.summary,{documents:4,read:4,checks:8,differences:0,open:8})
  assert.equal(result.legal_status,'unreviewed')
  const checks=result.documents.flatMap(doc=>doc.checks)
  assert.deepEqual(checks.filter(c=>c.kind==='net').map(c=>[c.column,c.expected]),[['Kind A',2793000],['Kind B',2842100]])
  assert.deepEqual(checks.filter(c=>c.kind==='divide').map(c=>c.expected),[26000,26500])
  assert.deepEqual(checks.filter(c=>c.target.label==='Festgesetzter Monatsbeitrag').map(c=>c.expected),[2012,2117])
  for(const doc of result.documents){
    const text=input.documents.find(entry=>entry.id===doc.id).text
    for(const table of doc.tables)for(const row of table.rows)assert(text.includes(row.quote),'table evidence is an exact source excerpt')
    for(const check of doc.checks)for(const row of [...check.inputs,check.target])assert(text.includes(row.quote),'calculation retains its real source')
    for(const date of doc.dates)assert(text.includes(date.quote))
    for(const entry of doc.open)assert(text.replace(/\s+/gu,' ').includes(entry.quote))
  }
  assert(result.documents[3].open.some(entry=>entry.quote.includes('Datum des Zugangs')))
  assert(!result.documents[3].dates.some(entry=>entry.date==='2026-10-02'),'no invented objection deadline without receipt date')
  assert(result.documents[3].dates.some(entry=>entry.date==='2026-10-15'))

  const changed=structuredClone(input)
  changed.documents[0].text=changed.documents[0].text.replace('27.930,00 EUR','27.830,00 EUR')
  const discrepant=analyzeFreeCase(changed)
  assert.equal(discrepant.summary.differences,1)
  assert.equal(discrepant.documents[0].checks[0].difference,-10000)
  assert.equal(analyzeFreeCase(input).summary.differences,0,'analysis does not mutate the saved input')
  assert.notEqual(JSON.stringify(changed),JSON.stringify(input),'changed sources invalidate the displayed result')

  const foreign={...fixture.documents[0],id:'foreign',owner_id:'another-owner'}
  const otherCase={...fixture.documents[0],id:'other-case',case_id:'another-case'}
  assert.equal(freeAnalysisInput(fixture.item,[...fixture.documents,foreign,otherCase]).documents.length,4)
  assert.equal(freeAnalysisInput({...fixture.item,owner_id:null},fixture.documents).documents.length,0)
  assert.equal(analyzeFreeCase({...input,documents:[]}).summary.read,0)
  assert.equal(analyzeFreeCase({...input,documents:[{...input.documents[0],text:''}]}).summary.checks,0)
  const long=analyzeFreeCase({...input,documents:[{...input.documents[0],text:input.documents[0].text+'x'.repeat(120001)}]})
  assert(long.documents[0].truncated);assert.equal(long.summary.checks,0)
  assert.equal(analyzeFreeCase({...input,documents:Array(31).fill(input.documents[0])}).omitted_documents,1)
  assert.equal(readMoneyTables('Gross 1,000.00 EUR\nNet 900.00 EUR').length,0,'unsupported formatting is not guessed')
  assert.equal(euroCents('1,000.00 EUR'),null)
  assert.equal(euroCents('−1.234,56 EUR'),-123456)
  assert.equal(euroCents('1.000.000.000.000,00 EUR'),null)
  const unknown=structuredClone(input)
  unknown.documents[0].text=unknown.documents[0].text.replace('Kirchensteuer','Unbekannte Position')
  assert.equal(analyzeFreeCase(unknown).documents[0].checks.length,0,'unknown deductions cannot silently pass a gross/net check')
  const noLabels=readMoneyTables('Position Alice Bob\nTeilbetrag 1,00 EUR 2,00 EUR\nZusatz 2,00 EUR 3,00 EUR\nSumme 3,00 EUR 5,00 EUR')
  assert.deepEqual(noLabels[0].columns,[null,null],'ambiguous identity labels are not invented')
  const invalidDate=analyzeFreeCase({...input,documents:[{...input.documents[0],text:'Datum 30. Februar 2026.'}]})
  assert.equal(invalidDate.documents[0].dates.length,0)
  const renamed={...input,title:'Ein anderer Testfall',documents:input.documents.map((doc,index)=>({...doc,title:`Unterlage ${index+1}`}))}
  assert.deepEqual(analyzeFreeCase(renamed).summary,result.summary,'no special case name triggers or prewritten result')

  assert(hasFreeAnalysisAccess({active:true,status:'approved',app_role:'owner'}))
  assert(hasFreeAnalysisAccess({active:true,status:'approved',app_role:'member',permissions:{shared_team_access:true}}))
  for(const access of [null,{active:true,status:'approved',app_role:'customer'},{active:false,status:'approved',app_role:'owner'},{active:true,status:'pending',app_role:'owner'}])assert(!hasFreeAnalysisAccess(access))

  const createdAt='2026-09-24T12:00:00Z'
  const blocks=freeAnalysisBlocks(result,'de',createdAt)
  assert(blocks.some(block=>block.text.includes('keine KI-Analyse')))
  assert(blocks.some(block=>block.text.includes('Rechtsfristen bleiben ungeprüft')))
  const word=await createFreeAnalysisExport(result,'docx',{createdAt})
  const zip=await JSZip.loadAsync(await word.blob.arrayBuffer())
  const xml=await zip.file('word/document.xml').async('string')
  for(const phrase of ['27.930,00','28.421,00','keine KI-Analyse','Datum des Zugangs']){
    assert(xml.includes(phrase),`Word contains ${phrase}`)
  }
  const fonts=['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(name=>fs.readFileSync(new URL('../public/fonts/'+name,import.meta.url)).toString('base64'))
  const pdf=await createFreeAnalysisExport(result,'pdf',{createdAt,fonts})
  assert.equal(new TextDecoder().decode((await pdf.blob.arrayBuffer()).slice(0,5)),'%PDF-')
  assert(pdf.blob.size>20000)
  assert.equal(requests,0,'analysis and exports work with all network calls forbidden')
  console.log('Free analysis: eight source-backed Sarah arithmetic checks; one altered payout detected; missing/unsupported/foreign/stale inputs, access boundaries and real Word/PDF exports verified. Zero network requests.')
}finally{globalThis.fetch=originalFetch}
