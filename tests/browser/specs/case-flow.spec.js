import {test,expect} from '@playwright/test'

test.skip(process.env.ASH_BROWSER_LOCAL!=='true','Isolated component fixture is intentionally absent from production.')

async function begin(page){
  await page.goto('/qa-case-flow')
  await page.getByRole('textbox',{name:'Wobei brauchen Sie Hilfe?'}).fill('Ich verstehe meine Briefe nicht.')
  await page.getByRole('button',{name:'Weiter',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Ihre Antwort',exact:true})).toBeVisible()
}

test('one human question, one consent, all documents and one answer',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message))
  await page.goto('/qa-case-flow')
  await expect(page.locator('textarea:visible')).toHaveCount(1)
  await expect(page.locator('.simpleCaseOptions')).not.toHaveAttribute('open')
  await page.screenshot({path:testInfo.outputPath('human-entry.png'),fullPage:true})
  await begin(page)
  const start=page.getByRole('button',{name:'Antwort erhalten',exact:true})
  await expect(start).toBeDisabled()
  await expect(page.locator('.simpleCaseMore')).not.toHaveAttribute('open')
  await page.getByRole('checkbox',{name:/Ich erlaube/}).check()
  await start.click()
  await expect(page.getByRole('heading',{name:'Dein Fahrplan zur Auszahlung'})).toBeVisible()
  await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:2,saved:2,generated:1,sent:0}))
  await expect(page.getByText('Das bedeutet',{exact:true})).toBeVisible()
  await page.screenshot({path:testInfo.outputPath('case-answer.png'),fullPage:true})
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
  expect(errors).toEqual([])
})

test('failed document is recoverable without re-reading successful documents',async({page})=>{
  await begin(page)
  await page.getByRole('button',{name:'Simulate one failed read'}).click()
  await page.getByRole('checkbox',{name:/Ich erlaube/}).check()
  await page.getByRole('button',{name:'Antwort erhalten',exact:true}).click()
  await expect(page.locator('.roadmapError[role=alert]')).toContainText('Bereits gelesene Unterlagen bleiben erhalten')
  await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:2,saved:0,generated:0,sent:0}))
  await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Dein Fahrplan zur Auszahlung'})).toBeVisible()
  await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:3,saved:2,generated:1,sent:0}))
})

test('provider credit failure keeps its concrete remedy in the case screen',async({page})=>{
  await begin(page)
  await page.getByRole('button',{name:'Simulate exhausted provider credits'}).click()
  await page.getByRole('checkbox',{name:/Ich erlaube/}).check()
  await page.getByRole('button',{name:'Antwort erhalten',exact:true}).click()
  await expect(page.locator('.roadmapError[role=alert]')).toContainText('ausgeschöpften Guthabens')
  await expect(page.locator('.roadmapError[role=alert]')).toContainText('ASH-Betreiber')
  await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:1,saved:0,generated:0,sent:0}))
  await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Dein Fahrplan zur Auszahlung'})).toBeVisible()
  await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:3,saved:2,generated:1,sent:0}))
})

test('translated entry supports English and right-to-left Persian',async({page})=>{
  await page.goto('/qa-case-flow')
  await page.getByLabel('Test language').selectOption('en')
  await expect(page.getByRole('textbox',{name:'What do you need help with?'})).toBeVisible()
  await page.getByLabel('Test language').selectOption('fa')
  await expect(page.locator('.simpleCaseStart')).toHaveAttribute('dir','rtl')
  await expect(page.locator('textarea:visible')).toHaveCount(1)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})

test('speaking fills the same human question without a second form',async({page})=>{
  await page.addInitScript(()=>{
    window.SpeechRecognition=class {
      start(){const final=[{transcript:'Ich brauche Hilfe mit einem Brief.'}];final.isFinal=true;this.onresult?.({resultIndex:0,results:[final]})}
      stop(){this.onend?.()}
      abort(){}
    }
  })
  await page.goto('/qa-case-flow')
  await page.getByRole('button',{name:'Sprechen',exact:true}).click()
  await expect(page.getByRole('textbox',{name:'Wobei brauchen Sie Hilfe?'})).toHaveValue('Ich brauche Hilfe mit einem Brief.')
  await page.getByRole('button',{name:'Aufnahme beenden',exact:true}).click()
  await expect(page.getByRole('button',{name:'Weiter',exact:true})).toBeEnabled()
})


test('complete analysis shows checked amounts and conditions behind the short answer',async({page},testInfo)=>{
  await begin(page)
  await page.getByRole('checkbox',{name:/Ich erlaube/}).check()
  await page.getByRole('button',{name:'Antwort erhalten',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Dein Fahrplan zur Auszahlung'})).toBeVisible()
  await expect(page.locator('.roadmapCompleteAnalysis')).toHaveCount(0)
  await page.getByRole('button',{name:'Nächste Schritte anzeigen',exact:true}).click()
  await expect(page.locator('.roadmapCompleteAnalysis')).toBeVisible()
  await expect(page.getByRole('heading',{name:'Brutto minus netto: 1.000,00 EUR'})).toBeVisible()
  await expect(page.getByText('Voraussetzungen: Die Art der Abzüge ist ungeklärt.',{exact:true})).toBeVisible()
  await expect(page.locator('.roadmapActions').getByRole('button',{name:'PDF',exact:true}).first()).toBeEnabled()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
  await page.screenshot({path:testInfo.outputPath('complete-analysis.png'),fullPage:true})
})
