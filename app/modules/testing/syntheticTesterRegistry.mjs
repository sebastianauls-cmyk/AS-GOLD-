import { LANGUAGE_CATALOG } from '../language/languageRegistry.mjs'
import { COUNTRY_CATALOG } from '../country/countryRegistry.mjs'

export const SYNTHETIC_TESTER_REGISTRY_VERSION='v96'

const TESTERS=Object.freeze([
  {id:'ST01',name:'Anna Kowalska',language:'pl',home_country:'PL',target_country:'DE',complexity:'low',profile:'Arbeitnehmerin, gutes Polnisch, wenig Deutsch',problem:'Deutsche Arbeitgeberbescheinigung verstehen und nächsten Schritt erkennen',documents:['Arbeitsbescheinigung DE'],expected_ampel:'🟡',expected_actions:['Dokument erklären','Frist und Zuständigkeit prüfen','Antwort in Polnisch ausgeben']},
  {id:'ST02',name:'Mehmet Yilmaz',language:'tr',home_country:'TR',target_country:'DE',complexity:'low',profile:'Selbständig, Türkisch, einfaches Deutsch',problem:'Deutsche Rechnung mit Mahnfrist verstehen',documents:['Rechnung DE','Mahnung DE'],expected_ampel:'🟡',expected_actions:['Betrag und Frist extrahieren','Risiko erklären','nächsten Schritt auf Türkisch ausgeben']},
  {id:'ST03',name:'Linh Nguyen',language:'vi',home_country:'VN',target_country:'DE',complexity:'medium',profile:'Neu in Deutschland, Vietnamesisch, geringe Behördenkenntnis',problem:'Behördenschreiben zu Aufenthalt und Nachweisen verstehen',documents:['Behördenschreiben DE','Nachweisliste DE'],expected_ampel:'🟡',expected_actions:['Behörde und Frist identifizieren','fehlende Nachweise markieren','Handlungsplan auf Vietnamesisch ausgeben']},
  {id:'ST04',name:'Claire Martin',language:'fr',home_country:'FR',target_country:'DE',complexity:'medium',profile:'Mieterin, Französisch, Englisch gut',problem:'Deutschen Mietvertrag und Mängelanzeige einordnen',documents:['Mietvertrag DE','Mängelanzeige FR'],expected_ampel:'🟡',expected_actions:['Dokumente sprachübergreifend zuordnen','Fristen prüfen','Antwortentwurf auf Deutsch plus Erklärung auf Französisch']},
  {id:'ST05',name:'Omar Al-Hassan',language:'ar',home_country:'SA',target_country:'DE',complexity:'medium',profile:'Arabischsprachig, liest kaum Deutsch',problem:'Versicherungsablehnung nach Schaden verstehen',documents:['Versicherungsschreiben DE','Schadenbelege'],expected_ampel:'🟡',expected_actions:['Ablehnungsgrund extrahieren','Unterlagenlücken markieren','nächsten Schritt auf Arabisch ausgeben']},
  {id:'ST06',name:'Farid Rahimi',language:'fa',home_country:'IR',target_country:'DE',complexity:'medium',profile:'Farsi, geringe deutsche Lesekompetenz',problem:'Arbeitsvertrag und Kündigungsschreiben vergleichen',documents:['Arbeitsvertrag DE','Kündigung DE'],expected_ampel:'🔴',expected_actions:['Kündigungsfrist erkennen','akute Frist priorisieren','keine sichere Rechtsaussage ohne Quellenprüfung']},
  {id:'ST07',name:'Elena Popescu',language:'ro',home_country:'RO',target_country:'DE',complexity:'high',profile:'Grenzpendlerin, Rumänisch, gutes Deutsch',problem:'Sozialversicherung, Arbeitgeber und Behörde betreffen denselben Vorgang',documents:['Arbeitgeberbrief DE','Kassenbrief DE','rumänischer Versicherungsnachweis RO'],expected_ampel:'🟡',expected_actions:['Mehrparteien-Sachverhalt strukturieren','Zuständigkeiten trennen','Quellenstatus sichtbar halten']},
  {id:'ST08',name:'Ivan Petrov',language:'bg',home_country:'BG',target_country:'DE',complexity:'high',profile:'Bulgarisch, Bauhandwerker, wenig Schriftdeutsch',problem:'Werklohnforderung, Rechnung und Mängelrüge',documents:['Rechnung DE','Mängelrüge DE','Chatverlauf BG'],expected_ampel:'🟡',expected_actions:['Forderungsstand bilden','Beweise nach Ampel sortieren','Antwortentwurf Deutsch plus Bulgarisch']},
  {id:'ST09',name:'Alexei Morozov',language:'ru',home_country:'RU',target_country:'AE',complexity:'high',profile:'Russisch, Unternehmer',problem:'Vertrag mit Geschäftspartner in den VAE und Zahlungsstreit',documents:['Vertrag EN','Invoice EN','E-Mail RU'],expected_ampel:'⚪',expected_actions:['Zielland korrekt auf AE halten','keine unbestätigte Rechtsbehauptung','offene Länderprüfung sichtbar machen']},
  {id:'ST10',name:'James Miller',language:'en',home_country:'US',target_country:'DE',complexity:'high',profile:'US-Unternehmer, Englisch',problem:'Deutsche Dienstleistungsvereinbarung, Datenschutz und Zahlungsstreit',documents:['Service Agreement DE','DPA EN','Invoice DE'],expected_ampel:'🟡',expected_actions:['Vertrags- und Datenschutzthemen trennen','deutsche Quellenbasis verwenden','Erklärung auf Englisch']},
  {id:'ST11',name:'Sabine Keller',language:'de',home_country:'DE',target_country:'TR',complexity:'very_high',profile:'Deutsche Reisende mit Geschäftsvorgang in der Türkei',problem:'Einreise, Aufenthalt, Vertrag, Behörde und Frist in einem Fall',documents:['Vertrag TR','Behördenschreiben TR','Reisepapiere DE'],expected_ampel:'⚪',expected_actions:['Heimatland und Zielland strikt trennen','Türkei-Quellenstatus prüfen','keine Lücke als gesichert ausgeben','Handlungsreihenfolge erzeugen']},
  {id:'ST12',name:'Marta Zielinska',language:'pl',home_country:'PL',target_country:'TR',complexity:'very_high',profile:'Polnische Unternehmerin, spricht Polnisch, kein Türkisch',problem:'Türkischer Miet-/Gewerbevertrag, Aufenthaltsfrage, Zahlungsstreit und Behördenschreiben',documents:['Gewerbemietvertrag TR','Behördenschreiben TR','Zahlungsbelege PL','E-Mail EN'],expected_ampel:'⚪',expected_actions:['Polnisch als Ausgabesprache halten','PL als Heimatland und TR als Zielland halten','mehrsprachige Dokumente zusammenführen','Quellen und Prüflücken zeigen','konkreten nächsten Schritt auf Polnisch erzeugen']}
])

export const SYNTHETIC_TESTERS=TESTERS

export const SYNTHETIC_TESTER_CONTRACT=Object.freeze({
  version:SYNTHETIC_TESTER_REGISTRY_VERSION,
  synthetic_only:true,
  real_personal_data:false,
  required_checks:Object.freeze([
    'interface_language_kept',
    'output_language_kept',
    'home_country_kept',
    'target_country_kept',
    'country_submodule_resolved',
    'ampel_dot_visible',
    'source_status_visible',
    'confidence_visible',
    'gaps_visible',
    'next_action_visible',
    'no_unverified_legal_claims'
  ])
})

export function syntheticTesterById(id){return SYNTHETIC_TESTERS.find(t=>t.id===id)||null}

export function validateSyntheticTesterCoverage(){
  const languages=new Set(LANGUAGE_CATALOG.map(x=>x.key))
  const countries=new Set(COUNTRY_CATALOG.map(x=>x.key))
  const testerLanguages=new Set(SYNTHETIC_TESTERS.map(x=>x.language))
  const errors=[]
  for(const language of languages) if(!testerLanguages.has(language)) errors.push(`missing_language:${language}`)
  for(const tester of SYNTHETIC_TESTERS){
    if(!languages.has(tester.language)) errors.push(`unknown_language:${tester.id}`)
    if(!countries.has(tester.home_country)) errors.push(`unknown_home_country:${tester.id}`)
    if(!countries.has(tester.target_country)) errors.push(`unknown_target_country:${tester.id}`)
    if(!['🟢','🟡','🔴','⚪'].includes(tester.expected_ampel)) errors.push(`invalid_ampel:${tester.id}`)
    if(!tester.expected_actions?.length) errors.push(`missing_actions:${tester.id}`)
  }
  return {ok:errors.length===0,errors,languages_covered:[...testerLanguages],testers:SYNTHETIC_TESTERS.length}
}
