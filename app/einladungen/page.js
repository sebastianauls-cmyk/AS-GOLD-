import { PersonalInvitationStudio } from '../modules/marketing/PersonalInvitationStudio'
import { InvitationWorkflowPanel } from '../modules/marketing/InvitationWorkflowPanel'

export const metadata={
  title:'Persönliche Einladungen | AS Workspace Gold',
  description:'Eigentümer-Modul für hochwertige persönliche Testeinladungen und den vollständigen Freigabe-Workflow.',
  robots:{index:false,follow:false}
}

export default function InvitationPage(){
  return <>
    <PersonalInvitationStudio/>
    <main className="wrap" style={{paddingBottom:28}}>
      <InvitationWorkflowPanel/>
    </main>
  </>
}
