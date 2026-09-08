import { PromoTesterGate } from '../modules/tester/PromoTesterGate'

export const metadata={
  title:'Testerzugang mit Promo-Code',
  description:'Geschützter Testerzugang für AS Workspace Gold. Der Testerbereich wird ausschließlich nach erfolgreicher Promo-Code-Prüfung freigeschaltet.',
  robots:{index:false,follow:false}
}

export default function TestingPromoPage(){return <PromoTesterGate/>}
