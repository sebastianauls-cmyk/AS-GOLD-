// Entirely fictional invoice case reproducing the A–Z update/bilingual scenario.
// Values are test data, not a reproduction of any customer record.
import {roadmapSource,roadmapStyle} from '../../supabase/functions/_shared/customerRoadmap.mjs'
const owner='22222222-2222-4222-8222-222222222222'
const item={id:'11111111-1111-4111-8111-111111111111',owner_id:owner,title:'Synthetischer Test: Forderung prüfen',reference_no:'TEST-104',goal:'Forderung von 3.300 EUR klären und fehlende Aufstellung anfordern.',summary:'Die erste Mahnung nennt noch 3.300 EUR.',home_country:'DE',target_country:'DE'}
const original={id:'33333333-3333-4333-8333-333333333333',owner_id:owner,case_id:item.id,title:'Synthetische Mahnung',document_date:'2026-09-18',updated_at:'2026-09-18T12:00:00Z',data_classification:'synthetic',extracted_text:'SYNTHETISCHER TEST. Keine echten Personen oder Unternehmen.\nBeispiel-Service an Mara Beispiel, Referenz TEST-104, 18.09.2026.\nDer Rechnungsbetrag beträgt 4.800 EUR. Ihre Teilzahlung von 1.800 EUR ist eingegangen. Wir fordern noch 3.300 EUR bis 24.09.2026. Eine Forderungsaufstellung ist nicht beigefügt.'}
const response={id:'44444444-4444-4444-8444-444444444444',owner_id:owner,case_id:item.id,title:'Synthetische Korrektur',document_date:'2026-09-19',updated_at:'2026-09-19T12:00:00Z',data_classification:'synthetic',extracted_text:'SYNTHETISCHER TEST. Keine echten Personen oder Unternehmen.\nBeispiel-Service an Mara Beispiel, Referenz TEST-104, 19.09.2026.\nNach Prüfung bestätigen wir Ihre Teilzahlung von 1.800 EUR auf die Rechnung über 4.800 EUR. Der offene Restbetrag beträgt 3.000 EUR. Die frühere Forderung von 3.300 EUR war unzutreffend. Die Zahlungsfrist 02.10.2026 ersetzt die bisherige Frist 24.09.2026. Eine korrigierte Forderungsaufstellung ist noch nicht beigefügt. Die Zahlung des Restbetrags liegt uns am 19.09.2026 nicht vor.'}
const style=roadmapStyle({customer_name:'Mara Beispiel',sender_name:'Synthetische Testberatung',letterhead:'Interner synthetischer Test',tone:'personal'})
export const roadmapRepairCases={
  initial:{source:roadmapSource(item,[original],[]),style,outputLanguage:'de',referenceLanguage:'de'},
  updated_bilingual:{source:roadmapSource(item,[original,response],[]),style,outputLanguage:'en',referenceLanguage:'de'}
}
