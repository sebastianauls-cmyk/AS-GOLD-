import assert from 'node:assert/strict'
import fs from 'node:fs'
import {historyCaseCorpus,historyCoverageLimits,historyTestToday} from '../app/modules/testing/historyCaseCorpus.mjs'
import {autoDocumentAssessment,documentTimelineEntry} from '../app/modules/cases/lib/caseIntelligence.mjs'
import {assessmentEvidence,caseEvidenceStatus,caseGuidance} from '../app/modules/cases/lib/caseEvidence.mjs'
import {analyzeCaseDeadlines} from '../app/modules/cases/lib/caseDeadlineEvidence.mjs'
import {analyzeDeadlines} from '../app/modules/cases/lib/deadlineIntelligence.mjs'
import {prioritizeNextStep} from '../app/modules/cases/lib/nextStepEngine.mjs'
import {roadmapSource,roadmapFingerprint,validateRoadmapInput,validateRoadmapResult,roadmapSteps,updateRoadmapProgress,ROADMAP_LANGUAGES} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {documentDateLabel,timelineDateCopy} from '../app/modules/cases/lib/timelineDateCopy.mjs'

const allDocuments=historyCaseCorpus.flatMap(entry=>entry.documents)
const reviewedAssessment=(doc)=>({
  id:`review-${doc.id}`,case_id:doc.case_id,owner_id:doc.owner_id,
  title:'Synthetische Belegprüfung',traffic_light:'yellow',next_step:'Fehlenden Originalbeleg anfordern.',
  source_document_id:doc.id,source_document_updated_at:doc.updated_at,
  source_locator:'Absatz 1',source_excerpt:doc.extracted_text,
  source_reviewed_at:'2030-04-10T09:00:00Z'
})

// A deliberately hand-authored contract fixture, NOT an AI-generated result.
function validatorFixture(doc){
  return {
    title:'Synthetischer Prüffahrplan',opening:'Die Unterlagen enthalten offene Fragen.',
    key_points:['Originalbelege prüfen.'],meaning:'Die Sachfrage bleibt ungeklärt.',
    next:'Fehlende Unterlagen beschaffen.',customer_action:'Die konkrete Anfrage prüfen.',
    facts:[{text:doc.extracted_text,evidence:[{document_id:doc.id,quote:doc.extracted_text}]}],
    steps:[
      {id:'request',title:'Unterlagen anfordern',phase:'now',light:'yellow',reason:'Grundlagen sind offen.',owner:'Testperson',action:'Anfrage vorbereiten.',done_when:'Die Anfrage ist geprüft und der Zugang ist belegt.',after_response:'Antwort abgleichen.',depends_on:[],deadline:null,evidence:[{document_id:doc.id,quote:doc.extracted_text}]},
      {id:'review',title:'Antwort prüfen',phase:'waiting',light:'yellow',reason:'Erst die Antwort liefert weitere Grundlagen.',owner:'Testperson',action:'Antwort mit den offenen Fragen vergleichen.',done_when:'Alle Antworten sind geprüft.',after_response:'Verbleibende Fragen benennen.',depends_on:['request'],deadline:null,evidence:[]}
    ],letters:[]
  }
}

const results=[]
for(const entry of historyCaseCorpus){
  const {item,documents}=entry
  const source=roadmapSource(item,allDocuments,[])
  validateRoadmapInput(source)
  assert.deepEqual(source.documents.map(doc=>doc.id),documents.map(doc=>doc.id),`${entry.id}: only this case`)
  for(const doc of documents){
    assert.notEqual(autoDocumentAssessment(doc.extracted_text,analyzeDeadlines({text:doc.extracted_text,now:historyTestToday})).trafficLight,'green',`${entry.id}: unresolved input: ${doc.extracted_text}`)
  }
  assert.equal(documentTimelineEntry(documents[0]).date,'2030-04-02')
  assert.equal(documentTimelineEntry(documents[0]).dateBasis,'document_date')
  assert.equal(documentTimelineEntry(documents[1]).dateBasis,'created_at')
  assert.equal(analyzeCaseDeadlines(item,allDocuments,historyTestToday).primary,null)

  const assessments=documents.map(reviewedAssessment)
  assert.equal(caseEvidenceStatus(item,allDocuments,assessments).complete,true)
  assert.equal(caseGuidance({item,documents:allDocuments,assessments}).kind,'next')
  assert.equal(caseGuidance({item,documents:allDocuments,assessments:assessments.slice(0,1)}).kind,'newDocument')

  // Same case id and even the same document id must not admit another owner.
  const foreign={...documents[0],owner_id:'foreign-owner',extracted_text:'FOREIGN-OWNER-CONTENT'}
  const foreignAssessment={...assessments[0],id:'foreign-review',owner_id:'foreign-owner',supersedes_assessment_id:assessments[0].id}
  const before=roadmapSource(item,allDocuments,assessments)
  const pollutedDocuments=[foreign,...allDocuments]
  const pollutedAssessments=[foreignAssessment,...assessments]
  assert.deepEqual(roadmapSource(item,pollutedDocuments,pollutedAssessments),before)
  assert.deepEqual(caseEvidenceStatus(item,pollutedDocuments,pollutedAssessments),caseEvidenceStatus(item,allDocuments,assessments))
  assert.equal(caseGuidance({item,documents:[foreign],assessments:[foreignAssessment]}).kind,'upload')
  assert.equal(assessmentEvidence(assessments[0],[foreign]).status,'missing')
  assert.equal(analyzeCaseDeadlines(item,[{...foreign,extracted_text:'Einzureichen bis 01.04.2030.'}],historyTestToday).primary,null)

  const changed={...documents[0],updated_at:'2030-04-10T10:00:00Z',extracted_text:`${documents[0].extracted_text}\nNeue Antwort, Prüfung erforderlich.`}
  const changedDocuments=[changed,documents[1]]
  assert.equal(caseEvidenceStatus(item,changedDocuments,assessments).complete,false)
  assert.equal(caseGuidance({item,documents:changedDocuments,assessments}).kind,'stale')
  assert.notEqual(await roadmapFingerprint(before),await roadmapFingerprint(roadmapSource(item,changedDocuments,assessments)))
  const added={...documents[1],id:`${item.id}-new`}
  assert.equal(caseGuidance({item,documents:[...documents,added],assessments}).kind,'newDocument')
  assert.notEqual(await roadmapFingerprint(before),await roadmapFingerprint(roadmapSource(item,[...documents,added],assessments)))
  assert.notEqual(await roadmapFingerprint(before),await roadmapFingerprint(roadmapSource(item,documents.slice(0,1),assessments)))
  assert.notEqual(await roadmapFingerprint(before),await roadmapFingerprint(roadmapSource({...item,goal:'Geändertes Fallziel'},documents,assessments)))

  assert.throws(()=>validateRoadmapInput(roadmapSource(item,[{...documents[0],data_classification:'real'}],[])),/Testbetrieb/)
  assert.throws(()=>validateRoadmapInput(roadmapSource(item,[{...documents[0],extracted_text:''}],[])),/auslesen/)

  const result=validatorFixture(documents[0])
  validateRoadmapResult(result,source)
  const inventedQuote=structuredClone(result)
  inventedQuote.facts[0].evidence[0].quote='Dieser Beleg wurde frei erfunden.'
  assert.throws(()=>validateRoadmapResult(inventedQuote,source),/Original/)
  const foreignQuote=structuredClone(result)
  foreignQuote.facts[0].evidence[0].document_id=historyCaseCorpus.find(other=>other.id!==entry.id).documents[0].id
  assert.throws(()=>validateRoadmapResult(foreignQuote,source),/Original/)
  const prematureGreen=structuredClone(result)
  prematureGreen.steps[0].light='green'
  assert.throws(()=>validateRoadmapResult(prematureGreen,source),/Schrittstatus/)
  const cycle=structuredClone(result)
  cycle.steps[0].depends_on=['review']
  assert.throws(()=>validateRoadmapResult(cycle,source),/Reihenfolge/)

  results.push({id:entry.id,theme:entry.topic,documents:documents.length,offline:'passed',model:'pending',live:'pending',reviewCriteria:entry.reviewCriteria})
}

// Positives stay possible; uncertainty does not silently clear a real deadline.
for(const text of ['Die Forderung ist vollständig gezahlt.','Der Antrag wurde bewilligt und bestätigt.','Die Zahlung wurde bestätigt.']){
  assert.equal(autoDocumentAssessment(text).trafficLight,'green',text)
}
for(const text of ['Die Leistung sei bewilligt, behauptet die Gegenseite.','Die Erstattung ist angeblich genehmigt.','Nur der Eingang wurde bestätigt.','Die Zahlung wird später bestätigt.','Die Buchung könnte bestätigt werden.','Eine Teilzahlung wurde bestätigt.']){
  assert.notEqual(autoDocumentAssessment(text).trafficLight,'green',text)
}
const urgent=analyzeDeadlines({text:'Bitte reichen Sie die Unterlagen bis 11.04.2030 ein.',now:historyTestToday})
assert.equal(urgent.primary.date,'2030-04-11')
assert.equal(autoDocumentAssessment('Die Zahlung ist angeblich bestätigt.',urgent).trafficLight,'red')
assert.equal(analyzeDeadlines({text:'Bitte antworten Sie innerhalb von zehn Tagen nach Zugang.',now:historyTestToday}).primary,null)
assert.equal(analyzeDeadlines({text:'Besprechung am 11.04.2030.',now:historyTestToday}).primary,null)
for(const language of ROADMAP_LANGUAGES){
  assert.equal(prioritizeNextStep({language,missing:true,deadlineStatus:'immediate'}).kind,'deadline')
  const labels=timelineDateCopy(language)
  assert.ok(documentDateLabel(allDocuments[1],language).includes(labels.unknown))
}

// Too many documents must be rejected explicitly, never silently truncated.
const sample=historyCaseCorpus[0]
assert.throws(()=>validateRoadmapInput(roadmapSource(sample.item,Array.from({length:31},(_,i)=>({...sample.documents[0],id:`over-cap-${i}`})),[])),/zu groß/)

// Review completion follows dependencies, and revised evidence reopens work.
let record={result:validatorFixture(sample.documents[0]),progress:{},events:[]}
assert.equal(roadmapSteps(record,{today:'2030-04-10'})[1].blocked,true)
assert.throws(()=>updateRoadmapProgress(record,{step_id:'review',done:true,note:'Antwort geprüft'}),/vorher/)
record={...record,...updateRoadmapProgress(record,{step_id:'request',done:true,note:'Synthetischer Zugang geprüft'},'2030-04-10T12:00:00Z')}
record={...record,...updateRoadmapProgress(record,{step_id:'review',done:true,note:'Synthetische Antwort geprüft'},'2030-04-10T12:01:00Z')}
assert.ok(roadmapSteps(record).every(step=>step.done))
assert.ok(roadmapSteps(record,{stale:true}).every(step=>!step.done&&step.light==='white'))
record={...record,...updateRoadmapProgress(record,{step_id:'request',done:false,note:'Neuer Beleg widerspricht'},'2030-04-10T12:02:00Z')}
assert.equal(record.progress.review.done,false)

const report={
  kind:'offline-regression',caseCount:results.length,documentCount:allDocuments.length,
  coverage:historyCoverageLimits,results,
  notice:'Die lokalen Funktionsprüfungen sind keine KI-Antworten, kein rechtlicher Richtigkeitsnachweis und kein produktiver End-to-End-Test.'
}
const reportPath=process.env.ASH_HISTORY_TEST_REPORT
if(reportPath)fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
console.log(`${results.length} synthetic case groups / ${allDocuments.length} documents: offline scope, evidence lifecycle, conservative status, provenance and roadmap contract checks passed. AI/domain and live acceptance remain pending.`)
