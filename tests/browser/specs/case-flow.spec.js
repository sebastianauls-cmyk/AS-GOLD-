import {test,expect} from '@playwright/test'
import fs from 'node:fs/promises'

test.skip(process.env.ASH_BROWSER_LOCAL!=='true','Isolated component fixture is intentionally absent from production.')

async function begin(page){
  await page.goto('/qa-case-flow')
  await page.getByRole('textbox',{name:'Wobei brauchen Sie Hilfe?'}).fill('Ich verstehe meine Briefe nicht.')
  await page.getByRole('button',{name:'Weiter',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Ihre Antwort',exact:true})).toBeVisible()
}

test('internal free analysis calculates Sarah without any AI invocation and exports the result',async({page},testInfo)=>{
  const errors=[],providerRequests=[]
  page.on('pageerror',error=>errors.push(error.message))
  page.on('request',request=>{if(/\/functions\/v1\/|api\.openai\.com/.test(request.url()))providerRequests.push(request.url())})
  await begin(page)
  await page.getByRole('button',{name:'Use internal free mode',exact:true}).click()
  await expect(page.getByRole('button',{name:'Kostenlos · ohne KI-Aufruf',exact:true})).toHaveAttribute('aria-pressed','true')
  await expect(page.getByRole('checkbox',{name:/Ich erlaube/})).toHaveCount(0)
  await page.getByRole('button',{name:'Kostenlos auswerten',exact:true}).click()
  const panel=page.getByRole('region',{name:'Kostenlose Analyse',exact:true})
  await expect(panel.getByRole('status')).toHaveText('4 von 4 Dokumenttexten verfügbar · 8 Rechenproben · 0 Abweichungen')
  await expect(panel).toContainText('27.930,00')
  await expect(panel).toContainText('28.421,00')
  await expect(panel).toContainText('Datum des Zugangs ist nicht dokumentiert')
  await expect(panel).toContainText('Rechtsfristen bleiben ungeprüft')
  await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:0,saved:0,generated:0,sent:0}))
  await expect(page.getByTestId('invocations')).toHaveText('0')
  for(const [label,extension] of [['Word','docx'],['PDF','pdf']]){
    const [download]=await Promise.all([page.waitForEvent('download'),panel.getByRole('button',{name:label,exact:true}).click()])
    expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${extension}$`))
    expect(await download.failure()).toBeNull()
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
  await page.screenshot({path:testInfo.outputPath('free-sarah-analysis.png'),fullPage:true})
  expect(providerRequests).toEqual([])
  expect(errors).toEqual([])
})

test('free analysis hides stale results and finds a changed payout without paid fallback',async({page})=>{
  await begin(page)
  await page.getByRole('button',{name:'Use internal free mode',exact:true}).click()
  await page.getByRole('button',{name:'Kostenlos auswerten',exact:true}).click()
  await page.getByRole('button',{name:'Change a saved amount',exact:true}).click()
  const panel=page.getByRole('region',{name:'Kostenlose Analyse',exact:true})
  await expect(panel.getByRole('status')).toContainText('Unterlagen wurden geändert')
  await expect(panel.getByRole('button',{name:'PDF',exact:true})).toHaveCount(0)
  await page.getByRole('button',{name:'Erneut kostenlos auswerten',exact:true}).click()
  await expect(panel.getByRole('status')).toContainText('1 Abweichung')
  await expect(panel).toContainText('Rechenabweichung')
  await expect(page.getByTestId('invocations')).toHaveText('0')
  await page.getByRole('button',{name:'Leave case page',exact:true}).click()
  await page.getByRole('button',{name:'Return to case page',exact:true}).click()
  await expect(page.getByRole('button',{name:'Kostenlos auswerten',exact:true})).toBeVisible()
  await expect(page.getByRole('checkbox',{name:/Ich erlaube/})).toHaveCount(0)
})

test('free analysis keeps signed deductions unreviewed and handles negative cents and denied gaps',async({page})=>{
  await begin(page)
  await page.getByRole('button',{name:'Use arithmetic edge cases',exact:true}).click()
  await page.getByRole('button',{name:'Kostenlos auswerten',exact:true}).click()
  const panel=page.getByRole('region',{name:'Kostenlose Analyse',exact:true})
  await expect(panel.getByRole('status')).toContainText('1 Rechenprobe · 0 Abweichungen')
  await expect(panel).toContainText('Brutto/Netto nicht geprüft: Abzüge enthalten Minuszeichen.')
  await expect(panel).toContainText('Rechnerisch passend')
  await expect(panel.getByRole('heading',{name:'Im Text als offen oder fehlend beschrieben',exact:true})).toHaveCount(0)
  await expect(page.getByTestId('invocations')).toHaveText('0')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
})

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

test('general case export downloads the saved complete result in all six formats',async({page})=>{
  await begin(page)
  await page.getByRole('checkbox',{name:/Ich erlaube/}).check()
  await page.getByRole('button',{name:'Antwort erhalten',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Dein Fahrplan zur Auszahlung'})).toBeVisible()
  for(const type of ['txt','pdf','docx','xlsx','pptx','csv']){
    await page.getByLabel('Export format').selectOption(type)
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export saved case',exact:true}).click()])
    expect(await download.failure()).toBeNull()
    expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${type}$`))
    if(type==='txt'){
      const text=await fs.readFile(await download.path(),'utf8')
      expect(text).toContain('Brutto minus netto: 1.000,00 EUR')
      expect(text).toContain('Beide Auskunftsanfragen vorbereiten')
      expect(text).toContain('Die Berechnungsanlage fehlt.')
      expect(text).toContain('Originalunterlage: 1.pdf')
      expect(text).toContain('Zugehöriger Schritt: 2. Beide Auskunftsanfragen vorbereiten')
      expect(text).toContain('Fallfragen: Zusammensetzung der Abzüge')
    }
  }
  await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:2,saved:2,generated:1,sent:0}))
})

test('general export blocks a saved report after its original sources change',async({page})=>{
  await begin(page)
  await page.getByRole('checkbox',{name:/Ich erlaube/}).check()
  await page.getByRole('button',{name:'Antwort erhalten',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Dein Fahrplan zur Auszahlung'})).toBeVisible()
  let downloads=0;page.on('download',()=>downloads++)
  await page.getByRole('button',{name:'Change export source',exact:true}).click()
  await page.getByRole('button',{name:'Export saved case',exact:true}).click()
  await expect(page.getByTestId('export-message')).toContainText('Die Fallunterlagen haben sich geändert')
  expect(downloads).toBe(0)
})

async function openDirectExports(page){
  await begin(page)
  await page.getByRole('checkbox',{name:/Ich erlaube/}).check()
  await page.getByRole('button',{name:'Antwort erhalten',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Dein Fahrplan zur Auszahlung'})).toBeVisible()
  await page.getByRole('button',{name:'Nächste Schritte anzeigen',exact:true}).click()
  await expect(page.locator('.roadmapCurrentStatus')).toContainText('0 / 4')
  const letter=page.locator('.roadmapLetters > details').first()
  await letter.locator('summary').first().click()
  return {report:page.locator('.customerRoadmapView > .roadmapActions'),letter}
}

test('direct report and letter downloads use saved progress from another window',async({page})=>{
  const {report,letter}=await openDirectExports(page)
  await page.getByRole('button',{name:'Confirm progress in another window',exact:true}).click()
  await expect(page.locator('.roadmapCurrentStatus')).toContainText('0 / 4')
  for(const target of [report,letter])for(const [label,type] of [['Word','docx'],['PDF','pdf']]){
    const [download]=await Promise.all([page.waitForEvent('download'),target.getByRole('button',{name:label,exact:true}).click()])
    expect(await download.failure()).toBeNull()
    expect(download.suggestedFilename()).toContain(target===report?'Kundenfahrplan':'Anschreiben_versorgung')
    expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${type}$`))
    await expect(page.locator('.roadmapCurrentStatus')).toContainText('1 / 4')
  }
  await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:2,saved:2,generated:1,sent:0}))
})

for(const [change,message] of [['Change source in another window','Die Fallunterlagen haben sich geändert'],['Replace report in another window','inzwischen ersetzt oder entfernt']]){
  test('direct exports reject '+change,async({page})=>{
    const {report,letter}=await openDirectExports(page)
    let downloads=0;page.on('download',()=>downloads++)
    await page.getByRole('button',{name:change,exact:true}).click()
    for(const target of [report,letter])for(const label of ['Word','PDF']){
      await expect(target.getByRole('button',{name:label,exact:true})).toBeEnabled()
      await target.getByRole('button',{name:label,exact:true}).click()
      await expect(page.locator('.roadmapError[role=alert]')).toContainText(message)
    }
    expect(downloads).toBe(0)
    await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:2,saved:2,generated:1,sent:0}))
  })
}

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
  async function expectContained(){
    const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].map(element=>({tag:element.tagName,class:element.className,text:element.textContent?.slice(0,100),width:element.clientWidth,scroll:element.scrollWidth,right:element.getBoundingClientRect().right})).filter(element=>element.right>innerWidth+1||element.scroll>element.width+1).slice(-15)}))
    expect(layout.scroll,JSON.stringify(layout)).toBeLessThanOrEqual(layout.width+1)
  }
  await begin(page)
  await page.getByRole('checkbox',{name:/Ich erlaube/}).check()
  await page.getByRole('button',{name:'Antwort erhalten',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Dein Fahrplan zur Auszahlung'})).toBeVisible()
  await expect(page.locator('.roadmapCompleteAnalysis')).toHaveCount(0)
  await page.getByRole('button',{name:'Nächste Schritte anzeigen',exact:true}).click()
  await expect(page.locator('.roadmapCompleteAnalysis')).toBeVisible()
  await expect(page.getByRole('heading',{name:'Brutto minus netto: 1.000,00 EUR'})).toBeVisible()
  await expect(page.getByText('Voraussetzungen: Die Art der Abzüge ist ungeklärt.',{exact:true})).toBeVisible()
  const analysis=page.locator('.roadmapCompleteAnalysis')
  await expect(analysis).toContainText('Fallfragen: Zusammensetzung der Abzüge')
  await expectContained()
  await analysis.getByRole('button',{name:'Zugehöriger Schritt: 2. Beide Auskunftsanfragen vorbereiten',exact:true}).click()
  await expect(page.locator('[data-step-id="anfragen"]')).toBeFocused()
  await analysis.getByRole('button',{name:'Originalunterlage: 1.pdf',exact:true}).first().click()
  await expect(page.getByTestId('opened-document')).toHaveText('1.pdf')
  await expect(page.locator('.roadmapActions').getByRole('button',{name:'PDF',exact:true}).first()).toBeEnabled()
  await expectContained()
  await page.screenshot({path:testInfo.outputPath('complete-analysis.png'),fullPage:true})
})

test('a rejected case shows its concrete review findings without presenting a completed result',async({page})=>{
  await begin(page)
  await page.getByRole('button',{name:'Simulate unresolved content review'}).click()
  await page.getByRole('checkbox',{name:/Ich erlaube/}).check()
  await page.getByRole('button',{name:'Antwort erhalten',exact:true}).click()
  await expect(page.locator('.roadmapError[role=alert]')).toContainText('Kein neues Ergebnis gespeichert')
  const details=page.locator('.customerRoadmapPanel > details')
  await details.locator('summary').click()
  await expect(details).toContainText('Die Berechnung passt nicht zum angegebenen Original.')
  await expect(details).toContainText('Das Schreiben setzt eine unbelegte Vollmacht voraus.')
  await expect(page.getByRole('heading',{name:'Dein Fahrplan zur Auszahlung'})).toHaveCount(0)
  await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:2,saved:2,generated:1,sent:0}))
})

test('an accepted job survives leaving the case and restores its result without another generation',async({page})=>{
  await begin(page)
  await page.getByRole('button',{name:'Hold background job',exact:true}).click()
  await page.getByRole('checkbox',{name:/Ich erlaube/}).check()
  await page.getByRole('button',{name:'Antwort erhalten',exact:true}).click()
  await expect(page.getByTestId('background-case-job')).toContainText('Sie können diese Seite schließen')
  await page.getByRole('button',{name:'Leave case page',exact:true}).click()
  await expect(page.locator('.customerRoadmapPanel')).toHaveCount(0)
  await page.getByRole('button',{name:'Finish background job',exact:true}).click()
  await page.getByRole('button',{name:'Return to case page',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Dein Fahrplan zur Auszahlung'})).toBeVisible()
  await expect(page.getByTestId('background-case-job')).toHaveCount(0)
  await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:2,saved:2,generated:1,sent:0}))
})

test('a rejected background job retains its findings when the case is reopened',async({page})=>{
  await begin(page)
  await page.getByRole('button',{name:'Hold background job',exact:true}).click()
  await page.getByRole('button',{name:'Simulate unresolved content review'}).click()
  await page.getByRole('checkbox',{name:/Ich erlaube/}).check()
  await page.getByRole('button',{name:'Antwort erhalten',exact:true}).click()
  await expect(page.getByTestId('background-case-job')).toBeVisible()
  await page.getByRole('button',{name:'Leave case page',exact:true}).click()
  await page.getByRole('button',{name:'Finish background job',exact:true}).click()
  await page.getByRole('button',{name:'Return to case page',exact:true}).click()
  await expect(page.locator('.roadmapError')).toContainText('Kein neues Ergebnis gespeichert')
  const details=page.locator('.customerRoadmapPanel > details')
  await details.locator('summary').click()
  await expect(details).toContainText('Die Berechnung passt nicht zum angegebenen Original.')
  await expect(page.getByRole('heading',{name:'Dein Fahrplan zur Auszahlung'})).toHaveCount(0)
  await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:2,saved:2,generated:1,sent:0}))
})

test('a queued job can be cancelled without starting another model run',async({page})=>{
  await begin(page)
  await page.getByRole('button',{name:'Hold background job',exact:true}).click()
  await page.getByRole('checkbox',{name:/Ich erlaube/}).check()
  await page.getByRole('button',{name:'Antwort erhalten',exact:true}).click()
  await page.getByTestId('background-case-job').getByRole('button',{name:'Abbrechen',exact:true}).click()
  await expect(page.getByText('Der Auftrag wurde beendet. Ihre Unterlagen bleiben gespeichert.',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Finish background job',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Dein Fahrplan zur Auszahlung'})).toHaveCount(0)
  await expect(page.getByTestId('stats')).toHaveText(JSON.stringify({read:2,saved:2,generated:1,sent:0}))
})
