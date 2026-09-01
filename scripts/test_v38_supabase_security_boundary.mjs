import assert from 'node:assert/strict'
import fs from 'node:fs'

const migration=fs.readFileSync(new URL('../supabase/migrations/20260901013800_v38_move_audit_definer_behind_private_boundary.sql',import.meta.url),'utf8')

assert.match(migration,/create or replace function public\.record_gold_audit_event/i)
assert.match(migration,/security invoker/i)
assert.match(migration,/private\.record_gold_audit_event_impl/i)
assert.match(migration,/grant execute on function private\.record_gold_audit_event_impl\(text,text,uuid,jsonb\) to authenticated/i)
assert.match(migration,/revoke execute on function private\.record_gold_audit_event_impl\(text,text,uuid,jsonb\) from anon/i)
assert.match(migration,/revoke all on function public\.record_gold_audit_event\(text,text,uuid,jsonb\) from public/i)
assert.match(migration,/revoke execute on function public\.record_gold_audit_event\(text,text,uuid,jsonb\) from anon/i)
assert.match(migration,/grant execute on function public\.record_gold_audit_event\(text,text,uuid,jsonb\) to authenticated/i)

console.log('V38 Supabase security-boundary guard passed: public audit RPC stays SECURITY INVOKER, anonymous execution is blocked, and the validated definer remains behind private schema.')
