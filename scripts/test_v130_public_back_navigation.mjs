import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import React from 'react'
import { transformSync } from 'next/dist/build/swc/index.js'
import { publicNavigationCopy, workspaceEntryHref } from '../app/modules/public/publicNavigation.mjs'
import { resolveWorkspaceEntry } from '../app/modules/workspace/sessionEntry.mjs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8')
const landing=read('app/modules/public/PublicLanding.js')
const publicLanguages=read('app/modules/public/PublicLanguageModules.js')
const css=read('app/globals.css')
const v130Styles=css.slice(css.indexOf('/* V130:'))

assert.ok(APP_RELEASE.number>=130)
assert.equal(APP_VERSION,`V${APP_RELEASE.number}`)
assert.match(landing,/<PublicHeader[\s\S]*?\/>\s*\{hasWorkspaceSession[\s\S]*?<a className="publicPageBackButton" data-persistent-back/,'the public back button must be rendered outside and after the filtered header')
assert.match(landing,/window\.scrollTo\(\{top:0,left:0,behavior:reducedMotion\?'auto':'smooth'\}\)/,'the public return action must lead back to the top of the page')
assert.match(landing,/prefers-reduced-motion: reduce/,'the scrolling behavior must respect reduced-motion preferences')
assert.doesNotMatch(publicLanguages,/className="publicBackButton" data-persistent-back/,'the language reset must not masquerade as the page return control')
assert.match(publicLanguages,/language!==['"]de['"]\|\|outputLanguage!==['"]de['"]/,'the separate German reset should only appear when a language actually needs resetting')
assert.match(v130Styles,/\.publicPageBackButton\[data-persistent-back\]\{[\s\S]*?position:fixed/,'the public page return control must stay attached to the viewport')
assert.match(v130Styles,/\.publicTop \.publicBackButton\{[\s\S]*?position:static/,'the language reset must remain inside the header instead of creating a second floating control')

// Exercise the real header controls without a browser or credentials. The
// existing session/access recovery suites cover the guarded entry itself.
const require=createRequire(import.meta.url),cache=new Map()
function load(file){
  file=path.resolve(file)
  if(cache.has(file))return cache.get(file).exports
  const mod={exports:{}};cache.set(file,mod)
  const code=transformSync(fs.readFileSync(file,'utf8'),{filename:file,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}).code
  const localRequire=specifier=>{
    if(!specifier.startsWith('.'))return require(specifier)
    const target=path.resolve(path.dirname(file),specifier)
    const resolved=[target,target+'.js',target+'.mjs'].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile())
    if(!resolved)throw new Error('Cannot resolve '+specifier)
    return load(resolved)
  }
  new Function('require','module','exports',code)(localRequire,mod,mod.exports)
  return mod.exports
}
const { PublicHeader }=load('app/modules/public/PublicHeader.js')
const nodes=element=>Array.isArray(element)?element.flatMap(nodes):!React.isValidElement(element)?[]:[element,...nodes(element.props.children)]
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']){
  const changes=[]
  const props={language,t:{login:'Sign in'},onScreenChange:screen=>changes.push(screen)}
  const signedIn=nodes(PublicHeader({...props,hasWorkspaceSession:true}))
  const entry=signedIn.find(node=>node.type==='a')
  assert.ok(entry,language+': existing users receive a visible return link')
  assert.equal(entry.props.children,publicNavigationCopy(language).workspace)
  const url=new URL(entry.props.href,'https://example.invalid')
  assert.equal(url.origin,'https://example.invalid')
  assert.equal(url.pathname,'/','return must restart ordinary session checking')
  assert.equal(url.searchParams.get('lang'),language)
  assert.equal(url.searchParams.get('start'),'login','no session must fall back to login')
  assert.equal(url.searchParams.size,2,'return link carries no credentials or user identity')
  assert.deepEqual(resolveWorkspaceEntry(null,url.searchParams.get('start')),{kind:'screen',screen:'login'})
  assert.deepEqual(resolveWorkspaceEntry({user:{id:'synthetic-user'}},url.searchParams.get('start')),{kind:'session'})
  const signedOut=nodes(PublicHeader(props))
  assert.equal(signedOut.filter(node=>node.type==='a').length,0)
  const login=signedOut.find(node=>node.type==='button')
  login.props.onClick()
  assert.deepEqual(changes,['login'])
}
assert.equal(workspaceEntryHref('unexpected'),'/?start=login&lang=de')
assert.equal(publicNavigationCopy('de').top,'↑ Nach oben','scroll-to-top must not be labelled as back navigation')
assert.match(landing,/onClick={returnToPublicStart}[^>]*>{navigation.top}/)
assert.match(landing,/href={workspaceEntryHref\(language\)}>{navigation.returnToWorkspace}/)
console.log('Public navigation passed: actual header return links in 11 languages, ordinary authenticated entry, signed-out login fallback, clear top label and viewport control placement.')
