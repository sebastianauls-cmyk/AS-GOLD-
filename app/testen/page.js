import { TesterPaused } from '../modules/tester/TesterPaused'

export const metadata={
  title:'Testerzugang pausiert',
  description:'Der externe Testerzugang von AS Workspace Gold ist derzeit pausiert. Die interne Qualitätsprüfung läuft ausschließlich mit synthetischen Testfällen weiter.',
  robots:{index:false,follow:false}
}

export default function TestingPausedPage(){return <TesterPaused/>}
