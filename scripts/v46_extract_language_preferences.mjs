import fs from 'node:fs'

const workspacePath='app/modules/workspace/WorkspaceApp.js'
const hookPath='app/modules/language/useLanguagePreferences.js'
const guardPath='scripts/test_v46_modular_boundaries.mjs'
const parityPath='scripts/test_v56_modular_parity.mjs'
const readmePath='app/modules/README.md'

const workspace=fs.readFileSync(workspacePath,'utf8')

const oldLanguageImport="import { localeForLanguage, pageTranslations, rtlLanguages, supportedLanguages } from './lib/v30Languages.mjs'"
const newLanguageImport="import { localeForLanguage, pageTranslations } from './lib/v30Languages.mjs'"
if(!workspace.includes(oldLanguageImport) && !workspace.includes(newLanguageImport)) throw new Error('language import anchor missing')

let next=workspace.replace(oldLanguageImport,newLanguageImport)

const publicOrderImport="import { orderCasesByResearch } from '../public/casePriorityV56.mjs'"
const hookImport="import { useLanguagePreferences } from '../language/useLanguagePreferences'"
if(!next.includes(hookImport)){
  if(!next.includes(publicOrderImport)) throw new Error('hook import anchor missing')
  next=next.replace(publicOrderImport,`${publicOrderImport}\n${hookImport}`)
}

next=next.replace(/\nconst languages = supportedLanguages\n/,'\n')

const oldState=`  const [language,setLanguage] = useState('de')\n  const [outputLanguage,setOutputLanguage] = useState('de')`
const newState=`  const {language,setLanguage,outputLanguage,setOutputLanguage} = useLanguagePreferences()`
if(next.includes(oldState)) next=next.replace(oldState,newState)
else if(!next.includes(newState)) throw new Error('language state anchor missing')

const preferenceEffects=`  useEffect(()=>{\n    const queryLanguage = new URLSearchParams(window.location.search).get('lang')\n    const savedLanguage = localStorage.getItem('asgold-language')\n    const savedOutput = localStorage.getItem('asgold-output-language')\n    if(queryLanguage && languages.some(l=>l.key===queryLanguage)) setLanguage(queryLanguage)\n    else if(savedLanguage && languages.some(l=>l.key===savedLanguage)) setLanguage(savedLanguage)\n    if(savedOutput && languages.some(l=>l.key===savedOutput)) setOutputLanguage(savedOutput)\n  },[])\n\n  useEffect(()=>{\n    document.documentElement.lang = language\n    document.documentElement.dir = rtlLanguages.has(language) ? 'rtl' : 'ltr'\n    localStorage.setItem('asgold-language',language)\n    return ()=>{ document.documentElement.dir = 'ltr' }\n  },[language])\n\n  useEffect(()=>{\n    localStorage.setItem('asgold-output-language',outputLanguage)\n    document.documentElement.dataset.outputLanguage=outputLanguage\n    document.dispatchEvent(new CustomEvent('asgold:output-language',{detail:{language:outputLanguage}}))\n  },[outputLanguage])\n\n`
if(next.includes(preferenceEffects)) next=next.replace(preferenceEffects,'')
else if(next.includes("localStorage.setItem('asgold-language',language)")) throw new Error('language preference effect anchor drifted')

fs.writeFileSync(workspacePath,next)

const hook=`'use client'\n\nimport { useEffect, useState } from 'react'\nimport { rtlLanguages, supportedLanguages } from './v36Languages.mjs'\n\nconst interfaceLanguageKey='asgold-language'\nconst outputLanguageKey='asgold-output-language'\n\nfunction isSupportedLanguage(value){\n  return supportedLanguages.some(item=>item.key===value)\n}\n\nexport function useLanguagePreferences(){\n  const [language,setLanguage]=useState('de')\n  const [outputLanguage,setOutputLanguage]=useState('de')\n\n  useEffect(()=>{\n    const queryLanguage=new URLSearchParams(window.location.search).get('lang')\n    const savedLanguage=localStorage.getItem(interfaceLanguageKey)\n    const savedOutputLanguage=localStorage.getItem(outputLanguageKey)\n    if(queryLanguage&&isSupportedLanguage(queryLanguage)) setLanguage(queryLanguage)\n    else if(savedLanguage&&isSupportedLanguage(savedLanguage)) setLanguage(savedLanguage)\n    if(savedOutputLanguage&&isSupportedLanguage(savedOutputLanguage)) setOutputLanguage(savedOutputLanguage)\n  },[])\n\n  useEffect(()=>{\n    document.documentElement.lang=language\n    document.documentElement.dir=rtlLanguages.has(language)?'rtl':'ltr'\n    localStorage.setItem(interfaceLanguageKey,language)\n    return ()=>{ document.documentElement.dir='ltr' }\n  },[language])\n\n  useEffect(()=>{\n    localStorage.setItem(outputLanguageKey,outputLanguage)\n    document.documentElement.dataset.outputLanguage=outputLanguage\n    document.dispatchEvent(new CustomEvent('asgold:output-language',{detail:{language:outputLanguage}}))\n  },[outputLanguage])\n\n  return {language,setLanguage,outputLanguage,setOutputLanguage}\n}\n`
fs.writeFileSync(hookPath,hook)

let guard=fs.readFileSync(guardPath,'utf8')
const existsAnchor="  'app/modules/language/LanguageSwitcher.js',"
const hookExists="  'app/modules/language/useLanguagePreferences.js',"
if(!guard.includes(hookExists)){
  if(!guard.includes(existsAnchor)) throw new Error('guard language list anchor missing')
  guard=guard.replace(existsAnchor,`${existsAnchor}\n${hookExists}`)
}
const workspaceAnchor="const workspace=read('app/modules/workspace/WorkspaceApp.js')"
const hookGuard=`const languagePreferences=read('app/modules/language/useLanguagePreferences.js')\nassert.match(workspace,/useLanguagePreferences/)\nassert.doesNotMatch(workspace,/localStorage\\.setItem\\('asgold-language'/)\nassert.doesNotMatch(workspace,/document\\.documentElement\\.dir/)\nassert.match(languagePreferences,/asgold-language/)\nassert.match(languagePreferences,/asgold-output-language/)\nassert.match(languagePreferences,/asgold:output-language/)\nassert.match(languagePreferences,/rtlLanguages/)`
if(!guard.includes('const languagePreferences=')){
  if(!guard.includes(workspaceAnchor)) throw new Error('guard workspace anchor missing')
  guard=guard.replace(workspaceAnchor,`${workspaceAnchor}\n${hookGuard}`)
}
fs.writeFileSync(guardPath,guard)

let parity=fs.readFileSync(parityPath,'utf8')
const parityWorkspace="const workspace=fs.readFileSync('app/modules/workspace/WorkspaceApp.js','utf8')"
const parityLanguage="const languagePreferences=fs.readFileSync('app/modules/language/useLanguagePreferences.js','utf8')"
if(!parity.includes(parityLanguage)){
  if(!parity.includes(parityWorkspace)) throw new Error('V56 parity workspace anchor missing')
  parity=parity.replace(parityWorkspace,`${parityWorkspace}\n${parityLanguage}`)
}
parity=parity.replace("assert.match(workspace,/document\\.documentElement\\.dataset\\.outputLanguage=outputLanguage/)","assert.match(languagePreferences,/document\\.documentElement\\.dataset\\.outputLanguage=outputLanguage/)")
parity=parity.replace("assert.match(workspace,/CustomEvent\\('asgold:output-language'/)","assert.match(languagePreferences,/CustomEvent\\('asgold:output-language'/)")
if(!parity.includes("assert.match(languagePreferences,/document\\.documentElement\\.dataset\\.outputLanguage=outputLanguage/)")) throw new Error('V56 dataset parity assertion was not moved')
if(!parity.includes("assert.match(languagePreferences,/CustomEvent\\('asgold:output-language'/)")) throw new Error('V56 output event parity assertion was not moved')
fs.writeFileSync(parityPath,parity)

let readme=fs.readFileSync(readmePath,'utf8')
const languageStatus='- `language/`: owns LanguageSwitcher, ExplainerVideoDialog, LegalLanguageContext, output-language helpers, the complete language catalog chain and component translation catalogs. V43/V44 DOM correction layers are removed. Output-language transport no longer relies on DOM polling or global fetch interception.'
const languageStatusNext='- `language/`: owns LanguageSwitcher, ExplainerVideoDialog, LegalLanguageContext, persisted interface/output language preferences, output-language helpers, the complete language catalog chain and component translation catalogs. V43/V44 DOM correction layers are removed. WorkspaceApp no longer owns localStorage/document language synchronization, and output-language transport no longer relies on DOM polling or global fetch interception.'
if(readme.includes(languageStatus)) readme=readme.replace(languageStatus,languageStatusNext)
if(!readme.includes('`useLanguagePreferences.js`')) readme += '\n- `language/useLanguagePreferences.js`: owns persisted interface language, output language, RTL document direction and the existing output-language event compatibility signal.\n'
fs.writeFileSync(readmePath,readme)

console.log('V46 language preference boundary extracted')
