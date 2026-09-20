// Extract the actual production model blocks; never maintain a second test prompt.
import fs from 'node:fs'
import path from 'node:path'
import {transformSync} from 'next/dist/build/swc/index.js'
const destination=process.argv[2]
if(!destination)throw new Error('Output directory required')
fs.mkdirSync(destination,{recursive:true})
const read=file=>fs.readFileSync(file,'utf8')
const document=read('supabase/functions/gold-document-analysis/index.ts')
const roadmap=read('supabase/functions/gold-case-roadmap/index.ts')
const legal=read('supabase/functions/gold-legal-comparison/index.ts')
const block=source=>source.slice(source.indexOf('\n',source.indexOf('// MODEL_WORKFLOW_START'))+1,source.indexOf('// MODEL_WORKFLOW_END')).replace(/runReviewedModel\(\{/g,'runReviewedModel({onResponse,')
const roadmapConfig=roadmap.slice(roadmap.indexOf('\n',roadmap.indexOf('// MODEL_WORKFLOW_START'))+1,roadmap.indexOf('// MODEL_CONFIGURATION_END'))
if(!roadmapConfig.includes('const validate=')||roadmapConfig.includes('const binding='))throw new Error('Roadmap model configuration boundary is missing')
const imports=`import { CASE_EVIDENCE_RULES } from './caseEvidenceRules.mjs';\nimport { ROADMAP_SCHEMA,validateRoadmapResult } from './customerRoadmap.mjs';\nimport { originalPlainText,finalizeDocumentResult,runReviewedModel,advanceReviewedModel } from './modelQuality.mjs';\n`
const base64=document.slice(document.indexOf('function base64('),document.indexOf('\nfunction mime('))
const languageLine=roadmap.split('\n').find(line=>line.startsWith('const LANGUAGES:'))
const source=imports+base64+'\n'+languageLine+`\nexport async function evaluateDocument({providerKey,bytes,fileMime='text/plain',filePath='synthetic.txt',requestedOutputLanguage='de',requestedReferenceLanguage='de',outputLanguageName='Deutsch',referenceLanguageName='Deutsch',countryContextName='Deutschland / deutscher Rechtsraum',voiceContext=null,voiceLanguage=null},onResponse){\n${block(document)}\nreturn analysis;\n}\nexport async function evaluateRoadmap({providerKey,source,style,permissions={full_analysis:true,draft_letters:true},outputLanguage='de',referenceLanguage='de'},onResponse){\n${roadmapConfig}\nreturn runReviewedModel({providerKey,request,reviewContent,validate,onResponse});\n}\nexport async function evaluateRoadmapStage({providerKey,source,style,permissions={full_analysis:true,draft_letters:true},outputLanguage='de',referenceLanguage='de',state=null},onResponse){\n${roadmapConfig}\nreturn advanceReviewedModel({providerKey,request,reviewContent,validate,state,onResponse});\n}\n`
fs.writeFileSync(path.join(destination,'productionModelBlocks.mjs'),transformSync(source,{filename:'productionModelBlocks.ts',jsc:{parser:{syntax:'typescript'},target:'es2022'},module:{type:'es6'}}).code)
const legalPrefix=legal.slice(0,legal.indexOf('Deno.serve(')).replace(/^import .*jsr:.*\n/gm,'').replaceAll("'../_shared/","'./")
const legalBlock=legal.slice(legal.indexOf('  const allowedDomains=',legal.indexOf('Deno.serve(')),legal.indexOf('  const sourceCheckedAt='))
  .replace("  const output=responseText(raw);", "  if(onResponse)onResponse({stage:'research',response_id:raw.id,model:raw.model,status:raw.status,usage:raw.usage,output:responseText(raw),search_calls:raw.output?.filter(item=>item.type==='web_search_call')});\n  const output=responseText(raw);")
  .replace('reviewModelCandidate({providerKey,','reviewModelCandidate({providerKey,onResponse,')
  .replace('  // A search hit or a model citation alone is insufficient.',"  if(onResponse)onResponse({stage:'retrieval',sources:[...retrieved.values()]});\n  // A search hit or a model citation alone is insufficient.")
const legalSource=legalPrefix+`\nexport async function evaluateResearch({providerKey,home='DE',target='FR',topic='claims_payments',outputLanguage='de',question,caseRow={},documents=[]},onResponse){const attemptId='synthetic-evaluation';const req=new Request('https://example.invalid');const log=()=>{};const model='gpt-5.6-luna';\n${legalBlock}\nreturn {result};\n}\n`
fs.writeFileSync(path.join(destination,'productionResearchBlock.mjs'),transformSync(legalSource,{filename:'productionResearchBlock.ts',jsc:{parser:{syntax:'typescript'},target:'es2022'},module:{type:'es6'}}).code)
for(const file of ['caseEvidenceRules.mjs','customerRoadmap.mjs','modelQuality.mjs','verifiedResearch.mjs'])fs.copyFileSync('supabase/functions/_shared/'+file,path.join(destination,file))
fs.copyFileSync('app/modules/testing/historyCaseCorpus.mjs',path.join(destination,'historyCaseCorpus.mjs'))
console.log('Production model blocks extracted with unchanged prompts, validators and review flow.')
