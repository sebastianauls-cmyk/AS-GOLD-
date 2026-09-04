import { LEGALLY_RELEVANT_PRODUCT_MODULES } from '../workspace/productModuleRegistry.mjs'

export const GERMANY_MASTER_LEGAL_PROFILE_VERSION='v88'

export const GERMANY_OFFICIAL_SOURCES=Object.freeze([
  {key:'bgbl',label:'Bundesgesetzblatt – amtliche Verkündungsplattform',url:'https://www.recht.bund.de/de/home/home_node.html',role:'official_promulgation'},
  {key:'laws',label:'Gesetze im Internet – konsolidiertes Bundesrecht',url:'https://www.gesetze-im-internet.de/',role:'consolidated_federal_law'},
  {key:'federal_gazette',label:'Bundesanzeiger – amtliche Bekanntmachungen',url:'https://www.bundesanzeiger.de/pub/de/start?0=&language=de',role:'official_notices'},
  {key:'justice_portal',label:'Justizportal des Bundes und der Länder',url:'https://justiz.de/',role:'federal_state_justice_services'},
  {key:'eur_lex',label:'EUR-Lex – amtliches EU-Recht',url:'https://eur-lex.europa.eu/',role:'eu_law'}
])

export const GERMANY_COURT_SOURCES=Object.freeze([
  {key:'bverfg',label:'Bundesverfassungsgericht – Entscheidungen',url:'https://www.bundesverfassungsgericht.de/DE/Entscheidungen/entscheidungen_node.html'},
  {key:'bgh',label:'Bundesgerichtshof – Entscheidungsdatenbank',url:'https://www.bundesgerichtshof.de/'},
  {key:'bag',label:'Bundesarbeitsgericht – Entscheidungen',url:'https://www.bundesarbeitsgericht.de/entscheidungen/'},
  {key:'bsg',label:'Bundessozialgericht',url:'https://www.bsg.bund.de/'},
  {key:'bverwg',label:'Bundesverwaltungsgericht – Rechtsprechung',url:'https://www.bverwg.de/rechtsprechung'},
  {key:'bfh',label:'Bundesfinanzhof – Entscheidungen online',url:'https://www.bundesfinanzhof.de/de/entscheidungen/entscheidungen-online/'}
])

export const GERMANY_AUTHORITY_SOURCES=Object.freeze([
  {key:'bfj',label:'Bundesamt für Justiz',url:'https://www.bundesjustizamt.de/'},
  {key:'bfdi',label:'Bundesbeauftragte für den Datenschutz und die Informationsfreiheit',url:'https://www.bfdi.bund.de/'},
  {key:'justice_portal_services',label:'Justizportal – Onlinedienste und Formulare',url:'https://justiz.de/onlinedienste/index.php'}
])

export const GERMANY_CORE_STATUTES=Object.freeze([
  {key:'BGB',topic:'Zivilrecht / Verträge / Verbraucher',url:'https://www.gesetze-im-internet.de/bgb/'},
  {key:'ZPO',topic:'Zivilverfahren / Fristen / Zustellung',url:'https://www.gesetze-im-internet.de/zpo/'},
  {key:'VwVfG',topic:'Verwaltungsverfahren / Behörden',url:'https://www.gesetze-im-internet.de/vwvfg/'},
  {key:'VwGO',topic:'Verwaltungsgerichtliches Verfahren',url:'https://www.gesetze-im-internet.de/vwgo/'},
  {key:'SGB_X',topic:'Sozialverwaltungsverfahren / Sozialdatenschutz / Fristen',url:'https://www.gesetze-im-internet.de/sgb_10/'},
  {key:'ArbGG',topic:'Arbeitsgerichtliches Verfahren',url:'https://www.gesetze-im-internet.de/arbgg/'},
  {key:'VVG',topic:'Versicherungsvertragsrecht',url:'https://www.gesetze-im-internet.de/vvg_2008/'},
  {key:'BDSG',topic:'Datenschutz Deutschland',url:'https://www.gesetze-im-internet.de/bdsg_2018/'},
  {key:'RDG',topic:'Grenzen außergerichtlicher Rechtsdienstleistungen',url:'https://www.gesetze-im-internet.de/rdg/'},
  {key:'PAngV',topic:'Preis-/Tariftransparenz gegenüber Verbrauchern',url:'https://www.gesetze-im-internet.de/pangv_2022/'}
])

export const GERMANY_COVERED_TOPICS=Object.freeze([
  'civil_contract_consumer_law',
  'procedural_deadlines_and_service',
  'administrative_procedure',
  'social_administrative_procedure',
  'employment_procedure',
  'insurance_contract_law',
  'data_protection_compliance',
  'legal_services_boundary',
  'pricing_tariff_transparency',
  'federal_state_justice_services',
  'eu_law_interaction'
])

export const GERMANY_AFFECTED_WORKFLOWS=Object.freeze(
  LEGALLY_RELEVANT_PRODUCT_MODULES.map(module=>module.key)
)

export function germanyMasterLegalProfile(){
  return {
    version:GERMANY_MASTER_LEGAL_PROFILE_VERSION,
    country_code:'DE',
    jurisdiction_label:'Deutschland / deutsches Recht',
    official_sources:[...GERMANY_OFFICIAL_SOURCES],
    court_sources:[...GERMANY_COURT_SOURCES],
    authority_sources:[...GERMANY_AUTHORITY_SOURCES],
    core_statutes:[...GERMANY_CORE_STATUTES],
    covered_topics:[...GERMANY_COVERED_TOPICS],
    affected_workflows:[...GERMANY_AFFECTED_WORKFLOWS],
    legal_assertion_rule:'Nur belegte und auf aktuelle amtliche/gerichtliche Quellen gestützte Aussagen als verifiziert darstellen; bei nicht abschließend bearbeiteten Gesetzesänderungen oder fehlender Rechtsprechungsprüfung ausdrücklich Unsicherheit anzeigen.',
    owner_first:true
  }
}
