import {workflowErrorMessage} from '../services/workflowError.mjs'
import {documentAnalysisProgressCopy,documentAnalysisProgressLabel} from './documentAnalysisProgress.mjs'

export const documentFailureCodes=new Set(['provider_timeout','provider_network','provider_http','provider_rate_limit','provider_auth','provider_token_limit','provider_incomplete','provider_invalid_json','review_invalid','model_workflow_failed','request_failed','function_timeout','function_resources','function_http','function_relay','network_error','session_expired','invalid_response','review_unresolved','source_unresolved','configuration_required'])
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const copy={
  de:['Die Verbindung wurde unterbrochen. Ein abgeschlossenes Ergebnis wurde nicht wiederhergestellt.','Die Analyse wurde wegen eines Zeitlimits abgebrochen. Ein abgeschlossenes Ergebnis wurde nicht wiederhergestellt.','Der Analysedienst konnte die Anfrage nicht verarbeiten. Es liegt kein vollständig geprüftes Ergebnis vor.','Der Analysedienst lieferte eine unvollständige oder nicht auswertbare Antwort. Es liegt kein vollständig geprüftes Ergebnis vor.','Die Sitzung ist abgelaufen. Bitte erneut anmelden.','Fehlerdetails','Prüfschritt'],
  en:['The connection was interrupted. A completed result could not be restored.','The analysis timed out. A completed result could not be restored.','The analysis service could not process the request. No fully reviewed result is available.','The analysis service returned an incomplete or unreadable response. No fully reviewed result is available.','Your session has expired. Please sign in again.','Error details','Review step'],
  fr:['La connexion a été interrompue. Aucun résultat terminé n’a pu être restauré.','L’analyse a dépassé le délai. Aucun résultat terminé n’a pu être restauré.','Le service d’analyse n’a pas pu traiter la demande. Aucun résultat entièrement vérifié n’est disponible.','Le service a renvoyé une réponse incomplète ou illisible. Aucun résultat entièrement vérifié n’est disponible.','Votre session a expiré. Reconnectez-vous.','Détails de l’erreur','Étape de vérification'],
  tr:['Bağlantı kesildi. Tamamlanmış bir sonuç geri yüklenemedi.','Analiz zaman aşımına uğradı. Tamamlanmış bir sonuç geri yüklenemedi.','Analiz hizmeti isteği işleyemedi. Tam olarak incelenmiş bir sonuç yok.','Analiz hizmeti eksik veya okunamayan bir yanıt verdi. Tam olarak incelenmiş bir sonuç yok.','Oturumunuz sona erdi. Yeniden giriş yapın.','Hata ayrıntıları','İnceleme adımı'],
  pl:['Połączenie zostało przerwane. Nie udało się przywrócić ukończonego wyniku.','Przekroczono czas analizy. Nie udało się przywrócić ukończonego wyniku.','Usługa analizy nie mogła przetworzyć żądania. Brak w pełni sprawdzonego wyniku.','Usługa zwróciła niepełną lub nieczytelną odpowiedź. Brak w pełni sprawdzonego wyniku.','Sesja wygasła. Zaloguj się ponownie.','Szczegóły błędu','Etap sprawdzania'],
  ru:['Соединение прервано. Завершённый результат не удалось восстановить.','Время анализа истекло. Завершённый результат не удалось восстановить.','Сервис анализа не смог обработать запрос. Полностью проверенного результата нет.','Сервис вернул неполный или нечитаемый ответ. Полностью проверенного результата нет.','Сеанс истёк. Войдите снова.','Сведения об ошибке','Этап проверки'],
  ar:['انقطع الاتصال. تعذّر استعادة نتيجة مكتملة.','انتهت مهلة التحليل. تعذّر استعادة نتيجة مكتملة.','تعذّر على خدمة التحليل معالجة الطلب. لا تتوفر نتيجة تمت مراجعتها بالكامل.','أعادت خدمة التحليل استجابة ناقصة أو غير قابلة للقراءة. لا تتوفر نتيجة تمت مراجعتها بالكامل.','انتهت جلستك. سجّل الدخول مجدداً.','تفاصيل الخطأ','مرحلة المراجعة'],
  fa:['ارتباط قطع شد. نتیجه تکمیل‌شده بازیابی نشد.','مهلت تحلیل به پایان رسید. نتیجه تکمیل‌شده بازیابی نشد.','سرویس تحلیل نتوانست درخواست را پردازش کند. نتیجه کاملاً بررسی‌شده‌ای موجود نیست.','پاسخ سرویس تحلیل ناقص یا ناخوانا بود. نتیجه کاملاً بررسی‌شده‌ای موجود نیست.','نشست شما منقضی شده است. دوباره وارد شوید.','جزئیات خطا','مرحله بررسی'],
  ro:['Conexiunea a fost întreruptă. Nu s-a putut recupera un rezultat finalizat.','Analiza a depășit timpul disponibil. Nu s-a putut recupera un rezultat finalizat.','Serviciul de analiză nu a putut procesa cererea. Nu există un rezultat verificat integral.','Serviciul a returnat un răspuns incomplet sau ilizibil. Nu există un rezultat verificat integral.','Sesiunea a expirat. Autentificați-vă din nou.','Detalii eroare','Etapa verificării'],
  bg:['Връзката е прекъсната. Завършен резултат не можа да бъде възстановен.','Времето за анализ изтече. Завършен резултат не можа да бъде възстановен.','Услугата за анализ не можа да обработи заявката. Няма изцяло проверен резултат.','Услугата върна непълен или нечетим отговор. Няма изцяло проверен резултат.','Сесията е изтекла. Влезте отново.','Подробности за грешката','Етап на проверката'],
  vi:['Kết nối bị gián đoạn. Không thể khôi phục kết quả đã hoàn tất.','Phân tích đã hết thời gian. Không thể khôi phục kết quả đã hoàn tất.','Dịch vụ phân tích không thể xử lý yêu cầu. Chưa có kết quả được kiểm tra đầy đủ.','Dịch vụ trả về phản hồi không đầy đủ hoặc không đọc được. Chưa có kết quả được kiểm tra đầy đủ.','Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.','Chi tiết lỗi','Bước kiểm tra']
}
export function documentAnalysisErrorCopy(language='de'){
  const [network,timeout,service,invalid,session,details,stage]=copy[language]||copy.de
  return {network,timeout,service,invalid,session,details,stage}
}
const httpStatus=value=>Number.isInteger(value)&&value>=100&&value<=599?value:null

// Read only bounded, allowlisted diagnostics. Never display or audit raw provider
// bodies, document text, JWTs, checkpoint contents or model review explanations.
export async function readDocumentAnalysisError(error,fallback,language='de',context={}){
  context=error?.analysis_context||context
  const original=error?.cause||error
  const response=original?.context
  let payload=original||{}
  try {if(typeof response?.json==='function')payload=await (response.clone?.()||response).json()}catch{}
  if(!payload||typeof payload!=='object')payload={}
  const status=httpStatus(response?.status)
  let code=documentFailureCodes.has(payload.code)?payload.code:null
  if(!code)code=status===504?'function_timeout':status===546?'function_resources':status===401?'session_expired':original?.name==='FunctionsRelayError'?'function_relay':status?'function_http':original?.name==='FunctionsFetchError'||original?.name==='TypeError'?'network_error':'request_failed'
  const labels=documentAnalysisErrorCopy(language)
  const group=['provider_timeout','function_timeout'].includes(code)?'timeout':code==='session_expired'?'session':['provider_network','network_error','function_relay'].includes(code)?'network':['provider_token_limit','provider_incomplete','provider_invalid_json','review_invalid','invalid_response'].includes(code)?'invalid':'service'
  const typed=String(payload.code||'').startsWith('provider_')||payload.code==='review_invalid'
  const message=workflowErrorMessage(typed?{code:payload.code}:payload,labels[group]||fallback,language)
  const metadata={code,stage:['generation','review','correction'].includes(context.stage)?context.stage:'request',attempt:[1,2].includes(context.attempt)?context.attempt:1}
  if(status)metadata.http_status=status
  if(httpStatus(payload.provider_status))metadata.provider_status=payload.provider_status
  if(uuid.test(context.request_id||''))metadata.request_id=context.request_id
  if(uuid.test(payload.attempt_id||''))metadata.attempt_id=payload.attempt_id
  const stageLabel=documentAnalysisProgressLabel(documentAnalysisProgressCopy(language),metadata)
  const technical=[metadata.code,status?`HTTP ${status}`:'',metadata.provider_status?`API ${metadata.provider_status}`:'',metadata.request_id||metadata.attempt_id||''].filter(Boolean).join(' · ')
  return {message,metadata,technical,detailsLabel:labels.details,stageLabel:stageLabel?`${labels.stage}: ${stageLabel}`:'',issues:Array.isArray(payload.issues)?payload.issues:[]}
}

export function recordDocumentAnalysisFailure(supabase,documentId,metadata){
  // Reporting must never keep the failed editor busy or trigger another AI call.
  Promise.resolve().then(()=>supabase.rpc('record_gold_document_analysis_failure',{p_document_id:documentId,p_metadata:metadata})).then(({error})=>{if(error)console.warn('document_analysis_failure_audit_unavailable')}).catch(()=>console.warn('document_analysis_failure_audit_unavailable'))
}
