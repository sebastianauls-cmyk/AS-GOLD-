import assert from 'node:assert/strict'
import { analyzeDeadlines } from '../app/modules/lib/deadlineIntelligence.mjs'
import { prioritizeNextStep } from '../app/modules/lib/nextStepEngine.mjs'
import { supportedLanguages } from '../app/modules/language/languageRegistry.mjs'

const now=new Date('2026-09-08T12:00:00Z')
const languages=supportedLanguages.map(item=>item.key)
assert.equal(languages.length,11,'Stress test requires all 11 app languages')

const CASES_PER_LANGUAGE=100
const DOCS_PER_CASE=8
const cases=[]
let documentCount=0

for(const [languageIndex,language] of languages.entries()){
  for(let i=0;i<CASES_PER_LANGUAGE;i+=1){
    const absolute=i%4===0
      ? 'Ihre Stellungnahme muss bis 10.09.2026 eingehen.'
      : i%4===1
        ? 'Bitte Unterlagen nachreichen. Kein konkretes Fristdatum genannt.'
        : i%4===2
          ? 'Besprechung am 30.09.2026.'
          : 'Zahlungsaufforderung mit Prüfung der Unterlagen.'
    const longContext=`${'Sachverhalt und Dokumentenhinweis. '.repeat(120)} ${absolute}`
    const deadline=analyzeDeadlines({
      text:longContext,
      caseDeadline:i%5===0?'2026-09-11':'',
      now
    })
    const assessments=i%7===0
      ? [{traffic:'red',next:'Kritischen Punkt sofort fachlich prüfen'}]
      : i%3===0
        ? [{traffic:'yellow',next:'Unterlagen abgleichen'}]
        : []
    const recommendation=prioritizeNextStep({
      language,
      missing:i%6===0,
      deadlineStatus:deadline.status,
      deadlineAction:deadline.primary?'Fristgrundlage prüfen und Handlung vorbereiten.':'',
      assessments,
      caseNext:i%9===0?'Kundenrückfrage vorbereiten':''
    })
    assert.ok(recommendation.action?.length>4,`${language}/${i}: missing recommendation`)
    assert.ok(['immediate','high','normal','uncertain','none'].includes(deadline.status),`${language}/${i}: invalid deadline status ${deadline.status}`)
    const documents=[]
    for(let d=0;d<DOCS_PER_CASE;d+=1){
      documents.push({
        id:`${language}-${i}-doc-${d}`,
        title:`Dokument ${d+1}`,
        extracted_text:`${'Dokumentinhalt. '.repeat(80)} ${d===0?absolute:''}`,
        source_language:language,
        created_at:new Date(now.getTime()-(d*86400000)).toISOString()
      })
      documentCount+=1
    }
    cases.push({
      id:`stress-${languageIndex}-${i}`,
      language,
      title:`Stressfall ${language.toUpperCase()} ${i+1}`,
      deadline_at:i%5===0?'2026-09-11T10:00:00Z':null,
      traffic_light:assessments.some(a=>a.traffic==='red')?'red':assessments.length?'yellow':'green',
      recommendation,
      documents
    })
  }
}

assert.equal(cases.length,1100)
assert.equal(documentCount,8800)
assert.equal(new Set(cases.map(item=>item.id)).size,cases.length,'Case IDs must remain unique at stress volume')
assert.equal(new Set(cases.flatMap(item=>item.documents.map(doc=>doc.id))).size,documentCount,'Document IDs must remain unique at stress volume')

const datedCases=cases.filter(item=>item.deadline_at).sort((a,b)=>new Date(a.deadline_at)-new Date(b.deadline_at))
assert.ok(datedCases.length>0,'Stress data must contain deadlines')
assert.ok(cases.some(item=>item.traffic_light==='red'),'Stress data must contain red cases')
assert.ok(cases.some(item=>item.traffic_light==='yellow'),'Stress data must contain yellow cases')
assert.ok(cases.some(item=>item.traffic_light==='green'),'Stress data must contain green cases')

for(const language of languages){
  const subset=cases.filter(item=>item.language===language)
  assert.equal(subset.length,CASES_PER_LANGUAGE,`${language}: incomplete stress coverage`)
  assert.ok(subset.every(item=>item.documents.length===DOCS_PER_CASE),`${language}: document fan-out mismatch`)
}

console.log(`V131 pilot stress regression passed: ${cases.length} synthetic cases, ${documentCount} documents, ${datedCases.length} dated cases across ${languages.length} languages.`)
