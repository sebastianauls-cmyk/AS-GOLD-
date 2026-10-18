// Text-only, pinned serverless PDF.js build. Loaded only for an allowed PDF;
// never give the parser a URL, credentials, or permission to fetch assets.
let pdfjs, pending=Promise.resolve()
const MAX_PAGES=40, MAX_ITEMS=50000
class NoExternalData {
  async fetch(){throw new Error('External PDF resources are disabled')}
}

export function extractOfficialPdfText(bytes,{signal,maxChars=48000}={}){
  // Serial parsing avoids multiplying the parser's memory use across the
  // concurrent official-source fetches. Queue time uses the fetch deadline.
  const work=pending.then(()=>extract(bytes,signal,Math.max(0,Math.min(maxChars,48000))))
  pending=work.then(()=>{},()=>{})
  return work
}

async function extract(bytes,signal,maxChars){
  if(!(bytes instanceof Uint8Array)||bytes.length>1500000||bytes.length<8||
      new TextDecoder('ascii').decode(bytes.subarray(0,5))!=='%PDF-'||!maxChars||signal?.aborted)return null
  let task,onAbort
  try{
    const aborted=new Promise((_,reject)=>{
      onAbort=()=>reject(new Error('PDF retrieval deadline exceeded'))
      signal?.addEventListener('abort',onAbort,{once:true})
    })
    const reading=(async()=>{
      const {getDocument}=await (pdfjs??=import('npm:unpdf@1.9.0/pdfjs'))
      signal?.throwIfAborted()
      task=getDocument({data:bytes,isEvalSupported:false,disableFontFace:true,
        useSystemFonts:false,useWorkerFetch:false,useWasm:false,maxImageSize:0,
        isOffscreenCanvasSupported:false,isImageDecoderSupported:false,
        stopAtErrors:true,disableAutoFetch:true,disableStream:true,disableRange:true,
        CMapReaderFactory:NoExternalData,StandardFontDataFactory:NoExternalData,
        WasmFactory:NoExternalData,verbosity:0})
      const pdf=await task.promise
      if(!Number.isInteger(pdf.numPages)||pdf.numPages<1||pdf.numPages>MAX_PAGES)return null
      let text='',itemsSeen=0,truncated=false,previous=''
      for(let number=1;number<=pdf.numPages;number++){
        signal?.throwIfAborted()
        const page=await pdf.getPage(number)
        try{
          // Complete one page before stopping at the character boundary.
          // Cancelling PDF.js's message stream mid-page can enqueue into a
          // closed stream on Deno. Pages and input bytes are capped above.
          const content=await page.getTextContent({includeMarkedContent:false})
          signal?.throwIfAborted()
          for(const item of content.items){
              if(typeof item.str!=='string')continue
              if(++itemsSeen>MAX_ITEMS)return null
              // Separate independently positioned numeric items. Otherwise two
              // columns/rows printing 960 and 288 can become a false 960288.
              const part=item.str.replace(/\s+/gu,' ').trim()
              if(!part)continue
              if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/u.test(part))return null
              const separator=/\d[\d., ]*$/u.test(previous)&&/^[+−-]?\d/u.test(part)?' | ':' '
              text+=(text?separator:'')+part
              previous=part
              if(text.length>maxChars){truncated=true;break}
          }
        }finally{page.cleanup()}
        if(truncated)break
        // An explicit page boundary also prevents cross-page number grouping.
        if(number<pdf.numPages&&text){text+=' ; ';previous=''}
      }
      text=text.trim()
      if(text.length<100)return null // Scanned/image-only PDFs are not evidence.
      return {text:text.slice(0,maxChars),truncated:truncated||text.length>maxChars}
    })()
    return await Promise.race([reading,aborted])
  }catch{return null}
  finally{
    signal?.removeEventListener('abort',onAbort)
    if(task)await task.destroy().catch(()=>{})
  }
}
