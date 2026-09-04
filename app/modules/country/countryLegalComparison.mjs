import { countryByKey, normalizeCountryContext } from './countryRegistry.mjs'
import { validateCountryLegalModule } from './countryLegalModuleRegistry.mjs'

export const COUNTRY_LEGAL_COMPARISON_VERSION='v85'

export const LEGAL_COMPARISON_TRAFFIC_LIGHTS=Object.freeze({
  green:Object.freeze({key:'green',symbol:'🟢',label:'Grün',meaning:'vergleichbar geprüft / kein wesentlicher offener Unterschied im geprüften Bereich'}),
  yellow:Object.freeze({key:'yellow',symbol:'🟡',label:'Gelb',meaning:'Unterschied oder Prüfbedarf vorhanden; vor Nutzung klären'}),
  red:Object.freeze({key:'red',symbol:'🔴',label:'Rot',meaning:'wesentlicher Unterschied, fehlende belastbare Grundlage oder Nutzung derzeit nicht freigegeben'})
})

function light(key){return LEGAL_COMPARISON_TRAFFIC_LIGHTS[key]}
function list(value){return Array.isArray(value)?value:[]}
function setDiff(left,right){
  const l=new Set(list(left));const r=new Set(list(right))
  return {only_reference:[...l].filter(x=>!r.has(x)),only_target:[...r].filter(x=>!l.has(x)),common:[...l].filter(x=>r.has(x))}
}

export function compareCountryLegalModules(referenceRecord,targetRecord){
  validateCountryLegalModule(referenceRecord)
  validateCountryLegalModule(targetRecord)
  const reference=countryByKey(normalizeCountryContext(referenceRecord.country_code))
  const target=countryByKey(normalizeCountryContext(targetRecord.country_code))
  const rows=[]

  const readinessKey=targetRecord.status==='ready'?'green':targetRecord.status==='suspended'?'red':'yellow'
  rows.push({
    dimension:'Einsatzbereitschaft',
    ...light(readinessKey),
    reference:referenceRecord.status,
    target:targetRecord.status,
    explanation:targetRecord.status==='ready'?'Das Zielland ist nach Quellen- und Grundprüfung freigegeben.':targetRecord.status==='suspended'?'Das Zielland ist gesperrt und darf derzeit nicht als belastbarer Rechtsraum verwendet werden.':'Das Zielland ist noch nicht vollständig geprüft; Ergebnisse müssen als vorläufig gekennzeichnet werden.'
  })

  const sourceGroups=['official_sources','court_sources','authority_sources']
  for(const group of sourceGroups){
    const ref=list(referenceRecord[group]);const tar=list(targetRecord[group])
    const key=tar.length===0?'red':tar.length<ref.length?'yellow':'green'
    rows.push({dimension:group,...light(key),reference_count:ref.length,target_count:tar.length,explanation:tar.length===0?'Für diese Quellenart fehlt im Zielland noch eine geprüfte Quelle.':key==='yellow'?'Die Quellenabdeckung ist geringer als im Referenzland und sollte ergänzt werden.':'Für diese Quellenart ist eine belastbare Abdeckung vorhanden.'})
  }

  const topics=setDiff(referenceRecord.covered_topics,targetRecord.covered_topics)
  rows.push({
    dimension:'Abgedeckte Rechtsgebiete',
    ...light(topics.only_reference.length===0?'green':targetRecord.status==='ready'?'yellow':'red'),
    differences:topics,
    explanation:topics.only_reference.length===0?'Alle im Referenzmodul erfassten Rechtsgebiete sind auch im Zielland abgedeckt.':`Im Zielland fehlen noch ${topics.only_reference.length} im Referenzmodul vorhandene Rechtsgebiete.`
  })

  const workflows=setDiff(referenceRecord.affected_workflows,targetRecord.affected_workflows)
  rows.push({
    dimension:'Betroffene AS-Workflows',
    ...light(workflows.only_reference.length===0?'green':'yellow'),
    differences:workflows,
    explanation:workflows.only_reference.length===0?'Die bekannten Workflow-Auswirkungen sind vollständig gespiegelt.':'Einige im Referenzland betroffene Workflows sind im Zielland noch nicht zugeordnet; vor automatischer Nutzung prüfen.'
  })

  const hasBaseline=!!targetRecord.baseline_checked_at
  const hasDelta=!!targetRecord.delta_checked_at
  rows.push({
    dimension:'Aktualität der Rechtsprüfung',
    ...light(!hasBaseline?'red':!hasDelta?'yellow':'green'),
    baseline_checked_at:targetRecord.baseline_checked_at||null,
    delta_checked_at:targetRecord.delta_checked_at||null,
    explanation:!hasBaseline?'Es gibt noch keine abgeschlossene Grundprüfung des Ziellandes.':!hasDelta?'Die Grundprüfung existiert, aber eine laufende Änderungsprüfung ist noch nicht dokumentiert.':'Grundprüfung und laufende Änderungsprüfung sind dokumentiert.'
  })

  const severity=rows.some(row=>row.key==='red')?'red':rows.some(row=>row.key==='yellow')?'yellow':'green'
  return {
    version:COUNTRY_LEGAL_COMPARISON_VERSION,
    reference_country:{code:reference.key,label:reference.label,jurisdiction:reference.jurisdictionLabel},
    target_country:{code:target.key,label:target.label,jurisdiction:target.jurisdictionLabel},
    overall:light(severity),
    rows,
    rule:'Ampel bewertet Prüf- und Abdeckungsunterschiede; sie ersetzt keine inhaltliche Rechtsvergleichung. Inhaltliche Rechtsunterschiede dürfen erst nach belegter Quellenprüfung als solche behauptet werden.'
  }
}

export function countryLegalComparisonContract(){
  return {version:COUNTRY_LEGAL_COMPARISON_VERSION,lights:Object.values(LEGAL_COMPARISON_TRAFFIC_LIGHTS),dimensions:['Einsatzbereitschaft','official_sources','court_sources','authority_sources','Abgedeckte Rechtsgebiete','Betroffene AS-Workflows','Aktualität der Rechtsprüfung']}
}
