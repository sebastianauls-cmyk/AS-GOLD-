import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8')
const exists=path=>fs.existsSync(new URL(`../${path}`,import.meta.url))

const page=read('app/page.js')
const privacyControls=read('app/components/V28PrivacyControls.js')
const legalFooter=read('app/components/LegalFooter.js')
const nextConfig=read('next.config.mjs')
const packageJson=JSON.parse(read('package.json'))
const terms=read('app/nutzungsbedingungen/page.js')
const privacy=read('app/datenschutz/page.js')
const imprint=read('app/impressum/page.js')
const aiTransparency=read('app/ki-transparenz/page.js')
const cookies=read('app/cookies/page.js')
const testing=read('app/testen/page.js')
const legalHub=read('app/rechtliches/page.js')
const integrationTokens=read('app/lib/integrationTokens.js')
const googleStart=read('app/api/integrations/google/start/route.js')
const googleCallback=read('app/api/integrations/google/callback/route.js')
const microsoftStart=read('app/api/integrations/microsoft/start/route.js')
const microsoftCallback=read('app/api/integrations/microsoft/callback/route.js')
const integrationStatus=read('app/api/integrations/status/route.js')

// Auth + legal gate
assert.match(page,/signInWithPassword/)
assert.match(page,/resetPasswordForEmail/)
assert.match(page,/auth\.signUp/)
assert.match(page,/acceptedLegal/)
assert.match(page,/confirmedTestData/)
assert.match(page,/test_data_only:true/)
assert.match(privacyControls,/PRIVACY_NOTICE_VERSION/)
assert.match(privacyControls,/TERMS_VERSION/)
assert.match(privacyControls,/synthetische oder wirksam anonymisierte Testdaten/i)
assert.match(privacyControls,/Art\. 9 DSGVO/)

// Payment must remain locked during the controlled test
assert.match(page,/Bezahlfunktion ist vorübergehend deaktiviert/)
assert.match(page,/keine Zahlung ausgelöst/)
assert.match(page,/Keine automatische Verlängerung/)
assert.match(terms,/Keine Zahlung, kein Abo/)
assert.match(terms,/Bezahlfunktion ist deaktiviert/)
assert.equal(Boolean(packageJson.dependencies?.stripe),false,'Stripe darf im kontrollierten Test nicht als aktive Abhängigkeit eingebunden sein')

// Legal surface and binding German texts
for(const path of [
  'app/impressum/page.js','app/datenschutz/page.js','app/datenschutzsteuerung/page.js','app/nutzungsbedingungen/page.js',
  'app/widerruf/page.js','app/cookies/page.js','app/ki-transparenz/page.js','app/rechtliches/page.js','app/kontakt/page.js','app/testen/page.js'
]) assert.ok(exists(path),`Pflicht-/Transparenzseite fehlt: ${path}`)
assert.match(legalFooter,/Verbindlich sind die deutschen Rechtstexte/)
assert.match(imprint,/§ 5 Digitale-Dienste-Gesetz \(DDG\)/)
assert.match(privacy,/Testbetrieb ohne echte Kundendaten/)
assert.match(privacy,/Art\. 6 Abs\. 1/)
assert.match(privacy,/Betroffenenrechte/)
assert.match(terms,/keine automatische Außenwirkung/i)
assert.match(aiTransparency,/keine automatische Entscheidung und keine Rechtsberatung/i)
assert.match(aiTransparency,/store: false/)
assert.match(cookies,/Kein Marketing-Tracking/)
assert.match(testing,/Bezahlfunktion bleibt deaktiviert/)
assert.match(legalHub,/Vor einem späteren Bezahlbetrieb/)

// Upload, error/empty/busy handling and export routes
assert.match(page,/maxUploadBytes = 50 \* 1024 \* 1024/)
assert.match(page,/allowedUploadExtensions/)
assert.match(page,/tooLarge/)
assert.match(page,/unsupported/)
assert.match(page,/disabled=\{uploading\}/)
assert.match(page,/emptyState/)
for(const exportType of ['pdf','docx','xlsx','pptx','csv','txt']) assert.match(page,new RegExp(`value=\\"${exportType}\\"`,'i'),`Export ${exportType} fehlt`)
assert.match(page,/exportMyData/)
assert.match(page,/requestAccountDeletion/)
assert.match(page,/serverAudit/)

// Security headers
for(const token of ['Content-Security-Policy','Referrer-Policy','X-Content-Type-Options','X-Frame-Options','Cross-Origin-Opener-Policy','Permissions-Policy','Strict-Transport-Security']) assert.match(nextConfig,new RegExp(token))
assert.match(nextConfig,/frame-ancestors 'none'/)
assert.match(nextConfig,/object-src 'none'/)
assert.match(nextConfig,/payment=\(\)/)

// OAuth integration safety: explicit configuration, state protection, encrypted refresh tokens
assert.match(integrationStatus,/GOOGLE_CLIENT_ID/)
assert.match(integrationStatus,/MICROSOFT_CLIENT_ID/)
assert.match(integrationStatus,/INTEGRATION_TOKEN_KEY/)
assert.match(googleStart,/randomUUID/)
assert.match(googleStart,/httpOnly:true,secure:true,sameSite:'lax'/)
assert.match(googleCallback,/expected!==stateValue/)
assert.match(googleCallback,/sealIntegrationToken/)
assert.match(microsoftStart,/randomUUID/)
assert.match(microsoftStart,/httpOnly:true,secure:true,sameSite:'lax'/)
assert.match(microsoftCallback,/state!==expected/)
assert.match(microsoftCallback,/sealIntegrationToken/)
assert.match(integrationTokens,/aes-256-gcm/)
assert.match(integrationTokens,/createHash\('sha256'\)/)

// Existing product/readiness guards must stay mandatory before production builds
for(const guard of ['test:v37-readiness','test:v38-deadlines','test:v38-assessments','test:v38-next-step','test:v38-simulation','test:v38-mobile','test:v38-accessibility']) assert.match(packageJson.scripts.prebuild,new RegExp(guard.replace(':','\\:')))

console.log('V38 pre-launch guard passed: auth, legal/test-data gates, payment lock, exports, security headers, OAuth safeguards, deletion/audit controls and readiness guards verified.')
