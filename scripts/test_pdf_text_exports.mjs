import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import JSZip from 'jszip'
import {createTextPdf,pdfLight,pdfTextBlocks} from '../app/modules/services/textPdf.mjs'
import {createRoadmapPdf,createRoadmapDocx} from '../app/modules/services/customerRoadmapExport.mjs'
import {createHandoffPdf} from '../app/modules/services/professionalHandoffExport.mjs'
import {buildProfessionalHandoff} from '../app/modules/cases/lib/professionalHandoff.mjs'
import {roadmapTestRecord} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {roadmapUi} from '../app/modules/cases/lib/customerRoadmapCopy.mjs'
import {updateRoadmapProgress} from '../supabase/functions/_shared/customerRoadmap.mjs'

const fonts=['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(name=>fs.readFileSync('public/fonts/'+name).toString('base64'))
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ash-pdf-test-'))
const record=roadmapTestRecord()
record.style.letterhead='SYNTHETIC-ADVISOR-LETTERHEAD'
record.result.letters[0].body='SYNTHETIC-CUSTOMER-SENDER\n'+record.result.letters[0].body
const handoff=buildProfessionalHandoff({title:'Übergabe: 3.000 EUR',goal:'Korrektur prüfen',summary:'Eine Zahlung ist nicht bestätigt.',documents:[{title:'Original'}],assessments:[{trafficLight:'yellow',title:'Zahlung offen',reasoning:'Keine Zahlung bestätigt.'}]})
const copy={handoffTitle:'Professionelle Übergabe',goal:'Ziel',summary:'Sachstand',deadline:'Frist',next:'Nächster Schritt',documents:'Dokumente',assessments:'Bewertungen',timeline:'Verlauf',generated:'Synthetischer Exporttest'}
const outputs=[['roadmap',await createRoadmapPdf(record,{fonts}),'Wird grün, sobald'],['letter',await createRoadmapPdf(record,{fonts,letterId:record.result.letters[0].id}),'Sehr geehrte'],['handoff',await createHandoffPdf(handoff,copy,'de',{fonts}),'Zahlung offen']]
const samples={de:'Grüße, nächste Schritte und 3.000,00 EUR.',en:'Documents and next steps.',fr:'Échéance et pièces à vérifier.',tr:'İşlem, görüş ve sonraki adımlar.',pl:'Zażółć gęślą jaźń.',ru:'Проверка документов.',ar:'مراجعة المستندات والخطوات التالية',fa:'بررسی اسناد و مراحل بعدی',ro:'Înștiințare și următorii pași.',bg:'Проверка на документите.',vi:'Kiểm tra tài liệu và thời hạn.'}
for(const [language,text] of Object.entries(samples))outputs.push([language,await createTextPdf({fonts,language,blocks:[{text,kind:'title'},{text:'🟡 '+text},{text:('CHECK '+text+' ').repeat(180)},{text:'END-OF-EXPORT',light:'green'}]}),text])
const poppler=spawnSync('pdftotext',['-v'],{encoding:'utf8'}).status===0
for(const options of [{},{letterId:record.result.letters[0].id}]){
  const zip=await JSZip.loadAsync(await (await createRoadmapDocx(record,options)).arrayBuffer())
  const headers=(await Promise.all(zip.file(/^word\/header\d+\.xml$/).map(file=>file.async('string')))).join('\n')
  const document=await zip.file('word/document.xml').async('string')
  if(options.letterId){
    assert.doesNotMatch(headers,/SYNTHETIC-ADVISOR-LETTERHEAD/,'customer letter must not acquire the advisor letterhead')
    assert.match(document,/SYNTHETIC-CUSTOMER-SENDER/,'reviewed customer sender is preserved')
  }else assert.match(headers,/SYNTHETIC-ADVISOR-LETTERHEAD/,'customer explanation retains its advisor letterhead')
}
let reopened=roadmapTestRecord()
for(const id of ['frist','anfragen','antworten','abschluss'])reopened={...reopened,...updateRoadmapProgress(reopened,{step_id:id,done:true,note:'Bestätigung mit Beleg abgelegt.'})}
reopened={...reopened,...updateRoadmapProgress(reopened,{step_id:'anfragen',done:false,note:'Antwort fehlt; Anfrage korrigieren.'})}
const reopenedPdf=await createRoadmapPdf(reopened,{fonts})
const reopenedFile=path.join(directory,'reopened-roadmap.pdf')
fs.writeFileSync(reopenedFile,Buffer.from(await reopenedPdf.arrayBuffer()))
if(poppler) {
  const extracted=spawnSync('pdftotext',['-raw',reopenedFile,'-'],{encoding:'utf8'})
  assert.equal(extracted.status,0,extracted.stderr)
  const text=extracted.stdout.replace(/\s+/g,' ')
  for(const expected of [
    'Zuerst erforderlich: 2. Beide Auskunftsanfragen vorbereiten',
    'Zuerst erforderlich: 1. Empfangsbestätigung prüfen und einreichen · 3. Antworten auf Vollständigkeit prüfen',
    'Automatisch wieder geöffnet nach Wiederöffnung von: 2. Beide Auskunftsanfragen vorbereiten',
    'Vorherige Schritte sind noch offen.',
    reopened.result.facts[0].evidence[0].quote,
    reopened.source_documents[0].title
  ])assert.ok(text.includes(expected),'PDF retains progress context and fact provenance: '+expected)
  assert.equal(text.split('Automatisch wieder geöffnet nach Wiederöffnung von:').length-1,2,'both direct and transitive reopening appear in the actual PDF')
  assert.equal(text.split('Vorherige Schritte sind noch offen.').length-1,2,'both blocked actions are identified in the actual PDF')
}
for(const [reference,customer] of [['de','en'],['de','ar'],['ar','de']]) {
  const bilingual=roadmapTestRecord()
  bilingual.reference_language=reference;bilingual.output_language=customer
  const letter=bilingual.result.letters[0]
  letter.body=samples[reference]
  letter.customer_translation=samples[customer]+'\n\nTRANSLATION-END'
  const name=`bilingual-${reference}-${customer}`
  const pdf=await createRoadmapPdf(bilingual,{fonts,letterId:letter.id})
  const file=path.join(directory,name+'.pdf')
  fs.writeFileSync(file,Buffer.from(await pdf.arrayBuffer()))
  if(poppler) {
    const original=spawnSync('pdftotext',['-f','1','-l','1','-raw',file,'-'],{encoding:'utf8'})
    const translation=spawnSync('pdftotext',['-f','2','-raw',file,'-'],{encoding:'utf8'})
    assert.equal(original.status,0,original.stderr)
    assert.equal(translation.status,0,translation.stderr)
    assert.doesNotMatch(original.stdout,/TRANSLATION-END/,'recipient letter stays on its own page')
    assert.match(translation.stdout,/TRANSLATION-END/,'customer translation must be exported completely')
    const clean=translation.stdout.replace(/[\u202a-\u202e]/g,'')
    assert.ok(clean.includes(samples[customer])||clean.includes([...samples[customer]].reverse().join('')),'translation text is retained in PDF')
  }
  const docx=await createRoadmapDocx(bilingual,{letterId:letter.id})
  fs.writeFileSync(path.join(directory,name+'.docx'),Buffer.from(await docx.arrayBuffer()))
  const xml=await (await JSZip.loadAsync(await docx.arrayBuffer())).file('word/document.xml').async('string')
  assert.ok(xml.includes(samples[reference]),'Word retains recipient letter')
  assert.ok(xml.includes(samples[customer])&&xml.includes('TRANSLATION-END'),'Word retains complete customer translation')
  const paragraphs=[...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(match=>match[0])
  const heading=paragraphs.find(paragraph=>paragraph.includes(roadmapUi(customer).translation))
  assert.match(heading,/<w:pageBreakBefore\/>/,'translation starts separately from recipient letter in Word')
  for(const [language,text] of [[reference,samples[reference]],[customer,samples[customer]]]) {
    const paragraph=paragraphs.find(value=>value.includes(text))
    if(language==='ar')assert.match(paragraph,/<w:bidi\/>/,'Arabic paragraph direction is independent of the other language')
    else assert.doesNotMatch(paragraph,/<w:bidi\/>/,'Latin paragraph is not forced right-to-left')
  }
}
for(const [name,blob,expected] of outputs) {
  const bytes=Buffer.from(await blob.arrayBuffer()),file=path.join(directory,name+'.pdf')
  assert.equal(bytes.subarray(0,4).toString(),'%PDF')
  fs.writeFileSync(file,bytes)
  const raw=bytes.toString('latin1')
  assert.match(raw,/\/FontFile2/,'embedded Unicode font')
  assert.match(raw,/\/ToUnicode/,'searchable Unicode mapping')
  assert.doesNotMatch(raw,/\/Subtype \/Image/,'text exports must not be raster page images')
  if(poppler) {
    const text=spawnSync('pdftotext',['-raw',file,'-'],{encoding:'utf8'})
    assert.equal(text.status,0,text.stderr)
    if(name==='roadmap')assert.match(text.stdout,/SYNTHETIC-ADVISOR-LETTERHEAD/)
    if(name==='letter'){
      assert.doesNotMatch(text.stdout,/SYNTHETIC-ADVISOR-LETTERHEAD/,'PDF customer letter must not acquire the advisor letterhead')
      assert.match(text.stdout,/SYNTHETIC-CUSTOMER-SENDER/)
    }
    if(!['ar','fa'].includes(name))assert.ok(text.stdout.includes(expected),name+' missing original Unicode text')
    else {
      // Poppler presents RTL strings in visual order. ActualText retains logical
      // Unicode; linguistic and viewer-specific search acceptance stays separate.
      const clean=text.stdout.replace(/[\u202a-\u202e]/g,'')
      assert.ok(clean.includes(expected)||clean.includes([...expected].reverse().join('')),name+' missing RTL text')
    }
    if(samples[name])assert.match(text.stdout,/END-OF-EXPORT/,'long content must reach the last page')
  }
}
assert.equal(pdfLight('🟡 yellow'),'yellow');assert.equal(pdfLight('🟢 green'),'green')
assert.deepEqual(pdfTextBlocks([{text:'Titel',light:'🟡 yellow'}])[0].light,'yellow')
assert.equal(pdfTextBlocks([{text:'🟡 Zahlung offen'}])[0].text,'Zahlung offen')
console.log(`PDF repair: actual roadmap, letter and handoff renderers plus 11 language fixtures and bilingual Word/PDF letters; embedded fonts, text mapping, no raster pages${poppler?', extracted text, fact provenance, reopened dependencies, separate translation pages and long-content end markers':''} passed. Samples: ${directory}`)
