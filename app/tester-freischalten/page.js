import { PersonalTesterRedeem } from '../modules/tester/PersonalTesterRedeem'

export const metadata={
  title:'Persönlichen Testerzugang freischalten',
  description:'Einlösen eines persönlich freigegebenen Tester-Codes.',
  robots:{index:false,follow:false}
}

export default function TesterRedeemPage(){return <PersonalTesterRedeem/>}
