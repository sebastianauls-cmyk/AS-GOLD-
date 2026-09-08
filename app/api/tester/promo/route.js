import { createHash, timingSafeEqual } from 'node:crypto'

const PROMO_HASH='65a16cca81f21c9a137f30c50babe264549e24bde6adf0b3fc0f6503aa1029dd'

function digest(value){
  return createHash('sha256').update(String(value||'').trim().toLowerCase(),'utf8').digest()
}

export async function POST(request){
  let body={}
  try{body=await request.json()}catch{}
  const supplied=digest(body.code)
  const expected=Buffer.from(PROMO_HASH,'hex')
  const ok=supplied.length===expected.length&&timingSafeEqual(supplied,expected)
  return Response.json({ok},{status:ok?200:401,headers:{'Cache-Control':'no-store'}})
}
