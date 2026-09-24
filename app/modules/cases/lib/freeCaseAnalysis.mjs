// Pure, bounded document checks. No provider, network, background job or generated
// legal conclusion belongs in this module. All findings retain their source text.
export const FREE_ANALYSIS_VERSION='local-document-check-v2'
const MAX_TEXT=120000
const MAX_DOCUMENTS=30
const normalize=value=>String(value||'').replace(/\s+/gu,' ').trim()
const MONEY='[-−]?(?:\\d{1,3}(?:\\.\\d{3})+|\\d+),\\d{2}\\s*(?:EUR|€)'
const moneyRegex=()=>new RegExp(MONEY,'gu')
const onlyMoney=new RegExp(`^(?:${MONEY}\\s*)+$`,'u')

export function hasFreeAnalysisAccess(access){
  return access?.active===true&&access.status==='approved'&&(access.app_role==='owner'||access.permissions?.shared_team_access===true)
}

export function euroCents(value){
  const raw=String(value).replace(/\s|EUR|€/gu,'').replace('−','-')
  if(!/^-?(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}$/u.test(raw))return null
  const cents=Number(raw.replace(/\./gu,'').replace(',',''))
  return Number.isSafeInteger(cents)&&Math.abs(cents)<1e12?cents:null
}

export function formatEuro(cents,language='de'){
  return new Intl.NumberFormat(language==='de'?'de-DE':'en-IE',{style:'currency',currency:'EUR'}).format(cents/100)
}

function columns(header,count){
  const raw=header.replace(/^Position\s*/iu,'').trim()
  const separated=raw.split(/\t+| {2,}|\n|\s*\|\s*|\s*;\s*/u).map(normalize).filter(Boolean)
  if(separated.length===count)return separated
  const labelled=raw.match(/\b(?:Kind|Person|Child)\s+[\p{L}\d]+\b/gu)||[]
  if(labelled.length===count&&normalize(labelled.join(' '))===normalize(raw))return labelled
  return Array.from({length:count},()=>null)
}

// Restrict arithmetic to explicitly headed tables. Text near an amount is not
// enough to establish its role. Unknown layouts remain visible as source text.
export function readMoneyTables(text){
  const lines=String(text).split(/\r?\n/u)
  const tables=[]
  let table=null
  for(let index=0;index<lines.length;index++){
    const line=lines[index].trim()
    if(/^Position(?:\s|$)/iu.test(line)){
      table={header:lines[index].replace(/^Position\s*/iu,''),rows:[]}
      tables.push(table)
      continue
    }
    if(!table||!line)continue
    const matches=[...line.matchAll(moneyRegex())]
    const first=matches[0]
    let label=first?line.slice(0,first.index).trim():line
    let end=index
    let values=matches.map(match=>euroCents(match[0]))
    const tail=first?line.slice(first.index):''
    if(!first&&index+1<lines.length&&onlyMoney.test(lines[index+1].trim())){
      values=[]
      while(end+1<lines.length&&onlyMoney.test(lines[end+1].trim())){
        end++
        values.push(...[...lines[end].matchAll(moneyRegex())].map(match=>euroCents(match[0])))
      }
    }else if(!first||!onlyMoney.test(tail)){
      if(!table.rows.length&&/^(?:Kind|Person|Child)\s+[\p{L}\d]+$/u.test(line))table.header+=(table.header?'\n':'')+line
      else if(table.rows.length)table=null
      continue
    }
    if(!label||label.length>120||!values.length||values.length>8||values.some(value=>value===null)){
      table=null
      continue
    }
    table.rows.push({label,values,line_start:index+1,line_end:end+1,quote:lines.slice(index,end+1).join('\n')})
    index=end
  }
  return tables.filter(table=>table.rows.length).map(table=>({...table,columns:columns(table.header,table.rows[0].values.length)}))
}

function tableChecks(table){
  const checks=[],limitations=[]
  const rows=table.rows
  const compatible=group=>group.length>1&&group.every(row=>row.values.length===group[0].values.length)
  const add=(kind,inputs,target,operation,divisor=null)=>{
    if(!compatible([...inputs,target]))return
    for(let index=0;index<target.values.length;index++){
      const raw=operation(inputs.map(row=>row.values[index]))
      // Round exact integer cents symmetrically, including negative half cents.
      const amount=inputs[0].values[index]
      const absolute=Math.abs(amount)
      const expected=divisor?(amount<0?-1:1)*(Math.floor(absolute/divisor)+(absolute%divisor*2>=divisor?1:0)):raw
      if(!Number.isSafeInteger(expected))continue
      const actual=target.values[index]
      checks.push({kind,column:table.columns[index]||null,column_index:index+1,
        inputs:inputs.map(row=>({label:row.label,cents:row.values[index],quote:row.quote,line_start:row.line_start,line_end:row.line_end})),
        target:{label:target.label,cents:actual,quote:target.quote,line_start:target.line_start,line_end:target.line_end},
        expected:expected||0,actual,difference:actual-expected,matches:actual===expected,divisor,rounded:divisor?absolute%divisor!==0:false})
    }
  }
  const gross=rows.filter(row=>/^(?:Bruttobetrag|Gesamtbrutto|Brutto)$/iu.test(row.label))
  const net=rows.filter(row=>/^(?:Auszahlungsbetrag|Nettobetrag|Netto)$/iu.test(row.label))
  const deductions=rows.filter(row=>/^(?:Lohnsteuer|Kirchensteuer|Solidaritätszuschlag|Krankenversicherung|Rentenversicherung|Arbeitslosenversicherung|Pflegeversicherung|SV-Abzug)$/iu.test(row.label))
  if(gross.length===1&&net.length===1&&deductions.length&&rows.length===deductions.length+2){
    const signed=deductions.filter(row=>row.values.some(value=>value<0))
    // A negative tax row can be a signed deduction or a refund. The layout alone
    // cannot decide which convention is intended; retain it without a red/green check.
    if(signed.length)limitations.push({code:'signed_deductions',sources:signed})
    else add('net',[gross[0],...deductions],net[0],values=>values[0]-values.slice(1).reduce((sum,value)=>sum+value,0))
  }
  const last=rows.at(-1)
  if(rows.length>2&&/^(?:Gesamter Bruttoanspruch|Gesamtbetrag|Gesamtsumme|Summe|Festgesetzter Monatsbeitrag)$/iu.test(last.label)&&!rows.slice(0,-1).some(row=>/gesamt|summe|brutto|netto|auszahlung/iu.test(row.label))){
    add('sum',rows.slice(0,-1),last,values=>values.reduce((sum,value)=>sum+value,0))
  }
  for(let index=1;index<rows.length;index++){
    const match=rows[index].label.match(/(?:^|\s|:)1\/(\d+)\s*$/u)
    const divisor=match?Number(match[1]):0
    if(divisor>1&&divisor<=10000)add('divide',[rows[index-1]],rows[index],values=>values[0]/divisor,divisor)
  }
  return {checks,limitations}
}

const months=['januar','februar','märz','april','mai','juni','juli','august','september','oktober','november','dezember']
function dateMentions(text){
  const pattern=/\b(\d{1,2})\.\s*(?:(\d{1,2})\.|(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember))\s*(\d{4})\b/giu
  const dates=[]
  const seen=new Set()
  for(const match of text.matchAll(pattern)){
    const month=match[2]?Number(match[2]):months.indexOf(match[3].toLowerCase())+1
    const date=`${match[4]}-${String(month).padStart(2,'0')}-${match[1].padStart(2,'0')}`
    const parsed=new Date(`${date}T12:00:00Z`)
    if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||seen.has(date))continue
    seen.add(date)
    const start=text.lastIndexOf('\n',match.index)+1
    const next=text.indexOf('\n',match.index+match[0].length)
    dates.push({date,quote:text.slice(start,next<0?text.length:next).trim(),line_start:text.slice(0,start).split('\n').length})
  }
  return dates
}

function openStatements(text){
  const flat=normalize(text)
  const sentences=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('de',{granularity:'sentence'}).segment(flat)].map(entry=>entry.segment.trim()):text.split(/\r?\n/u)
  const pattern=/(?:liegt|liegen|ist|sind|wurde|wurden)[^.!?]{0,260}\b(?:nicht|keine?)\b[^.!?]{0,100}\b(?:vor|beigefügt|dokumentiert|erstellt|enthalten)\b|\b(?:fehlt|fehlen|fehlend\w*|ungeklärt|unbekannt)\b/iu
  const unresolved=sentence=>sentence
    .replace(/\b(?:fehlt|fehlen)\s+(?:kein\w*|nichts)\b/giu,'')
    .replace(/\b(?:fehlt|fehlen)\s+nicht(?:\s+mehr)?\b/giu,'')
    .replace(/\b(?:nicht|keineswegs)\s+(?:mehr\s+)?(?:fehlend\w*|ungeklärt|unbekannt)\b/giu,'')
  // Remove only explicit negations before matching. Preserve a real gap in a
  // different clause, and always return the unmodified source sentence.
  return [...new Set(sentences.filter(sentence=>pattern.test(unresolved(sentence))))].map(quote=>({quote}))
}

export function freeAnalysisInput(item,documents){
  const scoped=item?.id&&item?.owner_id?documents.filter(doc=>doc.case_id===item.id&&doc.owner_id===item.owner_id):[]
  return {case_id:item?.id||'',owner_id:item?.owner_id||'',title:String(item?.title||''),goal:String(item?.goal||''),documents:scoped.map(doc=>({id:doc.id,title:String(doc.title||''),updated_at:doc.updated_at||'',text:String(doc.extracted_text||'')})).sort((a,b)=>String(a.id).localeCompare(String(b.id)))}
}

export function analyzeFreeCase(input){
  const documents=input.documents.slice(0,MAX_DOCUMENTS).map(doc=>{
    const truncated=doc.text.length>MAX_TEXT
    // Never perform arithmetic on a cut-off table.
    const text=truncated?doc.text.slice(0,MAX_TEXT).replace(/\n[^\n]*$/u,''):doc.text
    const tables=truncated?[]:readMoneyTables(text)
    const reviews=tables.map(tableChecks)
    return {...doc,text:undefined,has_text:normalize(text).length>0,truncated,
      tables,checks:reviews.flatMap(review=>review.checks),limitations:reviews.flatMap(review=>review.limitations),open:openStatements(text),dates:dateMentions(text)}
  })
  return {version:FREE_ANALYSIS_VERSION,case_id:input.case_id,title:input.title,goal:input.goal,
    documents,omitted_documents:Math.max(0,input.documents.length-MAX_DOCUMENTS),
    summary:{documents:input.documents.length,read:documents.filter(doc=>doc.has_text).length,
      checks:documents.reduce((sum,doc)=>sum+doc.checks.length,0),differences:documents.reduce((sum,doc)=>sum+doc.checks.filter(check=>!check.matches).length,0),
      open:documents.reduce((sum,doc)=>sum+doc.open.length,0)},
    legal_status:'unreviewed',provider_calls:0}
}
