import { PersonalInvitationStudio } from '../modules/marketing/PersonalInvitationStudio'

export const metadata={
  title:'Persönliche Einladungen | AS Workspace Gold',
  description:'Eigentümer-Modul für hochwertige persönliche Testeinladungen.',
  robots:{index:false,follow:false}
}

export default function InvitationPage(){
  return <PersonalInvitationStudio/>
}
