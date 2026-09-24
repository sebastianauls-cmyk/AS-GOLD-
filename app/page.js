import { connection } from 'next/server'
import WorkspaceApp from './modules/workspace/WorkspaceAppCurrent'
import { publicPaymentConfig } from './modules/payments/paymentConfig.mjs'

export default async function Page(){
  await connection()
  return <WorkspaceApp initialPaymentConfig={publicPaymentConfig(process.env)}/>
}
