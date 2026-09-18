import { notFound } from 'next/navigation'
import { RoadmapPreview } from './preview'
export const dynamic='force-dynamic'
export const metadata={title:'ASH V136 · Kundenfahrplan ausprobieren',robots:{index:false,follow:false}}
export default async function Page({searchParams}) {
  if(process.env.VERCEL_ENV==='production')notFound()
  const params=await searchParams
  return <RoadmapPreview framed={params.frame==='1'}/>
}
