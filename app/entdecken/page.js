import { connection } from 'next/server'
import WorkspaceApp from '../modules/workspace/WorkspaceAppCurrent'
import { publicPaymentConfig } from '../modules/payments/paymentConfig.mjs'

export const metadata={title:'ASH kennenlernen | ASH Workspace Gold'}

// A permanent public entry. Existing sign-in state never hides the explanation.
export default async function Page(){
  await connection()
  return <WorkspaceApp publicOnly initialPaymentConfig={publicPaymentConfig(process.env)}/>
}
