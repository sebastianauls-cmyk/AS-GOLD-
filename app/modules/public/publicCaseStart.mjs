import { COUNTRY_CATALOG } from '../country/countryRegistry.mjs'
import { LANGUAGE_CATALOG } from '../language/languageRegistry.mjs'

export const PUBLIC_CASE_START_KEY='asgold-public-case-start'
const MAX_AGE=2*60*60*1000
const countries=new Set(COUNTRY_CATALOG.map(item=>item.key))
const languages=new Set(LANGUAGE_CATALOG.map(item=>item.key))

function selectionFrom(value){
  if(!countries.has(value?.home)||!countries.has(value?.target)||!languages.has(value?.output))return null
  return {home:value.home,target:value.target,output:value.output}
}

// Only explicit start actions are retained. Browsing the example has no effects
// on a real case. Keep only three public codes, never account or case contents.
export function createPublicCaseStart({storage=()=>globalThis.sessionStorage,now=()=>Date.now()}={}){
  let loaded=false
  let pending=null
  function cancel(){
    loaded=true
    pending=null
    try{storage()?.removeItem(PUBLIC_CASE_START_KEY)}catch{}
  }
  function stage(value){
    const selection=selectionFrom(value)
    if(!selection)return false
    loaded=true
    pending={...selection,createdAt:now()}
    try{storage()?.setItem(PUBLIC_CASE_START_KEY,JSON.stringify(pending))}catch{}
    return true
  }
  function resume({screen,userId,privacyCurrent,onContinue}){
    if(screen!=='app'||!userId||!privacyCurrent)return false
    if(!loaded){
      loaded=true
      try{pending=JSON.parse(storage()?.getItem(PUBLIC_CASE_START_KEY)||'null')}catch{pending=null}
    }
    const selection=selectionFrom(pending)
    const age=now()-pending?.createdAt
    cancel() // Consume once, including repeated auth events and React effects.
    if(!selection||!Number.isFinite(age)||age<0||age>MAX_AGE)return false
    onContinue(selection)
    return true
  }
  return {stage,resume,cancel}
}
