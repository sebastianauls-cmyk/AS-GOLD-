import {freeAnalysisBlocks,freeAnalysisLanguage} from '../cases/lib/freeAnalysisCopy.mjs'
import {createTextPdf,PDF_LIGHT_COLORS} from './textPdf.mjs'

export async function createFreeAnalysisExport(result,type,{language='de',createdAt,fonts}={}){
  const blocks=freeAnalysisBlocks(result,language,createdAt)
  const filename=`ASH_Kostenlose_Analyse_${String(result.title).replace(/[^\p{L}\p{N}_-]+/gu,'_').slice(0,90)||'Fall'}.${type}`
  if(type==='pdf')return {filename,blob:await createTextPdf({blocks,language:freeAnalysisLanguage(language),fonts})}
  if(type==='docx'){
    const {Document,Packer,Paragraph,TextRun}=await import('docx')
    const children=blocks.map(block=>new Paragraph({spacing:{before:block.kind==='heading'?180:0,after:120},children:[
      ...(block.light?[new TextRun({text:'● ',color:PDF_LIGHT_COLORS[block.light].slice(1),font:'Arial'})]:[]),
      new TextRun({text:block.text,bold:['title','heading'].includes(block.kind),size:block.kind==='title'?30:block.kind==='meta'?18:22})
    ]}))
    return {filename,blob:await Packer.toBlob(new Document({creator:'ASH Workspace Gold',title:blocks[0].text,styles:{default:{document:{run:{font:'Arial',size:22}}}},sections:[{children}]}))}
  }
  throw new Error('Unsupported free-analysis export format')
}
