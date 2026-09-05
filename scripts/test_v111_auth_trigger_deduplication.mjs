import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'

const migration=fs.readFileSync('supabase/migrations/20260905224527_v111_deduplicate_new_user_trigger.sql','utf8')

assert.ok(APP_RELEASE.number>=111,'auth-trigger deduplication requires release V111 or newer')
assert.match(migration,/drop trigger if exists gold_v27_new_user_pending on auth\.users/i)
assert.doesNotMatch(migration,/drop trigger if exists on_auth_user_created_gold_access/i,'the canonical registration trigger must remain active')

console.log(`${APP_VERSION} auth-trigger guard passed: the obsolete duplicate is removed and the canonical registration trigger remains.`)
