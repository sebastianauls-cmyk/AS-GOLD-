import assert from 'node:assert/strict'
import {offlineFixtures} from './offline/fixtures.mjs'
import {validateCompleteAnalysis} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {completeAnalysisBlocks,completeAnalysisCopy} from '../app/modules/cases/lib/completeAnalysisDisplay.mjs'
import {roadmapExportBlocks} from '../app/modules/services/customerRoadmapExport.mjs'

// Hand-authored cases exercise delivery of already saved information. They do
// not measure the quality of a newly generated model answer or legal advice.
for(const fixture of offlineFixtures){
  const result=validateCompleteAnalysis(structuredClone(fixture.reply),fixture.source,fixture.context)
  const before=structuredClone(result)
  const blocks=completeAnalysisBlocks(result.analysis,fixture.context.outputLanguage,{steps:result.steps,documents:fixture.source.documents})
  const text=blocks.map(block=>block.text).join('\n')
  for(const topic of result.analysis.topics)for(const id of topic.step_ids){
    const index=result.steps.findIndex(step=>step.id===id)
    assert.ok(text.includes(`${index+1}. ${result.steps[index].title}`),`${fixture.id}: the topic must identify its actual follow-up step`)
  }
  for(const calculation of result.analysis.calculations)for(const input of calculation.inputs){
    if(input.kind==='document'){
      const doc=fixture.source.documents.find(doc=>doc.id===input.document_id)
      assert.ok(blocks.some(block=>block.documentId===doc.id&&block.text.includes(doc.title)),`${fixture.id}: the number must retain its original document`)
      assert.ok(text.includes(input.quote),'quotes remain verbatim')
    }
  }
  assert.deepEqual(result,before,'display never rewrites results, citations or actions')
}

const fixture=structuredClone(offlineFixtures[0])
const url='https://fixtures.invalid/explicitly-synthetic-rate'
const quote='ERFUNDENE PRÜFQUELLE. Der vereinbarte Satz beträgt 10 Prozent.'
fixture.context.research=[{url,title:'Erfundene Prüfquelle',source_text:quote,checked_at:'2026-09-24T12:00:00Z'}]
fixture.reply.analysis.calculations[0].title='Offener Rechnungsbetrag'
fixture.reply.analysis.calculations.push({id:'scenario',title:'Bedingtes Rechenbeispiel',topic_ids:['balance'],inputs:[
  {name:'previous',label:'Offener Betrag',kind:'calculation',value:'900.00',calculation_id:'balance'},
  {name:'rate',label:'Beispielsatz',kind:'source',value:'10',url,quote},
  {name:'periods',label:'Angenommene Zeiträume',kind:'assumption',value:'2',explanation:'Zwei Zeiträume nur für dieses erfundene Szenario.'}
],expression:'previous*percent(rate)*periods',decimal_places:2,unit:'EUR',conditions:'Nur falls Satz und zwei Zeiträume vereinbart sind; kein festgestellter Anspruch.',explanation:'Eine rein synthetische Vergleichsrechnung.'})
const result=validateCompleteAnalysis(fixture.reply,fixture.source,fixture.context)
const record={result,source_documents:fixture.source.documents,style:{},output_language:'de',reference_language:'de',progress:{},events:[]}
const blocks=completeAnalysisBlocks(result.analysis,'de',{steps:result.steps,documents:record.source_documents})
assert.equal(result.analysis.calculations[1].result,'180.00')
assert.ok(blocks.some(block=>block.url===url&&block.text.includes(url)),'a source used only for a numerical input must be visible and linked')
assert.ok(blocks.some(block=>block.kind==='meta'&&block.text==='Aus Berechnung: Offener Rechnungsbetrag'),'derived values identify the original calculation')
assert.ok(blocks.some(block=>block.text==='Fallfragen: Rechnerisch offener Betrag'),'calculations identify the questions they address')
assert.ok(blocks.some(block=>block.text.includes('Angenommen: Zwei Zeiträume')),'an assumption remains explicitly distinguished from evidence')
assert.ok(blocks.some(block=>block.evidenceId&&block.text.endsWith('„'+quote+'“')),'the original source quote remains verbatim and has a reference label')
const exported=roadmapExportBlocks(record)
for(const block of blocks)assert.ok(exported.some(entry=>entry.text===block.text),'Word/PDF must contain the same complete semantic content as the screen')
assert.ok(exported.findIndex(block=>block.kind==='step')<exported.findIndex(block=>block.text==='Auswertung'),'the actionable steps precede the detailed analysis appendix')

const compact=structuredClone(result.analysis),unusedUrl='https://fixtures.invalid/unused-research'
compact.research_sources=[...fixture.context.research,{url:unusedUrl,title:'Unused synthetic research',checked_at:'2026-09-24T12:00:00Z'}]
const originalInput=compact.calculations[0].inputs.find(input=>input.kind==='document')
compact.calculations[0].inputs.push({...originalInput},{...originalInput,document_id:'another-original'})
const compactBefore=structuredClone(compact)
const compactBlocks=completeAnalysisBlocks(compact,'de',{steps:result.steps,documents:record.source_documents})
assert.ok(!compactBlocks.some(block=>block.url===unusedUrl),'unused research must not be presented as a cited source')
assert.ok(compactBlocks.some(block=>block.url===url&&block.text.includes('Erfundene Prüfquelle')),'the source index retains sources used only in a calculation')
const originalQuote=compactBlocks.filter(block=>block.evidenceId&&block.documentId===originalInput.document_id&&block.text.includes(originalInput.quote))
assert.equal(originalQuote.length,1,'an exact quote from the same original appears in full once')
assert.ok(compactBlocks.some(block=>block.evidenceRef===originalQuote[0].evidenceId&&block.documentId===originalInput.document_id),'repeated evidence retains a resolvable reference and its origin')
assert.ok(compactBlocks.some(block=>block.evidenceId&&block.documentId==='another-original'&&block.text.includes(originalInput.quote)),'identical words in different originals must not be merged')
for(const block of compactBlocks.filter(block=>block.evidenceRef))assert.equal(compactBlocks.filter(target=>target.evidenceId===block.evidenceRef).length,1)
assert.deepEqual(compact,compactBefore,'shorter presentation preserves the complete saved research and original evidence')

const legacy=completeAnalysisBlocks(result.analysis)
assert.ok(legacy.some(block=>block.text.includes('invoice-original')),'missing title metadata retains the document identifier')
assert.ok(legacy.some(block=>block.text.includes('request')),'missing step metadata retains the stored reference')
const saved=structuredClone(result.analysis)
delete saved.calculations[0].inputs[0].document_id
assert.ok(completeAnalysisBlocks(saved).some(block=>block.text==='Originalunterlage: Nicht angegeben'),'older incomplete records must not invent a provenance')
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']){
  const copy=completeAnalysisCopy(language)
  for(const key of ['document','derived','relatedSteps','topics','unavailable','evidence'])assert.ok(copy[key]?.trim(),`${language}: missing ${key}`)
  if(language!=='de')assert.notEqual(copy.document,completeAnalysisCopy('de').document)
  const localized=completeAnalysisBlocks(result.analysis,language,{steps:result.steps,documents:record.source_documents})
  assert.ok(localized.some(block=>block.documentId==='invoice-original'&&block.text.startsWith(copy.document+': ')))
  assert.ok(localized.some(block=>block.url===url))
}
console.log('Analysis traceability: eight case types; document, web, calculation and assumption origins; linked steps/topics; legacy records; 11 languages; unchanged evidence and screen/export parity passed. No model calls.')
