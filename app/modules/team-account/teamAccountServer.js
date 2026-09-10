import { createClient } from '@supabase/supabase-js'

import { SUPABASE_URL } from '../services/supabaseConfig.js'

export const TEAM_SECURITY_SINGLETON='primary'

export function getSupabaseSecret(){
  return String(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim()
}

export function createTeamAdminClient(secret=getSupabaseSecret()){
  if(!secret)return null
  return createClient(SUPABASE_URL,secret,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  })
}

export async function readTeamSecurity(admin){
  if(!admin)return {data:null,error:{code:'secret_not_configured'}}
  return admin.from('team_account_security')
    .select('owner_id,master_password_hash,setup_completed_at,updated_at')
    .eq('singleton_key',TEAM_SECURITY_SINGLETON)
    .maybeSingle()
}
