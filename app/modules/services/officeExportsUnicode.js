import JSZip from 'jszip'
import { createPptxBlob as createBasePptxBlob, createXlsxBlob as createBaseXlsxBlob } from './officeExports.js'

export const OFFICE_EXPORT_RENDER_VERSION='v131-traffic-rich-runs'

const TRAFFIC_SENTINELS={
  '🟢':'__AS_TRAFFIC_GREEN__',
  '🟡':'__AS_TRAFFIC_YELLOW__',
  '🔴':'__AS_TRAFFIC_RED__',
  '⚪':'__AS_TRAFFIC_NEUTRAL__'
}
const SENTINEL_COLORS={
  '__AS_TRAFFIC_GREEN__':'2F855A',
  '__AS_TRAFFIC_YELLOW__':'D69E2E',
  '__AS_TRAFFIC_RED__':'C53030',
  '__AS_TRAFFIC_NEUTRAL__':'94A3B8'
}
const SENTINEL_RE=/(__AS_TRAFFIC_GREEN__|__AS_TRAFFIC_YELLOW__|__AS_TRAFFIC_RED__|__AS_TRAFFIC_NEUTRAL__)/g

function protectTrafficMarkers(rows){
  return (Array.isArray(rows)?rows:[]).map(row=>(Array.isArray(row)?row:[row]).map(value=>{
    let text=String(value??'')
    for(const [symbol,sentinel] of Object.entries(TRAFFIC_SENTINELS)) text=text.split(symbol).join(sentinel)
    return text
  }))
}

async function zipBlob(zip,mimeType){
  const bytes=await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}})
  return new Blob([bytes],{type:mimeType})
}

function excelRichRuns(text){
  const parts=String(text).split(SENTINEL_RE)
  return parts.map(part=>{
    const color=SENTINEL_COLORS[part]
    if(color) return '<r><rPr><rFont val="Aptos"/><sz val="11"/><color rgb="FF'+color+'"/></rPr><t xml:space="preserve">● </t></r>'
    if(!part) return ''
    return '<r><rPr><rFont val="Aptos"/><sz val="11"/><color rgb="FF1F2937"/></rPr><t xml:space="preserve">'+part+'</t></r>'
  }).join('')
}

function patchExcelCell(cell){
  if(!Object.keys(SENTINEL_COLORS).some(token=>cell.includes(token))) return cell
  return cell.replace(/<is><t xml:space="preserve">([\s\S]*?)<\/t><\/is>/,(_,text)=>'<is>'+excelRichRuns(text)+'</is>')
}

export async function createXlsxBlob(rows){
  const base=await createBaseXlsxBlob(protectTrafficMarkers(rows))
  const zip=await JSZip.loadAsync(await base.arrayBuffer())
  const file=zip.file('xl/worksheets/sheet1.xml')
  if(!file) throw new Error('Excel traffic renderer: sheet1.xml missing')
  let xml=await file.async('string')
  xml=xml.replace(/<c\b[^>]*t="inlineStr"[^>]*><is><t xml:space="preserve">[\s\S]*?<\/t><\/is><\/c>/g,patchExcelCell)
  zip.file('xl/worksheets/sheet1.xml',xml)
  return zipBlob(zip,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

function colorizeRunProperties(runProperties,color){
  if(/<a:srgbClr val="[0-9A-Fa-f]{6}"\/>/.test(runProperties)){
    return runProperties.replace(/<a:srgbClr val="[0-9A-Fa-f]{6}"\/>/,'<a:srgbClr val="'+color+'"/>')
  }
  return runProperties.replace('</a:rPr>','<a:solidFill><a:srgbClr val="'+color+'"/></a:solidFill></a:rPr>')
}

function patchPowerPointRun(match,runProperties,text){
  if(!Object.keys(SENTINEL_COLORS).some(token=>text.includes(token))) return match
  const parts=String(text).split(SENTINEL_RE)
  return parts.map(part=>{
    const color=SENTINEL_COLORS[part]
    if(color) return '<a:r>'+colorizeRunProperties(runProperties,color)+'<a:t xml:space="preserve">● </a:t></a:r>'
    if(!part) return ''
    return '<a:r>'+runProperties+'<a:t xml:space="preserve">'+part+'</a:t></a:r>'
  }).join('')
}

export async function createPptxBlob(rows){
  const base=await createBasePptxBlob(protectTrafficMarkers(rows))
  const zip=await JSZip.loadAsync(await base.arrayBuffer())
  const slideFiles=Object.keys(zip.files).filter(name=>/^ppt\/slides\/slide\d+\.xml$/.test(name))
  if(!slideFiles.length) throw new Error('PowerPoint traffic renderer: no slides found')
  for(const name of slideFiles){
    const file=zip.file(name)
    let xml=await file.async('string')
    xml=xml.replace(/<a:r>(<a:rPr[\s\S]*?<\/a:rPr>)<a:t xml:space="preserve">([\s\S]*?)<\/a:t><\/a:r>/g,patchPowerPointRun)
    zip.file(name,xml)
  }
  return zipBlob(zip,'application/vnd.openxmlformats-officedocument.presentationml.presentation')
}
