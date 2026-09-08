import './test_v131_pilot_stress.mjs'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import JSZip from 'jszip'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { COUNTRY_CATALOG } from '../app/modules/country/countryRegistry.mjs'
import {
  CASE_LEGAL_COMPARISON_TOPICS,
  caseLegalComparisonContract,
  normalizeCaseLegalComparisonRecord,
  safeLegalSourceUrl
} from '../app/modules/country/caseLegalComparison.mjs'
import { legalComparisonTopicLabels, legalComparisonUi } from '../app/modules/country/legalComparisonCopy.mjs'
import { buildWorkspaceExportRows, createWorkspaceExportArtifact } from '../app/modules/services/exportService.js'

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8')

assert.equal(APP_RELEASE.number,131)
assert.equal(APP_VERSION,'V131')
assert.equal(CASE_LEGAL_COMPARISON_TOPICS.length,10)

const contract=caseLegalComparisonContract()
assert.equal(contract.version,'v131')
for(const rule of [
  'official_sources_only',
  'visible_clickable_sources',
  'home_country_is_not_automatically_applicable_law',
  'target_country_is_not_automatically_applicable_law',
  'unsupported_claims_become_unknown',
  'professional_review_required',
  'output_language_independent'
]) assert.equal(contract.rules[rule],true,`${rule} must remain enforced`)

assert.equal(safeLegalSourceUrl('javascript:alert(1)'),null)
assert.equal(safeLegalSourceUrl('http://example.gov/rule'),null)
assert.equal(safeLegalSourceUrl('https://person:secret@example.gov/rule'),null)
assert.equal(safeLegalSourceUrl('https://example.gov/rule'),'https://example.gov/rule')

const normalized=normalizeCaseLegalComparisonRecord({
  overall_light:'green',
  sources:[
    {title:'Official rule',url:'https://example.gov/rule',publisher:'Authority'},
    {title:'Unsafe',url:'javascript:alert(1)'}
  ],
  result:{
    applicable_law:{status:'known',explanation:'Claim',missing_factors:['Place'],source_urls:['https://example.gov/rule']},
    rows:[{
      issue:'Customer issue',difference_status:'same',confidence:'high',practical_meaning:'Meaning',
      home:{explanation:'Home rule',source_urls:['https://example.gov/rule']},
      target:{explanation:'Unsupported target rule',source_urls:['https://not-listed.gov/rule']}
    }],
    professional_review_required:false
  }
})
assert.equal(normalized.sources.length,1,'unsafe source URLs must be removed')
assert.equal(normalized.applicable_law.status,'likely','missing applicability facts must prevent a definitive status')
assert.equal(normalized.rows[0].difference_status,'unclear','a comparison without sources for both sides must remain unclear')
assert.equal(normalized.rows[0].confidence,'low')
assert.equal(normalized.light.key,'white','a comparison with no fully supported row must remain white')
assert.equal(normalized.professional_review_required,true,'the review requirement cannot be disabled by stored output')

const languages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
for(const language of languages){
  const ui=legalComparisonUi(language)
  for(const field of ['title','intro','baseline','legend','greenLabel','yellowLabel','redLabel','whiteLabel','topic','question','classification','consent','applicableLaw','comparisonPoints','sources','reviewRequired']) assert.ok(ui[field],`${language}.${field} must be visible`)
  const labels=legalComparisonTopicLabels(language)
  for(const topic of CASE_LEGAL_COMPARISON_TOPICS) assert.ok(labels[topic],`${language}.${topic} must have a label`)
}

const component=read('app/modules/country/LegalComparisonPanel.js')
const service=read('app/modules/services/legalComparison.js')
const caseWorkspace=read('app/modules/cases/CaseWorkspace.js')
const controller=read('app/modules/workspace/WorkspaceController.js')
const edge=read('supabase/functions/gold-legal-comparison/index.ts')
const migration=read('supabase/migrations/20260908130238_v131_case_legal_comparisons.sql')
const css=read('app/globals.css')
const exportService=read('app/modules/services/exportService.js')

assert.match(caseWorkspace,/<LegalComparisonPanel/)
assert.match(controller,/outputLanguage=\{outputLanguage\}[\s\S]*onPrivacyUpdate=\{setPrivacySettings\}/)
assert.match(component,/applicableLawCard/)
assert.match(component,/legalComparisonLegend/)
assert.match(component,/target="_blank" rel="noreferrer"/,'official citations must be clickable')
assert.match(component,/dataClassification:classification/)
assert.match(service,/\.eq\('home_country',homeCountry\)/)
assert.match(service,/\.eq\('target_country',targetCountry\)/)
assert.match(service,/privacy_notice_version/)

assert.match(edge,/type:'web_search',filters:\{allowed_domains:allowedDomains\}/)
assert.match(edge,/include:\['web_search_call\.action\.sources'\]/)
assert.match(edge,/professional_review_required:true/)
assert.match(edge,/home country and target country alone never establish applicable law/i)
assert.match(edge,/unsupported[\s\S]*official primary source/i)
assert.match(edge,/SUPABASE_SERVICE_ROLE_KEY/)
assert.match(edge,/client\.from\('cases'\)[\s\S]*\.eq\('owner_id',user\.id\)/)
assert.match(edge,/client\.from\('documents'\)[\s\S]*\.in\('data_classification',\['synthetic','anonymized'\]\)/)
for(const country of COUNTRY_CATALOG) assert.match(edge,new RegExp(`\\b${country.key}:\\{`),`${country.key} must have an official-source profile`)
for(const topic of CASE_LEGAL_COMPARISON_TOPICS) assert.match(edge,new RegExp(`\\b${topic}:`),`${topic} must be supported server-side`)

assert.match(migration,/alter table public\.legal_comparisons enable row level security/)
assert.match(migration,/revoke all on public\.legal_comparisons from anon, authenticated/)
assert.match(migration,/grant select on public\.legal_comparisons to authenticated/)
assert.doesNotMatch(migration,/grant\s+(?:insert|update|delete)[^;]*authenticated/i,'clients must not forge legal research provenance')
assert.match(migration,/status in \('research_draft','professionally_reviewed','superseded'\)/)
assert.match(css,/@media\(max-width:760px\)[^\n]*legalComparisonLegend/,'the comparison must collapse to one column on mobile')

// Final synthetic output chain: case + document + traffic-light analysis + deadline + approval + bilingual output.
const exportCopy={
  ex:{
    documentTitle:'Dokumentausgabe',document:'Dokument',documentType:'Dokumenttyp',documentDate:'Dokumentdatum',analysis:'Analyse',traffic:'Ampel',nextStep:'Nächster Schritt',extracted:'Erkannter Inhalt',noAnalysis:'Keine Analyse',
    caseTitle:'Fallausgabe',case:'Fall',status:'Status',open:'Offen',closed:'Geschlossen',yellow:'Gelb',green:'Grün',red:'Rot',summary:'Zusammenfassung',documents:'Dokumente',none:'Keine'
  },
  core:{homeCountry:'Heimatland',targetCountry:'Zielland',goal:'Ziel',deadline:'Frist',nextAction:'Nächste Aktion',currentAssessments:'Aktuelle Bewertungen',sourceBasis:'Grundlage'},
  approvalUi:{body:'Schreiben',title:'Freigaben',approved:'Freigegeben',pending:'Ausstehend',rejected:'Abgelehnt',revision:'Version'}
}

const syntheticDocument={
  id:'synthetic-doc-1',case_id:'synthetic-case-1',title:'Synthetisches Behördenschreiben',document_type:'letter',document_date:'2026-09-08',
  analysis_summary:'Fristgebundenes Schreiben; Nachweis A fehlt noch.',analysis_traffic_light:'red',analysis_next_step:'Nachweis A ergänzen und Antwort vor Frist prüfen.',
  extracted_text:'Rein synthetischer Dokumentinhalt ohne echte personenbezogene Daten.',
  reference_copy:'Sehr geehrte Damen und Herren,\n\nwir reichen den fehlenden Nachweis nach.',reference_copy_language:'de',
  customer_copy:'Szanowni Państwo,\n\nuzupełniamy brakujący dokument.',customer_copy_language:'pl'
}
const syntheticCase={
  id:'synthetic-case-1',title:'Synthetischer Abschlussfall',status:'open',traffic_light:'yellow',home_country:'PL',target_country:'DE',
  goal:'Fristgerecht reagieren und Unterlagen vervollständigen.',summary:'Synthetischer Fall für die v131-Abnahme.',deadline_at:'2026-09-12T12:00:00.000Z',next_action:'Dokument prüfen und Freigabe vorbereiten.'
}
const syntheticData={
  documents:[syntheticDocument],
  assessments:[
    {case_id:'synthetic-case-1',traffic_light:'green',title:'Formprüfung',reasoning:'Form vollständig.',next_step:'Inhalt prüfen.'},
    {case_id:'synthetic-case-1',traffic_light:'yellow',title:'Nachweislage',reasoning:'Ein Nachweis fehlt.',next_step:'Nachweis ergänzen.'},
    {case_id:'synthetic-case-1',traffic_light:'red',title:'Frist',reasoning:'Kurze Reaktionsfrist.',next_step:'Sofort bearbeiten.'}
  ],
  sourceStatus:[{case_id:'synthetic-case-1',source_label:'Synthetisches Schreiben',source_kind:'document',status:'verified',details:'Nur Testdaten'}],
  approvals:[{case_id:'synthetic-case-1',subject:'Antwortentwurf',approval_type:'letter',status:'approved',preview_revision:3}]
}

const documentRows=buildWorkspaceExportRows({ref:{kind:'document',item:syntheticDocument},data:syntheticData,copy:exportCopy,outputLanguage:'pl'})
const documentText=documentRows.map(row=>`${row[0]}: ${row[1]}`).join('\n')
assert.match(documentText,/Synthetisches Behördenschreiben/)
assert.match(documentText,/🔴\s+Rot/,'document export must carry a visible red traffic-light marker')
assert.match(documentText,/Fristgebundenes Schreiben/)
assert.match(documentText,/Nachweis A ergänzen/)
assert.match(documentText,/REFERENZFASSUNG \/ REFERENCE VERSION – Deutsch/)
assert.match(documentText,/KUNDENFASSUNG \/ CUSTOMER VERSION – Polski/)

const caseRows=buildWorkspaceExportRows({ref:{kind:'case',item:syntheticCase},data:syntheticData,copy:exportCopy,outputLanguage:'de'})
const caseText=caseRows.map(row=>`${row[0]}: ${row[1]}`).join('\n')
assert.match(caseText,/🟡\s+Gelb/,'case export must carry its visible traffic-light marker')
assert.match(caseText,/2026|12\.9|09\/12|12\/09/,'case export must include the deadline')
assert.match(caseText,/🟢\s+Grün/)
assert.match(caseText,/🟡\s+Gelb/)
assert.match(caseText,/🔴\s+Rot/)
assert.match(caseText,/Synthetisches Schreiben/)
assert.match(caseText,/Antwortentwurf/)
assert.match(caseText,/Freigegeben/)

assert.match(exportService,/context\.arc\(/,'PDF traffic lights must be drawn as real colored circles')
assert.match(exportService,/DOCX_TRAFFIC_COLORS/,'Word traffic colors must be defined explicitly')
assert.match(exportService,/text:'● '/,'Word traffic lights must use a real colored dot, not text-only color names')

const wordArtifact=await createWorkspaceExportArtifact({ref:{kind:'case',item:syntheticCase},type:'docx',data:syntheticData,copy:exportCopy,outputLanguage:'de'})
assert.equal(wordArtifact.filename,'Synthetischer_Abschlussfall.docx')
assert.ok(wordArtifact.blob.size>500,'synthetic Word export must produce a non-empty document')
const zip=await JSZip.loadAsync(await wordArtifact.blob.arrayBuffer())
const documentXml=await zip.file('word/document.xml').async('string')
assert.match(documentXml,/2F855A/i,'Word output must contain a real green traffic-light color')
assert.match(documentXml,/D69E2E/i,'Word output must contain a real yellow traffic-light color')
assert.match(documentXml,/C53030/i,'Word output must contain a real red traffic-light color')
assert.match(documentXml,/●/,'Word output must contain visible traffic-light dots')
assert.match(documentXml,/Synthetischer Abschlussfall/)
assert.match(documentXml,/Antwortentwurf/)

console.log('V131 final synthetic output guard passed: document analysis, colored traffic lights, deadline, next step, bilingual letter, approval and Word export remain complete.')
console.log('V131 legal-comparison guard passed: case-specific, source-bound, multilingual, immutable and review-required comparison flow is wired end to end.')
