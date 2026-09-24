import {formatEuro} from './freeCaseAnalysis.mjs'

const de={
  title:'Kostenlose Analyse',mode:'Analysemodus',local:'Kostenlos · ohne KI-Aufruf',paid:'KI-Auswertung öffnen',paidHint:'Die KI-Auswertung kann API-Kosten verursachen und benötigt eine eigene Bestätigung.',
  lead:'Unterlagen ordnen, erkennbare Abrechnungen nachrechnen und offene Angaben finden – direkt auf diesem Gerät.',
  scope:'Erkennt deutschsprachige Texte und EUR-Tabellen im deutschen Zahlenformat. Verwendet nur gespeicherte Dokumenttexte. Keine neue Rechtsrecherche, KI-Bewertung oder automatische Texterkennung.',
  start:'Kostenlos auswerten',refresh:'Erneut kostenlos auswerten',result:'Ergebnis der kostenlosen Analyse',boundary:'Die Ampeln bewerten nur Textverfügbarkeit und Rechenproben. Ansprüche, Steuern und Rechtsfristen bleiben ungeprüft.',
  current:'Auswertung aus dem aktuellen gespeicherten Datenstand.',changed:'Die Unterlagen wurden geändert. Bitte kostenlos neu auswerten.',
  documents:'Unterlagen',checks:'Rechenproben',open:'Im Text als offen oder fehlend beschrieben',dates:'Genannte Daten · keine berechneten Rechtsfristen',
  available:'Text vorhanden',missing:'Text fehlt – Dokument öffnen und Inhalt ergänzen.',truncated:'Langer Text: nur die ersten 120.000 Zeichen berücksichtigt; keine Rechenprobe für dieses Dokument.',
  noDocuments:'Noch keine Unterlagen zugeordnet.',noChecks:'Keine eindeutig unterstützte Abrechnung erkannt. Daraus folgt nicht, dass die Beträge stimmen.',noOpen:'Keine passenden Textstellen erkannt. Das belegt keine Vollständigkeit.',
  source:'Fundstelle',line:'Zeile',column:'Spalte',mathOk:'Rechnerisch passend',mathDiff:'Rechenabweichung',reported:'laut Dokument',difference:'Differenz',rounded:'auf Cent gerundet',
  limitations:{signed_deductions:'Brutto/Netto nicht geprüft: Abzüge enthalten Minuszeichen. Bitte im Original klären, ob damit Abzüge oder Erstattungen gemeint sind.'},
  kinds:{net:'Brutto abzüglich ausgewiesener Abzüge',sum:'Summe der aufgeführten Positionen',divide:'Aufteilung laut Tabellenangabe'},
  table:'Erkannte Betragszeilen',openDocument:'Dokument öffnen',exportError:'Die Datei konnte nicht erstellt werden. Das sichtbare Ergebnis bleibt verfügbar.',
  next:'Als Nächstes',nextMissing:'Fehlende Texte über „Dokument öffnen“ aus der Vorlage ergänzen. Es wird kein kostenpflichtiges Auslesen gestartet.',nextMath:'Rechenabweichungen mit dem Original abgleichen; Beträge nicht automatisch übernehmen.',nextOpen:'Die zitierten offenen Angaben anhand der Originale klären. Dieser Modus erstellt keine rechtliche Gesamtbewertung.',
  counts:s=>`${s.read} von ${s.documents} Dokumenttexten verfügbar · ${s.checks} ${s.checks===1?'Rechenprobe':'Rechenproben'} · ${s.differences} ${s.differences===1?'Abweichung':'Abweichungen'}`,
  omitted:n=>`${n} weitere Dokumente wurden wegen der Grenze von 30 Dokumenten nicht ausgewertet.`,
  report:'Interne Dokumentprüfung · keine KI-Analyse',goal:'Gespeichertes Fallziel',created:'Erstellt',close:'Ergebnis schließen'
}
const en={
  title:'Free analysis',mode:'Analysis mode',local:'Free · no AI request',paid:'Open AI analysis',paidHint:'AI analysis can incur API costs and requires a separate confirmation.',
  lead:'Organise documents, check supported calculations and find missing information directly on this device.',
  scope:'Recognises German text and EUR tables using German number formatting. Uses saved document text only. No new legal research, AI assessment or automatic text extraction.',
  start:'Analyse for free',refresh:'Analyse again for free',result:'Free analysis result',boundary:'The status indicators cover text availability and arithmetic only. Entitlements, tax and legal deadlines remain unreviewed.',
  current:'Based on the current saved documents.',changed:'The documents have changed. Please run the free analysis again.',
  documents:'Documents',checks:'Arithmetic checks',open:'Described as missing or unresolved in the text',dates:'Dates mentioned · no calculated legal deadlines',
  available:'Text available',missing:'Text missing – open the document and add its content.',truncated:'Long text: only the first 120,000 characters considered; no arithmetic checks for this document.',
  noDocuments:'No documents assigned yet.',noChecks:'No unambiguous supported calculation found. This does not establish that the amounts are correct.',noOpen:'No matching passages found. This does not establish completeness.',
  source:'Source',line:'Line',column:'Column',mathOk:'Arithmetic matches',mathDiff:'Arithmetic discrepancy',reported:'as stated',difference:'Difference',rounded:'rounded to cents',
  limitations:{signed_deductions:'Gross/net not checked: deductions include negative amounts. Check the original to determine whether these mean deductions or refunds.'},
  kinds:{net:'Gross less listed deductions',sum:'Sum of listed items',divide:'Division specified in the table'},
  table:'Recognised amount rows',openDocument:'Open document',exportError:'The file could not be created. The displayed result remains available.',
  next:'Next',nextMissing:'Use “Open document” to add missing text from the original. No paid extraction is started.',nextMath:'Compare arithmetic discrepancies with the original; do not automatically adopt the amounts.',nextOpen:'Clarify the quoted missing information against the originals. This mode does not produce a legal assessment.',
  counts:s=>`${s.read} of ${s.documents} document texts available · ${s.checks} arithmetic checks · ${s.differences} discrepancies`,
  omitted:n=>`${n} further documents were not processed because the limit is 30 documents.`,
  report:'Internal document check · no AI analysis',goal:'Saved case goal',created:'Created',close:'Close result'
}

export const freeAnalysisCopy=language=>language==='de'?de:en
export const freeAnalysisLanguage=language=>language==='de'?'de':'en'
export function freeCheckTitle(check,language='de'){
  const ui=freeAnalysisCopy(language)
  return `${check.column||`${ui.column} ${check.column_index}`} · ${ui.kinds[check.kind]}`
}
export function freeCheckEquation(check,language='de'){
  const ui=freeAnalysisCopy(language)
  const operation=check.inputs.map(input=>formatEuro(input.cents,language)).join(check.kind==='net'?' − ':' + ')+(check.kind==='divide'?` ÷ ${check.divisor}`:'')
  return `${operation} = ${formatEuro(check.expected,language)}${check.rounded?` (${ui.rounded})`:''}; ${ui.reported}: ${formatEuro(check.actual,language)}${check.matches?'':`; ${ui.difference}: ${formatEuro(check.difference,language)}`}`
}

export function freeAnalysisBlocks(result,language='de',createdAt=new Date().toISOString()){
  const ui=freeAnalysisCopy(language)
  const blocks=[]
  const add=(text,kind='body',light=null)=>blocks.push({text,kind,light})
  add(`${ui.result}: ${result.title}`,'title')
  add(ui.report,'meta');add(`${ui.created}: ${createdAt}`,'meta')
  add(ui.scope);add(ui.boundary);add(ui.counts(result.summary))
  if(result.omitted_documents)add(ui.omitted(result.omitted_documents),'body','yellow')
  if(result.goal){add(ui.goal,'heading');add(result.goal)}
  add(ui.next,'heading')
  if(result.documents.some(doc=>!doc.has_text))add(ui.nextMissing)
  if(result.summary.differences)add(ui.nextMath)
  add(ui.nextOpen)
  for(const doc of result.documents){
    add(doc.title,'heading');add(doc.has_text?ui.available:ui.missing,'body',doc.has_text?'green':'yellow')
    if(doc.truncated)add(ui.truncated,'body','yellow')
    for(const limitation of doc.limitations||[]){
      add(ui.limitations[limitation.code],'body','yellow')
      for(const row of limitation.sources)add(`${ui.source} · ${ui.line} ${row.line_start}: ${row.quote}`,'meta')
    }
    if(doc.checks.length)add(ui.checks,'heading')
    for(const check of doc.checks){
      add(freeCheckTitle(check,language),'heading')
      add(`${check.matches?ui.mathOk:ui.mathDiff}: ${freeCheckEquation(check,language)}`,'body',check.matches?'green':'red')
      for(const row of [...check.inputs,check.target])add(`${ui.source} · ${ui.line} ${row.line_start}: ${row.quote}`,'meta')
    }
    if(doc.open.length)add(ui.open,'heading')
    for(const entry of doc.open)add(entry.quote,'body','yellow')
    if(doc.dates.length)add(ui.dates,'heading')
    for(const entry of doc.dates)add(`${entry.date}: ${entry.quote}`)
    if(doc.tables.length)add(ui.table,'heading')
    for(const table of doc.tables)for(const row of table.rows)add(`${ui.line} ${row.line_start}: ${row.quote}`,'meta')
  }
  if(!result.summary.documents)add(ui.noDocuments)
  if(!result.summary.checks)add(ui.noChecks)
  if(!result.summary.open)add(ui.noOpen)
  return blocks
}
