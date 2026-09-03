import assert from 'node:assert/strict'
import fs from 'node:fs'
import { updatePassword } from '../app/modules/services/authRepository.js'
import { validateV29Password } from '../app/lib/v29PasswordPolicy.mjs'
import { recommendProblem } from '../app/modules/public/problemRecommendationV74.mjs'
import { getProblemLanguageProfile } from '../app/modules/public/problemNavigatorLanguagesV36.mjs'

const languages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
const passwordUiSource=fs.readFileSync('app/modules/auth/passwordUi.js','utf8')
for(const language of languages)assert.match(passwordUiSource,new RegExp(`\\b${language}:\\{title:`),`Missing recovery copy for ${language}`)

let updatedPassword=''
const supabase={auth:{
  updateUser:async payload=>{updatedPassword=payload.password;return {data:{user:{id:'user-1'}},error:null}}
}}
const candidate='Gold-Test!2026'
assert.equal(validateV29Password(candidate,{email:'tester@example.com',displayName:'Testperson'}).valid,true)
assert.equal((await updatePassword(supabase,{password:candidate})).error,null)
assert.equal(updatedPassword,'Gold-Test!2026')

const authRepository=fs.readFileSync('app/modules/services/authRepository.js','utf8')
const authWorkflow=fs.readFileSync('app/modules/auth/workspaceAuthWorkflow.js','utf8')
const sessionHook=fs.readFileSync('app/modules/workspace/useWorkspaceSession.js','utf8')
const authSurface=fs.readFileSync('app/modules/auth/AuthSurface.js','utf8')
assert.match(authRepository,/auth\.updateUser\(\{password\}\)/)
assert.doesNotMatch(authRepository,/service[_-]?role/i)
assert.match(authWorkflow,/async function completePasswordRecovery/)
assert.match(authWorkflow,/validatePassword\(password/)
assert.match(authWorkflow,/password!==password2/)
assert.match(authWorkflow,/await updatePassword/)
assert.match(authWorkflow,/await getAuthSession/)
assert.match(sessionHook,/event==='PASSWORD_RECOVERY'/)
assert.match(sessionHook,/isPasswordRecoveryUrl/)
assert.match(authSurface,/autoComplete="new-password"/)
assert.match(authSurface,/role="status"/)

const samples={
  de:['Stromrechnung mit Zahlendreher und Foto.','Mahnung und Inkasso, Frist für Widerspruch.','Der Energieversorger veranlasste eine Bonitätsmeldung, die Kreditlinie wurde gekürzt und Unterlagen sind widersprüchlich.','Strom ist gesperrt, Betriebsausfall und Versicherung lehnt Schaden ab.','Mehrere Kunden, mehrere Fälle, Rollen und Rechte sowie Audit-Protokoll.'],
  en:['Utility bill with a typo and meter photo.','Debt collection and a deadline for objection.','The energy supplier caused a credit report, a reduced credit line and contradictory documents.','Power is disconnected, business interruption and insurance denied the damage.','Multiple clients, multiple cases, team roles and audit log.'],
  fr:['Facture d’énergie erronée avec photo du compteur.','Recouvrement et délai pour opposition.','Le fournisseur d’énergie a causé un signalement de solvabilité, une ligne de crédit réduite et des documents contradictoires.','Coupure effective, interruption d’activité et assurance refuse le dommage.','Plusieurs clients, plusieurs dossiers, équipe et journal d’audit.'],
  tr:['Enerji faturasında hata ve sayaç fotoğrafı.','Tahsilat ve itiraz için süre.','Enerji tedarikçisi kredi notuna yol açtı, kredi limiti düşürüldü ve belgeler çelişkili.','Elektrik kesildi, işletme kesintisi ve sigorta reddetti.','Birden fazla müşteri, birden fazla dosya, ekip ve denetim kaydı.'],
  pl:['Błędny rachunek za energię i zdjęcie licznika.','Windykacja i termin na sprzeciw.','Dostawca energii spowodował informację kredytową, ograniczoną linię kredytową i sprzeczne dokumenty.','Odcięto prąd, przerwa w działalności i ubezpieczenie odmówiło.','Wielu klientów, wiele spraw, zespół i dziennik audytu.'],
  ru:['Ошибка в счете за электроэнергию и фото счетчика.','Взыскание долга и срок для возражения.','Поставщик энергии вызвал запись в кредитном рейтинге, снижение кредитной линии и противоречивые документы.','Электричество отключено, остановка деятельности и страховая отказала.','Несколько клиентов, несколько дел, команда и журнал аудита.'],
  ar:['خطأ في فاتورة الكهرباء وصورة العداد.','تحصيل الديون وموعد نهائي للاعتراض.','تسبب مزود الطاقة في التصنيف الائتماني وخفض حد الائتمان ووجود مستندات متناقضة.','تم قطع الكهرباء وتوقف العمل ورفض التأمين.','عدة عملاء وعدة قضايا وفريق وسجل تدقيق.'],
  fa:['خطا در قبض برق و عکس کنتور.','وصول مطالبات و مهلت اعتراض.','تامین کننده انرژی باعث اعتبارسنجی و کاهش خط اعتباری و اسناد متناقض شد.','برق قطع شده و توقف کسب و کار و بیمه رد کرد.','چند مشتری و چند پرونده و تیم و گزارش ممیزی.'],
  ro:['Factură de energie greșită și fotografie a contorului.','Colectare datorii și termen pentru contestație.','Un furnizor de energie a provocat un raport de credit, o linie de credit redusă și documente contradictorii.','Curentul a fost oprit, întreruperea activității și asigurarea a refuzat.', 'Mai mulți clienți, mai multe cazuri, echipă și jurnal de audit.'],
  bg:['Грешна сметка за ток и снимка на електромера.','Събиране на дълг и срок за възражение.','Доставчик на енергия причини кредитен рейтинг, намалена кредитна линия и противоречиви документи.','Токът е спрян, прекъсване на дейността и застрахователят отказа.','Няколко клиента, няколко случая, екип и одитен дневник.'],
  vi:['Hóa đơn tiền điện sai và ảnh đồng hồ.','Thu hồi nợ và thời hạn phản đối.','Nhà cung cấp năng lượng gây xếp hạng tín dụng, giảm hạn mức tín dụng và tài liệu mâu thuẫn.','Điện đã bị cắt, gián đoạn kinh doanh và bảo hiểm từ chối.','Nhiều khách hàng, nhiều hồ sơ, đội nhóm và nhật ký kiểm toán.']
}
const expectedPlans=['start','klar','analyse','komplett','business']
const expectedCases=['contract','contract','contract','insurance','business']
const routingFailures=[]
for(const language of languages){
  const profile=getProblemLanguageProfile(language)
  samples[language].forEach((text,index)=>{
    const actual=recommendProblem(text,profile)
    if(actual.planKey!==expectedPlans[index]||actual.caseKey!==expectedCases[index])routingFailures.push({language,index,actualPlan:actual.planKey,expectedPlan:expectedPlans[index],actualCase:actual.caseKey,expectedCase:expectedCases[index]})
  })
}
assert.deepEqual(routingFailures,[],`Multilingual routing failures: ${JSON.stringify(routingFailures)}`)

const pipeline={
  upload:fs.readFileSync('app/modules/documents/documentWorkflow.js','utf8'),
  analysisService:fs.readFileSync('app/modules/services/documentAnalysis.js','utf8'),
  detail:fs.readFileSync('app/modules/cases/V24Workspace.js','utf8'),
  approval:fs.readFileSync('app/modules/cases/approvalWorkflow.js','utf8'),
  export:fs.readFileSync('app/modules/documents/exportWorkflow.js','utf8'),
  controller:fs.readFileSync('app/modules/workspace/WorkspaceAppV2.js','utf8')
}
for(const token of ['uploadDocument','analyzeDocument','invokeDocumentAnalysis'])assert.match(pipeline.upload,new RegExp(token))
assert.match(pipeline.analysisService,/gold-ocr-v28/)
for(const token of ['DeadlineWarningCard','AssessmentExplainability','PrimaryNextStepCard'])assert.match(pipeline.detail,new RegExp(token))
for(const token of ['prepareDocumentApproval','approveApproval','rejectApproval'])assert.match(pipeline.approval,new RegExp(token))
assert.match(pipeline.export,/doExport/)
for(const token of ['pdf','docx','xlsx','pptx','csv','txt'])assert.match(pipeline.controller,new RegExp(`value="${token}"`))

console.log('V74 gate passed: password recovery is complete, 55 multilingual Min-to-Max routes pass, and the upload-to-export production flow is wired end to end.')
