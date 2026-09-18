import { notFound } from 'next/navigation'
import { GuidancePreview } from './preview'

export const dynamic='force-dynamic'
export const metadata={title:'ASH V135 · Funktionsvorschau',robots:{index:false,follow:false}}

export default async function Page({searchParams}) {
  if(process.env.VERCEL_ENV==='production')notFound()
  const params=await searchParams
  return <GuidancePreview framed={params.frame==='1'}/>
}
