import {PRIMARY_SOURCE_CACHE} from '../../../supabase/functions/_shared/primarySourceCache.mjs'
import {retrieveOfficialEvidence} from '../../../supabase/functions/_shared/verifiedResearch.mjs'

// Public statutes only: callers cannot supply destinations, credentials or case data.
export const PRIMARY_REFRESH_URLS=Object.freeze(PRIMARY_SOURCE_CACHE.map(item=>item.url))

export async function refreshPublicPrimarySources({fetchImpl=fetch}={}){
  const records=[],failed=[]
  for(let offset=0;offset<PRIMARY_REFRESH_URLS.length;offset+=5){
    const urls=PRIMARY_REFRESH_URLS.slice(offset,offset+5)
    const fetched=await retrieveOfficialEvidence(urls.map(url=>({url})),['www.gesetze-im-internet.de'],{
      fetchImpl,maxSources:5,maxChars:48000,snapshotRecords:[]
    })
    for(const url of urls){
      const item=fetched.get(url)
      const section=/\/__([a-z0-9]+)\.html$/.exec(url)?.[1]
      const provision=new RegExp('§\\s*'+section+'\\b','i')
      if(!item||item.truncated||item.final_url!==url||!provision.test(item.title)||!provision.test(item.source_text)){
        failed.push(url)
        continue
      }
      records.push({...item,retrieval_mode:'verified_snapshot'})
    }
    // Stop after a completely unreachable first batch; no repeated timeout storm.
    if(offset===0&&records.length===0)break
  }
  return {records,failed,expected:PRIMARY_REFRESH_URLS.length,complete:records.length===PRIMARY_REFRESH_URLS.length}
}
