import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { openIntegrationToken } from '../../../lib/integrationTokens'
export async function GET(){
  const store=await cookies()
  const hasKey=!!process.env.INTEGRATION_TOKEN_KEY
  const googleConfigured=!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&hasKey)
  const microsoftConfigured=!!(process.env.MICROSOFT_CLIENT_ID&&process.env.MICROSOFT_CLIENT_SECRET&&hasKey)
  const gmail=hasKey?!!openIntegrationToken(store.get('asgold_google_gmail')?.value):false
  const drive=hasKey?!!openIntegrationToken(store.get('asgold_google_drive')?.value):false
  const microsoft=hasKey?!!openIntegrationToken(store.get('asgold_microsoft')?.value):false
  return NextResponse.json({configured:{google:googleConfigured,microsoft:microsoftConfigured},connected:{gmail,drive,outlook:microsoft,onedrive:microsoft}})
}
