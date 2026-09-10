import { TeamPasswordSetup } from '../../modules/team-account/TeamPasswordSetup'
import './setup.css'

export const metadata={
  title:'AS Workspace · Interne Passwörter einrichten',
  description:'Private Ersteinrichtung des gemeinsamen Teamzugangs und der Masterfreigabe für Programmierungsänderungen.',
  robots:{index:false,follow:false}
}

export default function TeamPasswordSetupPage(){
  return <TeamPasswordSetup/>
}
