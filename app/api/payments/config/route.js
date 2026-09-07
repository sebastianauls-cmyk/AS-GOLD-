import { publicPaymentConfig } from '../../../modules/payments/paymentConfig.mjs'

export const dynamic='force-dynamic'

export function GET(){
  return Response.json(publicPaymentConfig(process.env),{
    headers:{'cache-control':'no-store'}
  })
}
