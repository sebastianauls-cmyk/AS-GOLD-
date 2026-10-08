import {refreshPublicPrimarySources} from '../../modules/research/primarySourceRefresh.mjs'

export const dynamic='force-dynamic'
export const maxDuration=100

export async function GET(request){
  if(new URL(request.url).search)return Response.json({error:'This public source catalogue accepts no parameters.'},{status:400})
  try{
    const result=await refreshPublicPrimarySources()
    if(!result.complete){
      console.error('Public primary-source refresh incomplete',{fetched:result.records.length,expected:result.expected,failed:result.failed})
      return Response.json({error:'Official sources could not all be freshly retrieved.',fetched:result.records.length,expected:result.expected},{status:503,headers:{'cache-control':'no-store'}})
    }
    return Response.json(result.records,{headers:{'cache-control':'public, max-age=0, s-maxage=3600','x-content-type-options':'nosniff'}})
  }catch(error){
    console.error('Public primary-source refresh failed',{name:error?.name})
    return Response.json({error:'Public source refresh unavailable.'},{status:503,headers:{'cache-control':'no-store'}})
  }
}
