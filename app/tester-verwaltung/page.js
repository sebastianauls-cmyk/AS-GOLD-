import { TesterAdminPanel } from '../modules/tester/TesterAdminPanel'

export const metadata={
  title:'Tester verwalten',
  description:'Eigentümer-Steuerung für persönlich freigegebene Testerzugänge.',
  robots:{index:false,follow:false}
}

export default function TesterManagementPage(){return <TesterAdminPanel/>}
