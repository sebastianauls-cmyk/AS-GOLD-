import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {transformSync} from 'next/dist/build/swc/index.js'
import {workspaceOverview} from '../app/modules/workspace/workspaceOverview.mjs'
import {workspaceOverviewCopy} from '../app/modules/workspace/workspaceOverviewCopy.mjs'

const now=new Date('2026-09-20T12:00:00Z')
const owner='owner',stamp='2026-09-20T10:00:00Z'
const item={id:'case',owner_id:owner,title:'Synthetischer Fall',updated_at:stamp,traffic_light:'red',deadline_at:null}
const doc={id:'doc',owner_id:owner,case_id:item.id,title:'Synthetischer Beleg.pdf',updated_at:stamp,extracted_text:''}
const data={cases:[item],documents:[doc],approvals:[],assessments:[],clients:[]}
assert.equal(workspaceOverview({},now).next.kind,'create')
let state=workspaceOverview(data,now)
assert.equal(state.next.kind,'read');assert.equal(state.next.item.id,doc.id)
assert.equal(state.deadlines.dated.length,0);assert.equal(state.deadlines.unresolved.length,1,'red colour alone never creates a confirmed deadline')
const withDraft={...doc,analysis_draft:{result:{status:'completed',extracted_text:'Synthetischer Text'}}}
assert.equal(workspaceOverview({...data,documents:[withDraft]},now).reviewDocuments.length,1,'retained AI draft is still unreviewed')
const readDoc={...doc,extracted_text:'Synthetischer Text'}
const assessment={id:'a',owner_id:owner,case_id:item.id,source_document_id:doc.id,source_document_updated_at:stamp,source_reviewed_at:stamp,source_locator:'Seite 1',source_excerpt:'Synthetischer Text'}
assert.equal(workspaceOverview({...data,documents:[readDoc]},now).next.kind,'review')
assert.equal(workspaceOverview({...data,documents:[readDoc],assessments:[assessment]},now).reviewDocuments.length,0)
assert.equal(workspaceOverview({...data,documents:[{...readDoc,updated_at:'2026-09-20T11:00:00Z'}],assessments:[assessment]},now).reviewDocuments.length,1,'changed sources invalidate a previous review')
assert.equal(workspaceOverview({...data,documents:[readDoc],assessments:[assessment,{...assessment,id:'new',supersedes_assessment_id:'a',source_reviewed_at:null}]},now).reviewDocuments.length,1,'superseded reviews do not clear the task')
const approval={id:'approval',case_id:item.id,subject:'Synthetisches Schreiben',status:'pending'}
assert.equal(workspaceOverview({...data,approvals:[{...approval,status:'approved'},{...approval,id:'rejected',status:'rejected'}]},now).pendingApprovals.length,0)
assert.equal(workspaceOverview({...data,approvals:[approval]},now).next.kind,'approval')
assert.equal(workspaceOverview({...data,cases:[{...item,deadline_at:'2026-09-21T12:00:00Z'}],approvals:[approval]},now).next.kind,'deadline')
assert.equal(workspaceOverview({...data,cases:[{...item,deadline_at:'unknown'}]},now).next.kind,'read')

// Execute the real React surface and its button callbacks. SSR checks every
// language and native collapsed menus; this is not a browser viewport test.
const require=createRequire(import.meta.url),cache=new Map()
function load(file){
  file=path.resolve(file)
  if(cache.has(file))return cache.get(file).exports
  const mod={exports:{}};cache.set(file,mod)
  const code=transformSync(fs.readFileSync(file,'utf8'),{filename:file,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}).code
  const localRequire=specifier=>{
    if(!specifier.startsWith('.'))return require(specifier)
    const target=path.resolve(path.dirname(file),specifier)
    const resolved=[target,target+'.js',target+'.mjs',target+'/index.js'].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile())
    if(resolved.endsWith('.json'))return JSON.parse(fs.readFileSync(resolved,'utf8'))
    return load(resolved)
  }
  new Function('require','module','exports',code)(localRequire,mod,mod.exports)
  return mod.exports
}
const {DashboardSurface}=load('app/modules/workspace/DashboardSurface.js')
const {ProtectedWorkspaceShell}=load('app/modules/workspace/ProtectedWorkspaceShell.js')
const {appText}=load('app/modules/workspace/workspaceText.js')
Object.assign(appText,load('app/modules/language/languageRegistry.mjs').pageTranslations.appText)
const events=[]
const props={core:{},handleQuickAction:(...args)=>events.push(['quick',...args]),onOpenDocument:doc=>events.push(['document',doc.id]),onOpenApproval:approval=>events.push(['approval',approval.id]),onStartSyntheticCase:()=>{},onBack:()=>events.push(['back']),a:appText.de,user:{id:owner,email:'test@example.invalid'},currentTier:'business',setSection:key=>events.push(['section',key]),rt:{goals:[],title:'Tarifauswahl',lead:'Optionale Tarifauswahl'},selectedGoal:'',setSelectedGoal(){},setShowRecommendation(){},showRecommendation:false,currentPlan:{name:'Business'},access:{app_role:'owner',permissions:{}},data,lt:{contract:'Konto'},promo:{testAccessStatus:'Bis {date}'},guestCopy:{displayName:'Test'}}
const nodes=element=>Array.isArray(element)?element.flatMap(nodes):!React.isValidElement(element)?[]:[element,...nodes(element.props.children)]
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']){
  const c=workspaceOverviewCopy(language)
  for(const value of Object.values(c))assert.ok(value)
  const html=renderToStaticMarkup(React.createElement(DashboardSurface,{...props,a:appText[language]}))
  assert.ok(html.includes(c.title));assert.ok(html.includes(doc.title));assert.ok(html.includes(c.openDocument))
  assert.match(html,/<details class="workspaceMore">/)
  assert.doesNotMatch(html,/dashboardGuideSecondary|Business-Steuerung|Kunden- und Fallbestand steuern|evidenceActionPanel|aliReferenceCase/)
  assert.ok(html.indexOf('workspaceNext')<html.indexOf('dashboardInsiderEntry'),'real task precedes internal controls')
  const shell=renderToStaticMarkup(React.createElement(ProtectedWorkspaceShell,{language,outputLanguage:language,onLanguageChange(){},onOutputLanguageChange(){},onLogout(){},onOpenDeadlines(){},deadlineCopy:{title:'Termine',button:'Termine',datedShort:'dat',unresolvedShort:'offen'},unresolvedDeadlineCount:1,languageLabel:'Sprache',outputLanguageLabel:'Ausgabe',logoutLabel:'Abmelden',children:'INHALT'}))
  assert.match(shell,/<details class="workspaceSettings">/)
  assert.ok(shell.includes(c.settings))
  assert.equal((shell.match(/persistentDeadlineButton/g)||[]).length,1)
  assert.ok(shell.indexOf('persistentDeadlineButton')<shell.indexOf('</header>'),'deadline shortcut is in the header, not over the page bottom')
  assert.ok(shell.indexOf('countrySwitcher')<shell.indexOf('</details>'),'country remains reachable in settings')
}
let tree=nodes(DashboardSurface(props))
tree.find(node=>node.type==='button'&&node.props.className==='primary').props.onClick()
assert.deepEqual(events.pop(),['document','doc'])
tree.find(node=>node.type==='button'&&node.props.className==='workspaceOverviewCard').props.onClick()
assert.deepEqual(events.pop(),['section','cases'])
tree.find(node=>node.type==='button'&&node.props.className==='workspaceRecentCase').props.onClick()
assert.deepEqual(events.pop(),['quick','open-case',item])
tree=nodes(DashboardSurface({...props,data:{...data,approvals:[approval]}}))
tree.find(node=>node.type==='button'&&node.props.className==='primary').props.onClick()
assert.deepEqual(events.pop(),['approval','approval'],'a pending letter opens its preview; it is not approved or sent')
tree=nodes(DashboardSurface({...props,data:{cases:[],documents:[],approvals:[],clients:[]}}))
tree.find(node=>node.type==='button'&&node.props.className==='primary').props.onClick()
assert.deepEqual(events.pop(),['quick','case'])
console.log('Workspace overview passed: real pending tasks, unchanged evidence gates, no invented deadlines, direct document/case/approval navigation, empty state and actual React rendering in 11 languages with collapsed settings. Browser viewport acceptance remains separate.')
