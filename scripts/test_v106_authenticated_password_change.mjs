import assert from 'node:assert/strict'
import fs from 'node:fs'
import {APP_VERSION} from '../app/modules/release/appRelease.mjs'

assert.equal(APP_VERSION,'V106')

const page=fs.readFileSync(new URL('../app/passwort-aendern/page.js',import.meta.url),'utf8')
assert.match(page,/^'use client'/)
assert.match(page,/supabase\.auth\.getUser\(\)/)
assert.match(page,/supabase\.auth\.updateUser\(\{password\}\)/)
assert.match(page,/validateV29Password/)
assert.match(page,/Passwort speichern/)
assert.match(page,/Zurück zum Arbeitsbereich/)
assert.doesNotMatch(page,/service_role|admin\.updateUserById|fetch\(/)

console.log('V106 authenticated password-change guard passed: only a verified browser session can update its own password.')
