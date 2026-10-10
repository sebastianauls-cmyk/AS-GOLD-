import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {transformSync} from 'next/dist/build/swc/index.js'
import {readCaseLink,caseResultHref,resolveCaseLink,clearCaseLink,caseLinkUnavailable,createCaseResultFocus} from '../app/modules/workspace/caseLink.mjs'
import {resolveWorkspaceEntry} from '../app/modules/workspace/sessionEntry.mjs'
import {roadmapTestRecord} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {roadmapUi} from '../app/modules/cases/lib/customerRoadmapCopy.mjs'

const caseId='11111111-1111-4111-8111-111111111111'
const own={id:caseId,owner_id:'owner',title:'Synthetic saved case'}
const ready={caseId,screen:'app',userId:'owner',access:{active:true,status:'approved'},privacyCurrent:true,cases:[own]}
const href=caseResultHref(caseId),params=new URLSearchParams(href.split('?')[1])
assert.equal(readCaseLink(params.toString()),caseId)
assert.deepEqual(resolveWorkspaceEntry(null,params.get('start')),{kind:'screen',screen:'login'},'the link must enter the real sign-in flow without a session')
assert.deepEqual(resolveWorkspaceEntry({user:{id:'owner'}},params.get('start')),{kind:'session'},'an existing session must be checked by the normal workspace loader')
for(const screen of ['loading','login','public','recovery','workspace-connecting','workspace-unavailable','workspace-denied']){
  assert.equal(resolveCaseLink({...ready,screen}).kind,'waiting',screen+': no case before authenticated workspace entry')
}
for(const change of [{userId:null},{privacyCurrent:false},{access:null},{access:{active:false,status:'approved'}},{access:{active:true,status:'pending'}}]){
  assert.equal(resolveCaseLink({...ready,...change}).kind,'waiting','a link must not bypass any access gate')
}
assert.equal(resolveCaseLink(ready).item,own,'open the actual owner-scoped saved record without generating a replacement')
assert.deepEqual(resolveCaseLink({...ready,cases:[]}),{kind:'unavailable'})
assert.deepEqual(resolveCaseLink({...ready,cases:[{...own,owner_id:'someone-else'}]}),{kind:'unavailable'},'a known ID cannot open a foreign case')
assert.deepEqual(resolveCaseLink({...ready,userId:'someone-else'}),{kind:'unavailable'},'changing accounts cannot reuse the former owner’s record')
for(const search of ['', '?case=anything', '?case=javascript%3Aalert(1)', '?case='+caseId+'&case='+caseId])assert.equal(readCaseLink(search),null)
assert.equal(caseResultHref('https://outside.invalid'),null)
let replaced
const historyState={retained:'framework history'}
clearCaseLink({location:{href:'https://app.example.invalid/?start=login&case='+caseId+'&lang=pl&payment=return#answer'},history:{state:historyState,replaceState:(...args)=>{replaced=args}}})
assert.deepEqual(replaced,[historyState,'','/?lang=pl&payment=return#answer'],'consuming a link must preserve other workflow parameters and history state')
for(const language of ['de','en','tr','pl','ru','ar','fa','fr','ro','bg','vi'])assert.ok(caseLinkUnavailable(language))

const focus=createCaseResultFocus(),moves=[]
const element={isConnected:false,focus:options=>moves.push(['focus',options]),getBoundingClientRect:()=>({top:800}),ownerDocument:{defaultView:{scrollY:20,scrollX:0,scrollTo:options=>moves.push(['scroll',options])},querySelector:()=>({getBoundingClientRect:()=>({height:180})})}}
focus.request(caseId)
assert.equal(focus.ready(caseId,null),false,'a result that has not mounted must not consume the request')
assert.equal(focus.ready(caseId,element),false,'a detached result must not consume the request')
element.isConnected=true
assert.equal(focus.ready('other-case',element),false,'another case cannot consume the request')
assert.equal(focus.ready(caseId,element),true)
assert.deepEqual(moves,[['focus',{preventScroll:true}],['scroll',{top:624,left:0,behavior:'instant'}]],'the result must remain below the measured sticky header')
assert.equal(focus.ready(caseId,element),false,'refreshing the result must not scroll again')
focus.request(caseId);focus.request(null)
assert.equal(focus.ready(caseId,element),false,'leaving the case must cancel the pending request')

// Render production components and invoke their real export callbacks. This
// regression check uses no browser session and makes no network/model calls.
const require=createRequire(import.meta.url),cache=new Map()
function load(file){
  file=path.resolve(file)
  if(file.endsWith('.css'))return {}
  if(cache.has(file))return cache.get(file).exports
  const mod={exports:{}};cache.set(file,mod)
  const code=transformSync(fs.readFileSync(file,'utf8'),{filename:file,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}).code
  const localRequire=specifier=>{
    if(!specifier.startsWith('.'))return require(specifier)
    const target=path.resolve(path.dirname(file),specifier)
    const resolved=[target,target+'.js',target+'.mjs'].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile())
    if(!resolved)throw new Error('Cannot resolve '+specifier+' from '+file)
    return load(resolved)
  }
  new Function('require','module','exports',code)(localRequire,mod,mod.exports)
  return mod.exports
}
const {RoadmapLetters}=load('app/modules/cases/RoadmapLetters.js')
const {CustomerRoadmapView}=load('app/modules/cases/CustomerRoadmapPanel.js')
const record=roadmapTestRecord(),original=structuredClone(record)
assert.ok(record.result.letters.length>0)
const visibleNodes=element=>Array.isArray(element)?element.flatMap(visibleNodes):!React.isValidElement(element)?[]:[element,...(element.type==='details'?[]:visibleNodes(element.props.children))]
const buttons=tree=>visibleNodes(tree).filter(node=>node.type==='button')
const exported=[]
const tree=RoadmapLetters({record,onExport:(...args)=>exported.push(args)})
assert.equal(buttons(tree).length,record.result.letters.length*2,'both download buttons must be outside the collapsed preview')
for(const button of buttons(tree))button.props.onClick()
assert.deepEqual(exported,record.result.letters.flatMap(letter=>[['docx',letter.id],['pdf',letter.id]]),'each button must export its own saved letter in the selected format')
for(const blocked of [{busy:true},{stale:true}]){
  const before=exported.length
  const disabled=buttons(RoadmapLetters({record,onExport:(...args)=>exported.push(args),...blocked}))
  assert.ok(disabled.every(button=>button.props.disabled))
  disabled.forEach(button=>button.props.onClick())
  assert.equal(exported.length,before,'blocked exports must remain inactive')
}
assert.equal(buttons(RoadmapLetters({record})).length,0,'read-only rendering must not expose download actions')
const html=options=>renderToStaticMarkup(React.createElement(CustomerRoadmapView,{record,onExport(){},continuation:{canContinue:true},...options}))
for(const full of [false,true]){
  const rendered=html({full})
  assert.ok(rendered.includes(roadmapUi(record.output_language).letters))
  assert.equal((rendered.match(/>PDF<\/button>/g)||[]).length,1+record.result.letters.length,'summary and full view must each expose the report and every letter once')
}
assert.equal((html({continuation:{canContinue:false}}).match(/>PDF<\/button>/g)||[]).length,0,'the existing product access restriction still blocks all result exports')
assert.deepEqual(record,original,'opening and exporting controls must not change the saved case')
console.log('Case result access passed: normal login, workspace/privacy/ownership gates, foreign and missing cases, URL preservation, compact/full React render, direct letter exports and stale/busy/read-only restrictions. No authenticated browser acceptance claimed.')
