import {test,expect} from '@playwright/test'

// A real guest consumes one of 20 rolling-24h Supabase access slots.
// Protect them even when a broad browser suite runs against production.
// Only the dedicated GitHub workflow may perform the real sign-in.
test.describe.configure({retries:0})

test('production guest workspace creates and reopens a synthetic case without paid AI',async({page})=>{
  test.skip(process.env.ASH_BROWSER_LOCAL==='true'||process.env.GITHUB_WORKFLOW!=='ASH Production Guest Smoke','Real guest signup is reserved for the dedicated production-smoke workflow.')
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))

  await page.goto('/?start=guest-test')
  const guest=page.locator('.guestSessionNotice')
  const capacity=page.getByText('Der sichere Testzugang ist für heute ausgelastet.',{exact:false})
  const state=await Promise.race([
    guest.waitFor({state:'attached',timeout:25000}).then(()=> 'ready'),
    capacity.waitFor({state:'visible',timeout:25000}).then(()=> 'capacity')
  ])
  if(state==='capacity') test.skip(true,'Production guest capacity reached correctly; no product defect.')
  // The guest notice is intentionally inside the collapsed 'Konto und weitere Bereiche'
  // details panel. Attachment proves the active session; expand the panel to check copy.
  await expect(page.getByRole('heading',{name:'Meine Übersicht'})).toBeVisible()
  await page.locator('details.workspaceMore > summary').click()
  await expect(guest).toBeVisible()
  await expect(guest).toContainText('Passwortloser Testzugang aktiv')
  await expect(guest).toContainText('höchstens 2 Dokumente')

  const goal=page.getByRole('textbox',{name:'Wobei brauchen Sie Hilfe?'})
  await expect(goal).toBeVisible()
  await goal.fill('Synthetischer Produktions-Smoke-Test: Ich habe eine Rechnung erhalten und möchte den Vorgang nur speichern und wieder öffnen.')
  await page.getByRole('button',{name:'Weiter',exact:true}).click()

  const caseHeading=page.getByRole('heading',{name:/Synthetischer Produktions-Smoke-Test/}).first()
  await expect(caseHeading).toBeVisible({timeout:20000})
  await expect(page.getByText('Fallakte',{exact:true})).toBeVisible()

  await page.getByRole('button',{name:/Zurück/}).first().click()
  const recent=page.locator('.workspaceRecentCard').filter({hasText:'Synthetischer Produktions-Smoke-Test'}).first()
  await expect(recent).toBeVisible({timeout:15000})
  await recent.locator('.workspaceRecentCase').click()
  await expect(page.getByRole('heading',{name:/Synthetischer Produktions-Smoke-Test/}).first()).toBeVisible({timeout:15000})

  expect(errors).toEqual([])
})
