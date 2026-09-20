import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabaseConfig'
import { capturePasswordRecovery } from '../auth/passwordRecoveryFlow.mjs'

// Capture intent before createClient initializes Auth and removes the URL hash.
capturePasswordRecovery()

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {auth:{persistSession:true,autoRefreshToken:true}}
)
