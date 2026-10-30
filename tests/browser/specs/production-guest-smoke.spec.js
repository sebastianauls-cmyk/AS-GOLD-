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
  try{
    await expect(guest).toContainText('Passwortloser Testzugang aktiv',{timeout:25000})
  }catch(error){
    // A quota-denied sign-in is a failed smoke, never a successful or silently skipped run.
    if(await page.getByRole('heading',{name:'Arbeitsbereich nicht freigegeben'}).isVisible()){
      throw new Error('Production guest access denied; inspect Supabase anonymous-test 20/24h quota and approval trigger.')
    }
    throw error
  }
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
