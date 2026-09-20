import {test,expect} from '@playwright/test'
import {LANGUAGE_CATALOG} from '../../../app/modules/language/languageRegistry.mjs'
import {publicExperienceCopy} from '../../../app/modules/public/publicExperienceCopy.mjs'
import {publicLanguageCountryCopy} from '../../../app/modules/public/publicLanguageCountryCopy.mjs'
import {publicCaseStartCopy} from '../../../app/modules/public/publicCaseStartCopy.mjs'

const diagnostics=new WeakMap()
test.beforeEach(async({page})=>{
  const entries={uncaught:[],consoleErrors:[]}
  diagnostics.set(page,entries)
  page.on('pageerror',error=>entries.uncaught.push(error.message))
  page.on('console',message=>{if(message.type()==='error')entries.consoleErrors.push(message.text())})
})
test.afterEach(async({page},testInfo)=>{
  const entries=diagnostics.get(page)
  await testInfo.attach('public-browser-diagnostics',{body:JSON.stringify({url:page.url(),...entries},null,2),contentType:'application/json'})
  expect(entries.uncaught,'the public app must not throw uncaught JavaScript errors').toEqual([])
})

async function openPublic(page,language='de'){
  const response=await page.goto(`/?lang=${language}`,{waitUntil:'domcontentloaded'})
  expect(response?.status(),'the public address must load successfully').toBe(200)
  await expect(page.locator('.publicProductPage')).toBeVisible({timeout:25_000})
  await expect(page.locator('html')).toHaveAttribute('lang',language)
  await page.evaluate(async()=>{await document.fonts.ready})
}

async function noHorizontalOverflow(page){
  const dimensions=await page.evaluate(()=>({viewport:window.innerWidth,page:document.documentElement.scrollWidth}))
  expect(dimensions.page,'the page must fit the viewport without sideways scrolling').toBeLessThanOrEqual(dimensions.viewport+1)
}

async function capture(page,testInfo,name,locator=null){
  const path=testInfo.outputPath(`${name}.png`)
  await (locator||page).screenshot({path,animations:'disabled'})
  await testInfo.attach(name,{path,contentType:'image/png'})
}

for(const {key:language,label,rtl} of LANGUAGE_CATALOG){
  test(`public explanation is accessible in ${label}`,async({page},testInfo)=>{
    await openPublic(page,language)
    const copy=publicExperienceCopy(language)
    await expect(page.getByRole('heading',{level:1})).toHaveText(copy.headline)
    await expect(page.locator('.publicProductHero .lead')).toHaveText(copy.lead)
    await expect(page.locator('.publicCapabilitySummary li')).toHaveCount(3)
    await expect(page.locator('html')).toHaveAttribute('dir',rtl?'rtl':'ltr')
    await expect(page.locator('.publicTop button[aria-haspopup="listbox"]')).toHaveCount(2)
    await expect(page.locator('#sprachen-rechtsraeume select')).toHaveCount(3)
    await expect(page.locator('.publicLanguageCountryStart button')).toHaveCount(2)
    const installationTextWidth=await page.locator('.publicInstallRow .installAppText').evaluate(element=>element.getBoundingClientRect().width)
    expect(installationTextWidth,'installation copy must remain readable beside its icon and actions').toBeGreaterThan(160)
    await noHorizontalOverflow(page)
    if(['de','pl','ar'].includes(language)){
      await capture(page,testInfo,`initial-${language}`)
      await capture(page,testInfo,`product-explanation-${language}`,page.locator('.publicProductHero'))
    }
  })
}

test('customers can explore every feature and the plans without signing in',async({page},testInfo)=>{
  await openPublic(page)
  const choices=page.locator('.publicTourChoices button')
  await expect(choices).toHaveCount(8)
  for(let index=0;index<8;index++){
    const button=choices.nth(index)
    const title=await button.locator('b').innerText()
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed','true')
    await expect(page.locator('#public-tour-panel h3')).toHaveText(title)
  }
  await page.locator('.publicTop a[href="#preise"]').click()
  await expect(page.locator('#preise')).toBeInViewport()
  const details=page.locator('#preise details.publicPlanDetails')
  expect(await details.count()).toBeGreaterThan(0)
  await details.first().locator('summary').click()
  await expect(details.first()).toHaveAttribute('open','')
  await noHorizontalOverflow(page)
  await capture(page,testInfo,'public-plans')
})

test('the permanent explanation is public and keeps the normal registration handoff',async({page},testInfo)=>{
  const accountRequests=[]
  page.on('request',request=>{if(/\/rest\/v1\/(?:cases|documents|clients|approvals)(?:\?|$)/.test(request.url()))accountRequests.push(request.url())})
  const response=await page.goto('/entdecken?lang=de',{waitUntil:'domcontentloaded'})
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading',{level:1})).toHaveText(publicExperienceCopy('de').headline)
  await expect(page.locator('.publicCapabilitySummary li')).toHaveCount(3)
  await expect(page.locator('#public-summary-title')).toHaveText('Was ASH für Sie tun kann')
  await page.reload({waitUntil:'domcontentloaded'})
  await expect(page.locator('.publicCapabilitySummary')).toBeVisible()
  expect(accountRequests).toEqual([])
  await noHorizontalOverflow(page)
  await capture(page,testInfo,'permanent-public-explanation',page.locator('.publicProductHero'))
  await page.locator('.publicProductEntry .primary').click()
  await expect(page).toHaveURL(/\/\?start=register&lang=de$/)
  await expect(page.locator('#register-password')).toBeVisible()
  await expect(page.locator('.authCard form .primary.full')).toBeDisabled()
})

test('interface, output and country-example choices remain independent',async({page},testInfo)=>{
  await openPublic(page)
  const selects=page.locator('#sprachen-rechtsraeume select')
  await selects.nth(0).selectOption('VN')
  await selects.nth(1).selectOption('DE')
  await selects.nth(2).selectOption('fa')
  await page.locator('.publicTop .interfaceModule button[aria-haspopup="listbox"]').click()
  await page.locator('.publicTop .interfaceModule').getByRole('option',{name:'Polski',exact:true}).click()
  await expect(page.locator('html')).toHaveAttribute('lang','pl')
  await expect(selects.nth(0)).toHaveValue('VN')
  await expect(selects.nth(1)).toHaveValue('DE')
  await expect(selects.nth(2)).toHaveValue('fa')
  await page.locator('.publicTop .outputModule button[aria-haspopup="listbox"]').click()
  await page.locator('.publicTop .outputModule').getByRole('option',{name:'English',exact:true}).click()
  await expect(page.locator('html')).toHaveAttribute('lang','pl')
  await expect(page.locator('.publicTop .outputModule button[aria-haspopup="listbox"]')).toContainText('English')
  await expect(selects.nth(2)).toHaveValue('fa')
  await selects.nth(0).selectOption('DE')
  await expect(page.locator('.publicLanguageCountryResults')).toContainText(publicLanguageCountryCopy('pl').same)
  await noHorizontalOverflow(page)
  await capture(page,testInfo,'same-country-and-translation',page.locator('#sprachen-rechtsraeume'))
})

test('explicit country choices survive the sign-in entry and reload, then cancel cleanly',async({page},testInfo)=>{
  await openPublic(page)
  const selects=page.locator('#sprachen-rechtsraeume select')
  await selects.nth(0).selectOption('PL')
  await selects.nth(1).selectOption('DE')
  await selects.nth(2).selectOption('pl')
  await page.getByRole('button',{name:publicCaseStartCopy('de').start,exact:true}).click()
  await expect(page.locator('#register-password')).toBeVisible()
  await expect(page.locator('.authCard form .primary.full')).toBeDisabled()
  const pending=()=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('asgold-public-case-start')))
  expect(await pending()).toMatchObject({home:'PL',target:'DE',output:'pl'})
  await page.reload({waitUntil:'domcontentloaded'})
  await expect(page.locator('.publicProductPage')).toBeVisible()
  expect(await pending()).toMatchObject({home:'PL',target:'DE',output:'pl'})
  await page.locator('.publicSignIn').click()
  await expect(page.locator('#login-password')).toBeVisible()
  expect(await pending()).toMatchObject({home:'PL',target:'DE',output:'pl'})
  await capture(page,testInfo,'sign-in-entry')
  await page.locator('.authBackBtn').click()
  await expect(page.locator('.publicProductPage')).toBeVisible()
  expect(await pending()).toBeNull()
})
