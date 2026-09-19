import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createTextPdf,pdfLight,pdfTextBlocks} from '../app/modules/services/textPdf.mjs'
import {createRoadmapPdf} from '../app/modules/services/customerRoadmapExport.mjs'
import {createHandoffPdf} from '../app/modules/services/professionalHandoffExport.mjs'
import {buildProfessionalHandoff} from '../app/modules/cases/lib/professionalHandoff.mjs'
import {roadmapTestRecord} from '../app/modules/testing/customerRoadmapFixture.mjs'

const fonts=['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(name=>fs.readFileSync('public/fonts/'+name).toString('base64'))
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ash-pdf-test-'))
const record=roadmapTestRecord()
const handoff=buildProfessionalHandoff({title:'Übergabe: 3.000 EUR',goal:'Korrektur prüfen',summary:'Eine Zahlung ist nicht bestätigt.',documents:[{title:'Original'}],assessments:[{trafficLight:'yellow',title:'Zahlung offen',reasoning:'Keine Zahlung bestätigt.'}]})
const copy={handoffTitle:'Professionelle Übergabe',goal:'Ziel',summary:'Sachstand',deadline:'Frist',next:'Nächster Schritt',documents:'Dokumente',assessments:'Bewertungen',timeline:'Verlauf',generated:'Synthetischer Exporttest'}
const outputs=[['roadmap',await createRoadmapPdf(record,{fonts}),'Wird grün, sobald'],['letter',await createRoadmapPdf(record,{fonts,letterId:'kasse'}),'Sehr geehrte'],['handoff',await createHandoffPdf(handoff,copy,'de',{fonts}),'Zahlung offen']]
const samples={de:'Grüße, nächste Schritte und 3.000,00 EUR.',en:'Documents and next steps.',fr:'Échéance et pièces à vérifier.',tr:'İşlem, görüş ve sonraki adımlar.',pl:'Zażółć gęślą jaźń.',ru:'Проверка документов.',ar:'مراجعة المستندات والخطوات التالية',fa:'بررسی اسناد و مراحل بعدی',ro:'Înștiințare și următorii pași.',bg:'Проверка на документите.',vi:'Kiểm tra tài liệu và thời hạn.'}
for(const [language,text] of Object.entries(samples))outputs.push([language,await createTextPdf({fonts,language,blocks:[{text,kind:'title'},{text:'🟡 '+text},{text:('CHECK '+text+' ').repeat(180)},{text:'END-OF-EXPORT',light:'green'}]}),text])
const poppler=spawnSync('pdftotext',['-v'],{encoding:'utf8'}).status===0
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
console.log(`PDF repair: actual roadmap, letter and handoff renderers plus 11 language fixtures; embedded fonts, text mapping, no raster pages${poppler?', extracted text and long-content end markers':''} passed. Samples: ${directory}`)
