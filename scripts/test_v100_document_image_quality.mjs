import fs from 'node:fs'
import assert from 'node:assert/strict'
import { assessDocumentImage } from '../app/modules/documents/documentImageQuality.mjs'
import { validateDocumentUploadReadiness } from '../app/modules/documents/documentUploadReadiness.mjs'
import { imageQualityGuidance } from '../app/modules/documents/imageQualityGuidance.mjs'

const component=fs.readFileSync('app/modules/documents/DocumentImageQualityCheck.js','utf8')
const quality=component+fs.readFileSync('app/modules/documents/documentImageQuality.mjs','utf8')
const intake=fs.readFileSync('app/modules/documents/DocumentFileIntake.js','utf8')

const need=(source,needle,label)=>{if(!source.includes(needle))throw new Error(`V100 quality guard missing ${label}: ${needle}`)}

need(intake,"./DocumentImageQualityCheck",'isolated quality-module import')
need(intake,'<DocumentImageQualityCheck file={file} language={language} onResult={onQualityResult}/>','quality-module mount')
need(quality,"issues.push('resolution')",'resolution check')
need(quality,"issues.push('dark')",'darkness check')
need(quality,"issues.push('bright')",'brightness check')
need(quality,"issues.push('blur')",'blur check')
need(quality,"issues.push('low_contrast')",'almost uniform images remain blocked')
assert.doesNotMatch(quality,/issues\.push\('(?:cropped|skew)'\)/,'frame dimensions must not claim page crop or angle')
need(quality,'🟢','green quality state')
need(quality,'🟡','yellow quality state')
need(quality,'🔴','red quality state')
for(const language of ['de','en','pl','tr','ru','ar','fr','fa','ro','bg','vi']) need(quality,`${language}:{`,`${language} quality copy`)
if(quality.includes('uploadWorkspaceDocument')||quality.includes('invokeDocumentAnalysis')) throw new Error('V100 quality guard: quality module must remain separate from upload and AI analysis')
console.log('V100 quality guard passed: isolated resolution, exposure, sharpness hints, absent image detail and decoding failure; no unsupported page-geometry claims.')

// Document-like raster with small dark glyph strokes on a mostly white page.
// This reproduces the live scan warning without browser, network or AI calls.
function page({foreground=0,background=255,text=true}={}){
  const width=300,height=450,data=new Uint8ClampedArray(width*height*4)
  for(let i=0;i<data.length;i+=4){data[i]=data[i+1]=data[i+2]=background;data[i+3]=255}
  if(text)for(let line=0;line<10;line++)for(let letter=0;letter<18;letter++){
    const x0=20+letter*10,y0=30+line*22
    for(let y=y0;y<y0+9;y++)for(let x=x0;x<x0+5;x++)if(x===x0||y===y0||y===y0+4){
      const i=(y*width+x)*4;data[i]=data[i+1]=data[i+2]=foreground
    }
  }
  return {data,width,height,naturalWidth:1200,naturalHeight:1800}
}
const scan=assessDocumentImage(page())
assert.equal(scan.status,'good','a legible white document must not ask the user to retake it')
assert.deepEqual(scan.issues,[])
for(const input of [page({text:false}),page({foreground:245})]){
  const result=assessDocumentImage(input)
  assert.ok(result.issues.includes('bright'),'blank or washed-out bright input still needs attention')
  assert.ok(result.issues.includes('blur'),'missing usable edges must not become a good image')
  assert.equal(result.status,'bad')
}
assert.ok(assessDocumentImage(page({background:20,foreground:0})).issues.includes('dark'))
assert.ok(assessDocumentImage({...page(),naturalWidth:600,naturalHeight:900}).issues.includes('resolution'))
for(const [naturalWidth,naturalHeight] of [[1200,1600],[1600,1200],[1200,1200],[1200,3600],[3600,1200]]){
  const result=assessDocumentImage({...page(),naturalWidth,naturalHeight})
  assert.equal(result.status,'good','portrait, landscape, square and receipt formats do not establish tilt or cropping')
  assert.ok(!result.issues.includes('skew')&&!result.issues.includes('cropped'))
}
const pencil=assessDocumentImage({...page({foreground:135,background:175}),naturalWidth:1200,naturalHeight:1600})
assert.ok(pencil.sharpness<350,'regression fixture reaches the old automatic blocking threshold')
assert.equal(pencil.status,'warn','low edge energy in visible handwriting is a hint, not proof of unreadability')
assert.deepEqual(pencil.issues,['blur'])
assert.equal(validateDocumentUploadReadiness({fileType:'image/jpeg',intakeQuality:{state:'weak',...pencil}}).ok,true)
for(const background of [0,30,170,255]){
  const result=assessDocumentImage(page({background,text:false}))
  assert.equal(result.status,'bad','blank dark, gray and white images remain blocked')
  assert.ok(result.issues.includes('low_contrast'))
  assert.equal(validateDocumentUploadReadiness({fileType:'image/jpeg',intakeQuality:{state:'bad',...result}}).ok,false)
}
const speck=page({text:false});speck.data[0]=speck.data[1]=speck.data[2]=0
assert.equal(assessDocumentImage(speck).status,'bad','one contrasting speck must not make an empty image usable')
for(const malformed of [{data:new Uint8ClampedArray(),width:0,height:0},{data:new Uint8ClampedArray(4),width:300,height:450}])assert.deepEqual(assessDocumentImage(malformed),{status:'bad',issues:['unreadable']})
for(const language of ['de','en','pl','tr','ru','ar','fr','fa','ro','bg','vi']){
  const guidance=imageQualityGuidance(language)
  for(const key of ['warn','help','low_contrast','unreadable'])assert.ok(guidance[key],language+': '+key)
  if(language!=='de')assert.notEqual(guidance.warn,imageQualityGuidance('de').warn)
}
assert.ok(component.includes('assessDocumentImage({data,width,height,'),'the mounted component uses the tested pixel classifier')
assert.ok(!component.includes('<small>{key}</small>'),'internal quality codes are not shown to customers')
console.log('Phone-photo regression passed: visible pencil handwriting stays yellow and uploadable; ordinary frame shapes create no geometry warnings; blank/washed-out/invalid images stay red; 11-language guidance. Original handset image and live OCR not claimed.')
