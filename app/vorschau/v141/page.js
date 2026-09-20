import {notFound} from 'next/navigation'
import {CompletionPreview} from './preview'
export const dynamic='force-dynamic'
export const metadata={title:'ASH V141 · Abschluss und Frist prüfen',robots:{index:false,follow:false}}
export default function Page(){
  if(process.env.VERCEL_ENV==='production')notFound()
  return <CompletionPreview/>
}
