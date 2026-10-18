import {retrieveOfficialEvidence} from '../supabase/functions/_shared/verifiedResearch.mjs'

// Public read-only diagnostic, no accounts, case data or model calls. An
// unavailable authority remains unavailable; this probe cannot approve a case.
const items=[
  {title:'BGH VIII ZR 71/05',url:'https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Art=en&Blank=1.pdf&Datum=2006-1-18&Gericht=bgh&anz=13&nr=35739&pos=7'},
  {title:'BGH VIII ZR 141/17',url:'https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Art=en&Blank=1.pdf&Datum=2019-7-24&Gericht=bgh&anz=18&nr=98242&pos=10'}
]
const observations=[]
const fetched=await retrieveOfficialEvidence(items,['bundesgerichtshof.de'],{fetchImpl:async(url,options)=>{
  try{
    const response=await fetch(url,options)
    observations.push({url,status:response.status,content_type:response.headers.get('content-type')})
    return response
  }catch(error){observations.push({url,error:error.name});throw error}
}})
console.log(JSON.stringify({probe:'public_pdf_availability',live_model_calls:0,customer_acceptance:'pending',observations,retrieved:[...fetched.values()],unavailable:items.filter(item=>!fetched.has(item.url)).map(item=>item.url)}))
