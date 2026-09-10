import { InsiderAccessController } from '../modules/insider/InsiderAccessController'
import './insider.css'

export const metadata={
  title:'AS Workspace · Gemeinsamer interner Arbeitsbereich',
  description:'Getrennter interner Zugang zum gemeinsamen Teamkonto mit vollständigen Bearbeitungsrechten.',
  robots:{index:false,follow:false}
}

export default function InsiderPage(){
  return <InsiderAccessController/>
}
