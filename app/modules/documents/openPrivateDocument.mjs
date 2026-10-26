// Reserve the tab during the tap; opening it after the signed-URL request is
// blocked by mobile browsers. A blocked tab gets a normal, explicit fallback link.
function textMime(filePath='') {
  const extension=String(filePath).split('?')[0].split('.').pop()?.toLowerCase()
  return extension==='txt'?'text/plain':extension==='csv'?'text/csv':''
}

function textCharset(bytes) {
  if(bytes[0]===0xff&&bytes[1]===0xfe)return 'utf-16le'
  if(bytes[0]===0xfe&&bytes[1]===0xff)return 'utf-16be'
  return 'utf-8'
}

async function browserSafeOriginalUrl(browser,signedUrl,filePath) {
  const mime=textMime(filePath)
  if(!mime||typeof browser.fetch!=='function'||typeof browser.Blob!=='function'||typeof browser.URL?.createObjectURL!=='function')return {url:signedUrl,release:null}
  try{
    const response=await browser.fetch(signedUrl,{method:'GET',credentials:'omit'})
    if(!response.ok)return {url:signedUrl,release:null}
    const buffer=await response.arrayBuffer()
    const bytes=new Uint8Array(buffer)
    const url=browser.URL.createObjectURL(new browser.Blob([bytes],{type:`${mime};charset=${textCharset(bytes)}`}))
    let released=false
    return {url,release(){if(released)return;released=true;browser.URL.revokeObjectURL?.(url)}}
  }catch{
    // Direct navigation remains available if a browser cannot fetch the signed
    // object itself. It is still the same private, short-lived URL.
    return {url:signedUrl,release:null}
  }
}

export async function openPrivateDocument({browser, getSignedUrl, filePath=''}) {
  let tab = null
  try {
    tab = browser.open('about:blank', '_blank')
    if (tab) tab.opener = null
    const {data, error} = await getSignedUrl()
    if (error || !data?.signedUrl) throw error || new Error('File URL unavailable')
    const original=await browserSafeOriginalUrl(browser,data.signedUrl,filePath)
    if (tab && !tab.closed) {
      tab.location.replace(original.url)
      return original.release?{opened:true,url:'',release:original.release}:{opened:true,url:''}
    }
    return original.release?{opened:false,url:original.url,release:original.release}:{opened:false,url:original.url}
  } catch (error) {
    if (tab && !tab.closed) tab.close()
    throw error
  }
}
