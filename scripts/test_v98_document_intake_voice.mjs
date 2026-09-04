import fs from 'node:fs'

const intake=fs.readFileSync('app/modules/documents/DocumentFileIntake.js','utf8')
const quality=fs.readFileSync('app/modules/documents/DocumentImageQualityCheck.js','utf8')
const voice=fs.readFileSync('app/modules/documents/VoiceContextInput.js','utf8')
const surface=fs.readFileSync('app/modules/documents/DocumentsSurface.js','utf8')
const workflow=fs.readFileSync('app/modules/documents/documentWorkflow.js','utf8')
const repository=fs.readFileSync('app/modules/services/documentRepository.js','utf8')
const analysis=fs.readFileSync('supabase/functions/gold-document-analysis/index.ts','utf8')
const languages=fs.readFileSync('app/modules/documents/documentIntakeLanguages.mjs','utf8')
const migration=fs.readFileSync('supabase/migrations/20260904092739_v98_document_intake_voice_fields.sql','utf8')

const must=(source,needle,label)=>{
  if(!source.includes(needle)) throw new Error(`V98 scenario guard failed: ${label} -> ${needle}`)
}
const mustNot=(source,needle,label)=>{
  if(source.includes(needle)) throw new Error(`V98 separation guard failed: ${label} -> ${needle}`)
}

// Scenario 1: German photo / scan. Intake owns file capture; V100 owns image-quality inspection.
must(surface,'<DocumentFileIntake','German scan uses isolated file-intake component')
must(intake,"documentMode==='scan'?'image/*'",'scan mode restricts camera intake to images')
must(intake,"capture={documentMode==='scan'?'environment':undefined}",'rear-camera capture hint')
must(intake,"./DocumentImageQualityCheck",'intake delegates image quality to standalone component')
must(intake,'name="intake_quality"','quality result submitted separately')
must(quality,"Math.min(img.naturalWidth,img.naturalHeight)<800||Math.max(img.naturalWidth,img.naturalHeight)<1200",'image resolution threshold in quality module')
must(quality,"issues.push('dark')",'dark-image detection')
must(quality,"issues.push('blur')",'blur detection')
must(quality,"issues.push('cropped')",'cropping warning')
must(quality,'🟢','green quality result')
must(quality,'🟡','yellow quality result')
must(quality,'🔴','red quality result')
must(workflow,'intakeQuality','workflow receives intake-quality metadata')
must(repository,'intake_quality:intakeQuality','repository stores intake-quality metadata')
console.log('✓ Scenario 1: German photo/scan -> isolated intake + standalone quality check + persistence')

// Scenario 2: Foreign-language document, represented by Polish.
must(languages,"key:'pl'",'Polish is available as source/spoken language')
must(intake,'name="source_language"','source language submitted separately')
must(analysis,"source_language:{type:'string'}",'AI schema returns detected source language')
must(analysis,'0. source_language: erkannte Originalsprache','AI is instructed to detect original document language')
must(analysis,'source_language:detectedSourceLanguage','detected source language is persisted')
must(analysis,'document_translation','translation remains a separate workflow output')
console.log('✓ Scenario 2: Polish/foreign document -> source language detection stays separate from translation')

// Scenario 3: Document plus spoken user context.
must(surface,'<VoiceContextInput','document workspace mounts standalone microphone module')
must(voice,'SpeechRecognition','microphone module owns browser speech recognition')
must(voice,'function accept(){','transcript acceptance has a dedicated handler')
must(voice,'setConfirmed(draft.trim())','accepted transcript stores the trimmed draft')
must(voice,'onClick={accept}','transcript requires an explicit acceptance action')
must(voice,'name="voice_context"','confirmed spoken context submitted separately')
must(voice,'name="voice_language"','spoken language submitted separately')
must(repository,'voice_context:voiceContext','repository stores spoken context separately')
must(repository,'voice_language:voiceLanguage','repository stores spoken language separately')
must(analysis,"Dieser Kontext ist NICHT Teil des Dokuments",'AI receives strict spoken-context separation instruction')
must(analysis,'Er darf niemals in extracted_text oder document_translation hineingemischt werden.','document transcription/translation isolation')
mustNot(repository,'extracted_text:voiceContext','repository must never copy voice context into extracted document text')
console.log('✓ Scenario 3: Document + microphone -> confirmed voice context stays separate from document text')

// Persistence contract.
for(const column of ['source_language','voice_context','voice_language','intake_quality']) must(migration,column,`migration contains ${column}`)

console.log('V98 document-intake and microphone regression suite passed: 3/3 scenarios, with V100 image quality delegated to its own module.')
