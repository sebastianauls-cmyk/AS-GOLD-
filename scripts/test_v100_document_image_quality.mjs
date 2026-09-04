import fs from 'node:fs'

const quality=fs.readFileSync('app/modules/documents/DocumentImageQualityCheck.js','utf8')
const intake=fs.readFileSync('app/modules/documents/DocumentFileIntake.js','utf8')

const need=(source,needle,label)=>{if(!source.includes(needle))throw new Error(`V100 quality guard missing ${label}: ${needle}`)}

need(intake,"./DocumentImageQualityCheck",'isolated quality-module import')
need(intake,'<DocumentImageQualityCheck file={file} language={language} onResult={onQualityResult}/>','quality-module mount')
need(quality,"issues.push('resolution')",'resolution check')
need(quality,"issues.push('dark')",'darkness check')
need(quality,"issues.push('bright')",'brightness check')
need(quality,"issues.push('blur')",'blur check')
need(quality,"issues.push('cropped')",'cropping check')
need(quality,"issues.push('skew')",'skew check')
need(quality,'🟢','green quality state')
need(quality,'🟡','yellow quality state')
need(quality,'🔴','red quality state')
for(const language of ['de','en','pl','tr','ru','ar','fr','fa','ro','bg','vi']) need(quality,`${language}:{`,`${language} quality copy`)
if(quality.includes('uploadWorkspaceDocument')||quality.includes('invokeDocumentAnalysis')) throw new Error('V100 quality guard: quality module must remain separate from upload and AI analysis')
console.log('V100 document image-quality guard passed: isolated resolution, brightness, blur, crop and skew checks are wired in 11 languages.')
