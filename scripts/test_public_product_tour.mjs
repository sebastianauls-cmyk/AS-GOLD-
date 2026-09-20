import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {transformSync} from 'next/dist/build/swc/index.js'
import {publicExperienceCopy,publicTourAreas} from '../app/modules/public/publicExperienceCopy.mjs'
import {publicLanguageCountryCopy} from '../app/modules/public/publicLanguageCountryCopy.mjs'
import {publicCaseStartCopy} from '../app/modules/public/publicCaseStartCopy.mjs'
import {createPublicCaseStart} from '../app/modules/public/publicCaseStart.mjs'

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
const {PublicLanding,productCopy}=load('app/modules/public/PublicLanding.js')
const {PublicHeader}=load('app/modules/public/PublicHeader.js')
const {PublicLanguageModules}=load('app/modules/public/PublicLanguageModules.js')
const {PublicTourPanel,PublicTourChoices}=load('app/modules/public/PublicProductTour.js')
const {PublicPricingSection}=load('app/modules/public/PublicPricingSection.js')
const {PublicLanguageCountryView}=load('app/modules/public/PublicLanguageCountryModule.js')
const {COUNTRY_CATALOG}=load('app/modules/country/countryRegistry.mjs')
const {LANGUAGE_CATALOG,pageTranslations}=load('app/modules/language/languageRegistry.mjs')
const catalogs={...load('app/modules/public/catalog.js'),...load('app/modules/public/publicUi.js'),...load('app/modules/workspace/workspaceText.js'),...load('app/modules/pricing/catalog.js')}
for(const [key,translations] of Object.entries(pageTranslations))if(catalogs[key])Object.assign(catalogs[key],translations)
const {paymentTranslations}=load('app/modules/payments/paymentTranslations.mjs')
const nodes=element=>Array.isArray(element)?element.flatMap(nodes):!React.isValidElement(element)?[]:[element,...nodes(element.props.children)]
const events=[]
const callbacks={setLanguage:value=>events.push(['language',value]),setOutputLanguage:value=>events.push(['output',value]),setScreen:value=>events.push(['screen',value]),onStartLanguageCase(){},setSelectedPublicCase(){},setSelectedGoal(){},setShowRecommendation(){}}
const serialize=element=>renderToStaticMarkup(element)
for(const {key:language,rtl} of LANGUAGE_CATALOG){
  const c=publicExperienceCopy(language),pc=productCopy[language]
  const cross=publicLanguageCountryCopy(language)
  const start=publicCaseStartCopy(language)
  assert.deepEqual(Object.keys(start).sort(),Object.keys(publicCaseStartCopy('de')).sort())
  assert.deepEqual(Object.keys(cross).sort(),Object.keys(publicLanguageCountryCopy('de')).sort(),`${language}: language/country module fully translated`)
  assert.deepEqual(Object.keys(c).sort(),Object.keys(publicExperienceCopy('de')).sort(),`${language}: complete copy`)
  if(language!=='de')assert.notEqual(c.headline,publicExperienceCopy('de').headline)
  const localizedPlans=catalogs.plans.map((plan,index)=>{
    const translated=catalogs.planText[language]?.[plan.key]
    const base=translated?{...plan,audience:translated[0],checks:translated[1],result:translated[2],excluded:translated[3]}:plan
    return {...base,...catalogs.planJourney[language][plan.key],level:index+1}
  })
  const props={...callbacks,t:catalogs.ui[language],a:catalogs.appText[language],payment:paymentTranslations[language],paymentConfig:{enabled:false},language,outputLanguage:language==='de'?'fr':'de',cd:catalogs.caseDiscoveryText[language],pa:catalogs.publicAudienceText[language],activePublicCase:catalogs.caseDiscoveryText[language].cases[0],tt:catalogs.transparencyText[language],jl:catalogs.journeyLabels[language],localizedPlans,rt:catalogs.recommendationText[language],selectedGoal:'',showRecommendation:false,recommendedPlan:localizedPlans[0],recommendedTier:'free',eur:value=>`${value} €`,period:catalogs.periodText[language],terms:catalogs.terms,monthsLabel:value=>String(value)}
  const html=serialize(React.createElement(PublicLanding,props))
  assert.ok(html.includes(c.headline));assert.ok(html.includes(c.tour))
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,'one clear main heading')
  assert.match(html,new RegExp(`class="publicProductPage" lang="${language}" dir="${rtl?'rtl':'ltr'}"`))
  const header=html.slice(html.indexOf('<header'),html.indexOf('</header>'))
  assert.equal((header.match(/aria-haspopup="listbox"/g)||[]).length,2,'both language selectors are directly visible')
  assert.doesNotMatch(header,/<details/,'language choices must not be hidden in a menu')
  assert.doesNotMatch(header,/installAppButton|publicPresenterRow/,'video and installation stay with the explanation, not in the compact header')
  assert.equal((html.match(/class="primary installAppButton"/g)||[]).length,1,'one installation control')
  assert.ok(html.includes('data-explainer-video-section'),'video remains available')
  assert.ok(html.includes('id="asgold-problem-navigator-react"'),'input and microphone remain reachable')
  for(const id of ['funktionen','ablauf','fallarten','preise']){
    assert.ok(header.includes(`href="#${id}"`));assert.ok(html.includes(`id="${id}"`))
  }
  assert.ok(html.indexOf('id="funktionen"')<html.indexOf('id="preise"'),'understand the product before choosing a plan')
  assert.ok(html.includes('href="#sprachen-rechtsraeume"'),'translation and legal comparison are visible from the introduction')
  assert.ok(html.indexOf('id="funktionen"')<html.indexOf('id="sprachen-rechtsraeume"'),'general capabilities for domestic and business cases precede the optional language/country explanation')
  assert.ok(html.includes(cross.quote),'Poland/Germany example is visible initially')
  assert.ok(html.includes(start.start),'the example offers a direct start')
  for(let index=0;index<COUNTRY_CATALOG.length;index++){
    const example={home:COUNTRY_CATALOG[index].key,target:COUNTRY_CATALOG[(index+5)%COUNTRY_CATALOG.length].key,output:language}
    const changes=[]
    const view=PublicLanguageCountryView({language,example,onChange:(key,value)=>changes.push([key,value]),idPrefix:'country-test'})
    const controls=nodes(view).filter(node=>node.type==='select')
    assert.equal(controls.length,3)
    assert.deepEqual(controls.slice(0,2).map(node=>node.props.children.map(option=>option.props.value)),[COUNTRY_CATALOG.map(item=>item.key),COUNTRY_CATALOG.map(item=>item.key)])
    assert.deepEqual(controls[2].props.children.map(option=>option.props.value),LANGUAGE_CATALOG.map(item=>item.key))
    controls[0].props.onChange({target:{value:'TR'}})
    controls[1].props.onChange({target:{value:'US'}})
    controls[2].props.onChange({target:{value:'fa'}})
    assert.deepEqual(changes,[['home','TR'],['target','US'],['output','fa']],'the three choices emit independent changes')
    assert.equal(example.output,language,'preview interactions never mutate caller or account settings')
    const preview=serialize(view)
    assert.ok(preview.includes(cross.translate));assert.ok(preview.includes(cross.explain));assert.ok(preview.includes(cross.compare));assert.ok(preview.includes(cross.note))
    assert.doesNotMatch(preview,/\{(?:home|target|language|languages|countries)\}/,'all dynamic labels are replaced')
  }
  const same=serialize(PublicLanguageCountryView({language,example:{home:'DE',target:'DE',output:language},onChange(){},idPrefix:'same-country'}))
  assert.ok(same.includes(cross.same),'same-country preview does not invent a difference')
  const selection={home:'PL',target:'DE',output:language}
  const entry=createPublicCaseStart({storage:()=>null})
  const entryView=PublicLanguageCountryView({language,example:selection,onChange(){},idPrefix:'entry',onStart:(value,screen)=>{entry.stage(value);events.push(['entry',screen])}})
  const startButtons=nodes(entryView).filter(node=>node.type==='button')
  assert.equal(startButtons.length,2)
  for(const [index,screen] of ['register','login'].entries()){
    startButtons[index].props.onClick()
    assert.deepEqual(events.pop(),['entry',screen])
    let continued=null
    assert.equal(entry.resume({screen:'app',userId:'synthetic-user',privacyCurrent:true,onContinue:value=>{continued=value}}),true)
    assert.deepEqual(continued,selection,'both actual buttons retain all three independent choices')
  }
  assert.equal((html.match(/id="plan-/g)||[]).length,localizedPlans.length)
  assert.equal((html.match(/<details class="publicPlanDetails">/g)||[]).length,localizedPlans.length)
  assert.doesNotMatch(html,/v131ReleaseBand|v131Journey|featureGrid|processBlock|class="capGrid"/,'duplicate product lists removed')
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(new Set(ids).size,ids.length,'no duplicate IDs')
  const areas=publicTourAreas(pc,c)
  assert.equal(areas.length,8)
  const covered=areas.flatMap(area=>area.items.map(([title])=>title))
  // The export feature is replaced by a more complete list of the implemented formats.
  pc.features.forEach((feature,index)=>{if(index!==9)assert.ok(covered.includes(feature[1]),`${language}: ${feature[1]}`)})
  for(const area of areas){
    const panel=PublicTourPanel({area,c,onRegister:()=>events.push(['screen','register'])})
    const markup=serialize(panel)
    assert.ok(markup.includes(c.example));assert.ok(markup.includes(area.items[0][1].replaceAll('&','&amp;')))
    nodes(panel).find(node=>node.type==='button').props.onClick();assert.deepEqual(events.pop(),['screen','register'])
    const choices=nodes(PublicTourChoices({areas,selected:area.key,c,onSelect:key=>events.push(['area',key])})).filter(node=>node.type==='button')
    assert.equal(choices.filter(node=>node.props['aria-pressed']).length,1)
    choices.find(node=>node.props.id===`public-tour-${area.key}`).props.onClick();assert.deepEqual(events.pop(),['area',area.key])
  }
  const head=PublicHeader({...props,c,caseNavLabel:props.cd.nav,onLanguageChange:callbacks.setLanguage,onOutputLanguageChange:callbacks.setOutputLanguage,onScreenChange:callbacks.setScreen})
  const languageNode=nodes(head).find(node=>node.type===PublicLanguageModules)
  languageNode.props.onLanguageChange('ar');assert.deepEqual(events.pop(),['language','ar'])
  languageNode.props.onOutputLanguageChange('vi');assert.deepEqual(events.pop(),['output','vi'])
  nodes(head).find(node=>node.type==='button').props.onClick();assert.deepEqual(events.pop(),['screen','login'])
  const pricing=PublicPricingSection({...props,c,onRegister:()=>events.push(['screen','register'])})
  const registerButtons=nodes(pricing).filter(node=>node.type==='button')
  assert.equal(registerButtons.length,localizedPlans.length)
  registerButtons.forEach(button=>{button.props.onClick();assert.deepEqual(events.pop(),['screen','register'])})
}
for(const file of ['PublicProductTour.js','publicExperienceCopy.mjs','PublicLanguageCountryModule.js','publicLanguageCountryCopy.mjs'])assert.doesNotMatch(fs.readFileSync(`app/modules/public/${file}`,'utf8'),/supabase|fetch\(|axios/,'the public preview must never fetch private case records or trigger AI')
console.log('Public product journey passed: 11 languages, 14 countries in independent origin/target selectors, plain explanation and translation preview, same-country handling, 8 tour areas and their callbacks, registration/login, tariffs, video and one installation entry. Browser layout acceptance remains separate.')
