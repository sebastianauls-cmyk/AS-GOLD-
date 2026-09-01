import assert from 'node:assert/strict'
import fs from 'node:fs'

const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
const flow=fs.readFileSync(new URL('../app/components/HomepageFlowAnchors.js',import.meta.url),'utf8')
const title=fs.readFileSync(new URL('../app/components/HeroTitleStabilizer.js',import.meta.url),'utf8')
const enhancer=fs.readFileSync(new URL('../app/components/HeroCopyEnhancer.js',import.meta.url),'utf8')
const modules=fs.readFileSync(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')

for(const heading of ['Was ist AS Gold?','What is AS Gold?','Qu’est-ce qu’AS Gold ?','AS Gold nedir?','Czym jest AS Gold?','Что такое AS Gold?','ما هو AS Gold؟','AS Gold چیست؟','Ce este AS Gold?','Какво е AS Gold?']){
  assert.ok(title.includes(heading),`missing explanatory intro heading: ${heading}`)
  assert.ok(enhancer.includes(heading),`hero enhancer missing intro heading: ${heading}`)
}

const anchorIndex=layout.indexOf('<HomepageFlowAnchors/>')
const introIndex=layout.indexOf('<ProductIntroCompact/>')
const actionIndex=layout.indexOf('<V37FirstAction/>')
const problemIndex=layout.indexOf('<ProblemNavigator/>')
assert.ok(anchorIndex>=0&&introIndex>anchorIndex&&actionIndex>introIndex&&problemIndex>actionIndex,'homepage components must follow language -> explanation -> capabilities -> action -> input')
assert.ok(flow.indexOf("'asgold-product-intro-compact-slot'")<flow.indexOf("'asgold-v37-first-action-slot'"),'capabilities must precede first action')
assert.ok(flow.indexOf("'asgold-v37-first-action-slot'")<flow.indexOf("'asgold-problem-slot'"),'first action must precede problem input')
assert.doesNotMatch(modules,/asgold-customer-module-slot/)

console.log('V61 intro-flow guard passed in all ten customer languages.')
