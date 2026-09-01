import { createClient } from '@supabase/supabase-js'

const supabaseUrl='https://bcvggtnvuesaihqvgisg.supabase.co'
const supabasePublishableKey='sb_publishable_O0JQYoJW-60sh3_5f7yr2Q_czCPZNH0'

export const supabase=createClient(supabaseUrl,supabasePublishableKey,{
  auth:{persistSession:true,autoRefreshToken:true}
})
