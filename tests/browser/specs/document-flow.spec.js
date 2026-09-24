import {test,expect} from '@playwright/test'

test.skip(process.env.ASH_BROWSER_LOCAL!=='true','Persistence fixture is deliberately absent from production.')
async function prepare(page,{sample=false}={}){
  await page.goto('/qa-document-flow')
  if(sample)await page.getByRole('button',{name:'Synthetische Musterdatei auswählen',exact:true}).click()
  else await page.locator('input[name=file]').setInputFiles({name:'Erfundene_Rechnung.txt',mimeType:'text/plain',buffer:Buffer.from('ERFUNDENE RECHNUNG: 900 EUR offen.')})
  await page.locator('select[name=data_classification]').selectOption('synthetic')
  await page.locator('input[name=test_data_confirmed]').check()
  console.log('DOCUMENT_INTAKE_LAYOUT',JSON.stringify(await page.locator('form.actionCard').evaluate(form=>({viewport:innerWidth,form:form.getBoundingClientRect().toJSON(),grid:getComputedStyle(form).gridTemplateColumns,items:[...form.children].map(element=>({tag:element.tagName,class:element.className,rect:element.getBoundingClientRect().toJSON(),height:getComputedStyle(element).height,position:getComputedStyle(element).position,gridColumn:getComputedStyle(element).gridColumn})),confirmation:[...form.querySelector('.documentPrivacyConfirm').children].map(element=>({tag:element.tagName,rect:element.getBoundingClientRect().toJSON(),height:getComputedStyle(element).height,position:getComputedStyle(element).position}))}))))
}
for(const audit of ['pending','rejected'])test('document upload and save survive '+audit+' optional audit and unavailable device storage',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message))
  await prepare(page)
  if(audit==='rejected')await page.getByRole('button',{name:'Reject optional audit',exact:true}).click()
  await page.getByRole('button',{name:'Hochladen',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Dokument prüfen',exact:true})).toBeVisible()
  console.log('DOCUMENT_EDITOR_LABELS',JSON.stringify(await page.locator('.documentReviewForm label').allTextContents()))
  await page.getByLabel(/^Ausgelesener Inhalt/).fill('ERFUNDENE RECHNUNG: 900 EUR; Zahlungsstand noch zu klären.')
  await page.locator('.documentReviewForm').getByRole('button',{name:'Geprüfte Angaben bewusst speichern',exact:true}).click()
  await expect(page.getByTestId('saved-document')).toContainText('Zahlungsstand noch zu klären.')
  await expect(page.getByTestId('document-message')).toContainText('✓')
  await expect(page.getByTestId('document-counts')).toHaveText(JSON.stringify({uploads:1,inserts:1,updates:1,removals:0,rows:1}))
  expect(errors).toEqual([])
})

for(const [failure,inserts,sample] of [['Lose save confirmation',1,false],['Lose first save request',2,true]])test('retry reuses the original file after '+failure,async({page})=>{
  await prepare(page,{sample})
  await page.getByRole('button',{name:failure,exact:true}).click()
  await page.getByRole('button',{name:'Hochladen',exact:true}).click()
  await expect(page.getByTestId('document-message')).toContainText('Speichern ist noch nicht bestätigt')
  if(sample)await expect(page.locator('input[name=sample_document]')).toHaveValue('synthetic-v29')
  else await expect(page.locator('input[name=file]')).not.toHaveValue('')
  await page.getByRole('button',{name:'Restore connection',exact:true}).click()
  await page.getByRole('button',{name:'Hochladen',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Dokument prüfen',exact:true})).toBeVisible()
  await expect(page.getByTestId('document-counts')).toHaveText(JSON.stringify({uploads:1,inserts,updates:0,removals:0,rows:1}))
  await expect(page.getByTestId('saved-document')).toContainText(sample?'ASH_Workspace_Gold_Synthetischer_Testfall_V29.pdf':'900 EUR offen.')
})
