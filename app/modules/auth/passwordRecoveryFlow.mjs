// Keep only the routing intent. Supabase owns all tokens and session validation.
let active=false
let revision=0

const currentBrowser=()=>typeof window==='undefined'?null:window

export function isPasswordRecoveryLocation(location){
  if(!location)return false
  const query=new URLSearchParams(location.search||'')
  const hash=new URLSearchParams((location.hash||'').replace(/^#/,''))
  return query.get('start')==='recovery'||query.get('type')==='recovery'||hash.get('type')==='recovery'
}

function activate(){
  if(!active){active=true;revision+=1}
}

export function capturePasswordRecovery(browser=currentBrowser()){
  if(isPasswordRecoveryLocation(browser?.location))activate()
}

export function isPasswordRecoveryActive(){return active}
export function passwordRecoveryRevision(){return revision}

export function enterPasswordRecovery(browser=currentBrowser()){
  activate()
  if(!browser?.history)return
  const url=new URL(browser.location.href)
  if(url.searchParams.get('start')==='recovery')return
  url.searchParams.set('start','recovery')
  // A non-secret marker survives a reload after the SDK removes the token hash.
  browser.history.replaceState(browser.history.state,'',`${url.pathname}${url.search}${url.hash}`)
}

export function finishPasswordRecovery(browser=currentBrowser()){
  if(active){active=false;revision+=1}
  if(!browser?.history)return
  const url=new URL(browser.location.href)
  let changed=false
  if(url.searchParams.get('start')==='recovery'){url.searchParams.delete('start');changed=true}
  if(url.searchParams.get('type')==='recovery'){url.searchParams.delete('type');changed=true}
  if(new URLSearchParams(url.hash.replace(/^#/,'')).get('type')==='recovery'){url.hash='';changed=true}
  if(changed)browser.history.replaceState(browser.history.state,'',`${url.pathname}${url.search}${url.hash}`)
}
