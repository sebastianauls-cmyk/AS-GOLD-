import {test,expect} from '@playwright/test'

test('production guest workspace creates and reopens a synthetic case without paid AI',async({page})=>{
  // Only the dedicated, capacity-budgeted workflow may create real production guest identities.
  test.skip(process.env.ASH_BROWSER_LOCAL==='true'||process.env.ASH_PRODUCTION_GUEST_SMOKE!=='true','Dedicated production-only guest smoke test.')
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))

  await page.goto('/?start=guest-test')
  const guest=page.locator('.guestSessionNotice')
  try{
    await expect(guest).toContainText('Passwortloser Testzugang aktiv',{timeout:25000})
  }catch(error){
    // Fail transparently rather than claiming the live guest workflow passed.
    if(await page.getByRole('heading',{name:'Arbeitsbereich nicht freigegeben'}).isVisible()){
      throw new Error('Real guest workspace denied. Check the rolling Supabase anonymous-test 20/24h cap and access trigger; do not lift the cap just to pass this test.')
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
