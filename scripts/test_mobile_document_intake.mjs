import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import React from 'react'
import {transformSync} from 'next/dist/build/swc/index.js'
import {documentPickerCopy} from '../app/modules/documents/documentPickerCopy.mjs'
import {documentIntakeLanguages} from '../app/modules/documents/documentIntakeLanguages.mjs'

// Exercise actual component event handlers with isolated hook state. This is
// an offline regression test, not a claim about a physical phone's permissions.
const require=createRequire(import.meta.url),cache=new Map()
let active
const hooks={...React,useEffect(){},useState(initial){
  const scope=active,index=scope.cursor++
  if(!(index in scope.slots))scope.slots[index]=typeof initial==='function'?initial():initial
  return [scope.slots[index],value=>{scope.slots[index]=typeof value==='function'?value(scope.slots[index]):value}]
},useRef(initial){return hooks.useState(()=>({current:initial}))[0]}}
function load(file){
  file=path.resolve(file)
  if(cache.has(file))return cache.get(file).exports
  const mod={exports:{}};cache.set(file,mod)
  const code=transformSync(fs.readFileSync(file,'utf8'),{filename:file,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}).code
  const localRequire=specifier=>{
    if(specifier==='react')return hooks
    if(!specifier.startsWith('.'))return require(specifier)
    const target=path.resolve(path.dirname(file),specifier)
    return load([target,target+'.js',target+'.mjs'].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile()))
  }
  new Function('require','module','exports',code)(localRequire,mod,mod.exports)
  return mod.exports
}
function mount(Component,props){
  const scope={slots:[],cursor:0}
  return (updates={})=>{props={...props,...updates};active=scope;scope.cursor=0;return Component(props)}
}
const nodes=element=>Array.isArray(element)?element.flatMap(nodes):!React.isValidElement(element)?[]:[element,...nodes(element.props.children)]
const find=(tree,type)=>nodes(tree).find(node=>node.type===type)
const Picker=load('app/modules/documents/DocumentPickerActions.js').default
const Intake=load('app/modules/documents/DocumentFileIntake.js').default
const Voice=load('app/modules/documents/VoiceContextInput.js').default
const {DocumentsSurface}=load('app/modules/documents/DocumentsSurface.js')
const file=new File(['SYNTHETIC PHOTO'],'Photo.jpg',{type:'image/jpeg'})
const replacement=new File(['SYNTHETIC FILE'],'Statement.txt',{type:'text/plain'})

for(const {key:language} of documentIntakeLanguages){
  const selected=[],opened=[],c=documentPickerCopy(language)
  const render=mount(Picker,{language,onSelect:(...args)=>selected.push(args)})
  const tree=render(),inputs=nodes(tree).filter(node=>node.type==='input'),buttons=nodes(tree).filter(node=>node.type==='button')
  assert.equal(inputs[0].props.accept,'image/*');assert.equal(inputs[0].props.capture,'environment')
  assert.equal(inputs[1].props.capture,undefined);assert.ok(inputs[1].props.accept.includes('.pdf'))
  inputs.forEach((input,index)=>{input.props.ref.current={click(){opened.push(index)}}})
  buttons.forEach(button=>button.props.onClick())
  assert.deepEqual(opened,[0,1],'the chooser opens synchronously in the tap handler')
  assert.equal(buttons[0].props.children.at(-1),c.photo)
  assert.equal(buttons[1].props.children.at(-1),c.file)
  assert.equal(selected.length,0,'opening the chooser does not select or upload a file')
  inputs[0].props.onChange({currentTarget:{files:[]}})
  assert.equal(selected.length,0,'cancelling does not clear the confirmed selection')
  const input={files:[file],value:'photo'}
  inputs[0].props.onChange({currentTarget:input})
  assert.deepEqual(selected,[[file,'scan']]);assert.equal(input.value,'','the same photo can be selected again')
  assert.ok(nodes(render({disabled:true})).filter(node=>['button','input'].includes(node.type)).every(node=>node.props.disabled))
}

let submitted=[],success=false,mode='scan'
const surface=mount(DocumentsSurface,{a:{backOverview:'Back',sections:{documents:'Documents'}},access:{app_role:'owner'},documents:[],core:{},v28:{},cases:[{id:'correct-case',title:'Synthetic case'},{id:'other-case',title:'Other'}],uploadCaseId:'correct-case',documentMode:mode,setDocumentMode:value=>{mode=value},initialFile:file,uploadDocument:async(event,selection)=>{submitted.push(selection);return success}})
let tree=surface(),intakeNode=find(tree,Intake),voiceNode=find(tree,Voice)
assert.equal(intakeNode.props.initialFile,file)
assert.equal(nodes(tree).find(node=>node.props.name==='case_id').props.value,'correct-case')
assert.ok(!nodes(tree).filter(node=>node.type==='details').some(node=>nodes(node).some(child=>child.type===Voice)),'microphone is available without opening a disclosure')
assert.equal(submitted.length,0,'selecting a case file never uploads automatically')
await find(tree,'form').props.onSubmit({})
assert.equal(submitted.at(-1).file,file)
tree=surface();assert.equal(find(tree,Intake).key,intakeNode.key,'failed uploads preserve the selection')
assert.equal(find(tree,Voice).key,voiceNode.key,'failed uploads preserve confirmed voice context')

const intake=mount(Intake,intakeNode.props)
let intakeTree=intake()
assert.ok(nodes(intakeTree).some(node=>node.props.role==='status'))
const qualityState=tree=>JSON.parse(nodes(tree).find(node=>node.props.name==='intake_quality').props.value).state
assert.equal(qualityState(intakeTree),'checking','a camera handoff requires its own quality check')
const Quality=load('app/modules/documents/DocumentImageQualityCheck.js').default
find(intakeTree,Quality).props.onResult({status:'good',issues:[]})
assert.equal(qualityState(intake()),'good')
find(intake(),Picker).props.onSelect(new File(['NEXT PHOTO'],'Next.jpg',{type:'image/jpeg'}),'scan')
assert.equal(qualityState(intake()),'checking','a replacement photo cannot reuse the old quality result')
find(intakeTree,Picker).props.onSelect(replacement,'upload')
tree=surface({documentMode:mode})
assert.equal(mode,'upload')
assert.equal(find(tree,Intake).key,intakeNode.key,'switching source keeps intake state')
assert.equal(find(tree,Voice).key,voiceNode.key,'switching source keeps voice state')
await find(tree,'form').props.onSubmit({})
assert.equal(submitted.at(-1).file,replacement,'the latest selected File reaches the workflow unchanged')
intakeTree=intake({documentMode:mode})
nodes(intakeTree).find(node=>node.type==='button'&&node.props.children==='Synthetische Musterdatei auswählen').props.onClick()
await find(surface(),'form').props.onSubmit({})
assert.equal(submitted.at(-1).file,null,'the synthetic sample clears the previous real-file override')
assert.equal(nodes(intake()).find(node=>node.props.name==='sample_document').props.value,'synthetic-v29')
success=true
await find(surface(),'form').props.onSubmit({})
tree=surface()
assert.notEqual(find(tree,Intake).key,intakeNode.key)
assert.equal(find(tree,Intake).props.initialFile,null,'successful upload cannot restore the old photo')
assert.notEqual(find(tree,Voice).key,voiceNode.key,'successful upload starts a clean next document')
console.log('Mobile intake: direct native picker gestures in 11 languages; cancellation, same-file retry, busy controls, original File handoff, case binding, visible microphone, context retention, sample replacement and successful reset passed. No network or model calls.')
