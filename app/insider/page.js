import { InsiderLanding } from '../modules/insider/InsiderLanding'
import './insider.css'

export const metadata={
  title:'AS Workspace · Chef- und Insiderbereich',
  description:'Getrennter Zugang für Eigentümer, freigeschaltete Tester und bestehende interne Zugänge.',
  robots:{index:false,follow:false}
}

export default function InsiderPage(){
  return <InsiderLanding/>
}
