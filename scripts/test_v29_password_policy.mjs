import assert from 'node:assert/strict'
import { validateV29Password } from '../app/lib/v29PasswordPolicy.mjs'

const valid=validateV29Password('Mondlicht!2049x')
assert.equal(valid.valid,true,'Ein starkes, nicht persoenliches Passwort muss gueltig sein.')

assert.equal(validateV29Password('Kurz1!').rules.length,false)
assert.equal(validateV29Password('SicheresPasswort2026').rules.symbol,false)
assert.equal(validateV29Password('Passwort123!').rules.personal,false)
assert.equal(validateV29Password('Sebastian!2049x',{displayName:'Sebastian Auls'}).rules.personal,false)
assert.equal(validateV29Password('Test!Person2049',{email:'test.person+qa@example.test'}).rules.personal,false)

console.log('V29-Passwortregeln: 6 Prueffaelle erfolgreich.')
