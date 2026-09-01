import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://bcvggtnvuesaihqvgisg.supabase.co',
  'sb_publishable_O0JQYoJW-60sh3_5f7yr2Q_czCPZNH0',
  {auth:{persistSession:true,autoRefreshToken:true}}
)
