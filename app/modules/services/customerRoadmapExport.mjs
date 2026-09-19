import { readableStepText } from '../cases/lib/roadmapDisplay.mjs'
import { createTextPdf } from './textPdf.mjs'
import { roadmapSteps, ROADMAP_COLORS } from '../../../supabase/functions/_shared/customerRoadmap.mjs'
import { roadmapUi } from '../cases/lib/customerRoadmapCopy.mjs'

// One semantic document model drives both Word and PDF. Letters have no status
// points and are exported individually, never concatenated with customer advice.
export function roadmapExportBlocks(record,{letterId}={}) {
  const ui=roadmapUi(record.output_language)
  const letter=letterId?record.result.letters.find(entry=>entry.id===letterId):null
  if(letterId&&!letter) throw new Error('Anschreiben nicht gefunden.')
  const blocks=[]
  const add=(text,kind='body',light=null)=>{if(text)blocks.push({text:String(text),kind,light})}
  if(letter) {
    add(letter.recipient)
    add(letter.subject,'title')
    for(const line of letter.body.split(/\r?\n/)) add(line||' ','body')
    return blocks
  }
  add(record.result.title,'title')
  add(ui.draft,'meta')
  add(record.style.salutation)
  add(record.result.opening)
  for(const point of record.result.key_points) add(point,'bullet')
  for(const [key,value] of [['meaning',record.result.meaning],['next',record.result.next],['action',record.result.customer_action]]) {add(ui[key],'heading');add(value)}
  if(record.result.facts.length) {add(ui.facts,'heading');for(const fact of record.result.facts)add(fact.text,'bullet')}
  if(record.result.open_questions.length) {
    add(ui.questions,'heading')
    for(const question of record.result.open_questions) add(`${question.question}\n${ui.owner}: ${question.who}\n${ui.reason}: ${question.why}`)
  }
  const titles=new Map(record.source_documents.map(doc=>[doc.id,doc.title]))
  roadmapSteps(record).forEach((step,index)=>{
    add(`${index+1}. ${step.title}`,'step',step.light)
    add(`${ui[step.phase]} · ${ui[step.light]}`,'meta')
    for(const [key,value] of [['owner',step.owner],['reason',step.reason],['action',step.action],['waitFor',step.waiting_for],['afterReply',step.after_response],['doneWhen',step.done_when],['followUp',step.follow_up],['deadline',step.deadline?.date]]) if(value) add(`${ui[key]}: ${readableStepText(value,record.result.steps)}`)
    if(step.update?.note) add(`${ui.progress}: ${step.update.note}${step.done?' · '+ui.complete:''}`,'meta')
    if(step.evidence.length) add(`${ui.evidence}: ${step.evidence.map(entry=>`${titles.get(entry.document_id)||entry.document_id}: „${entry.quote}“`).join('\n')}`,'meta')
  })
  add(record.style.closing||record.result.closing)
  add(record.style.sender_name)
  return blocks
}

export async function createRoadmapDocx(record,options={}) {
  const {Document,Packer,Paragraph,TextRun,Header,Footer,PageNumber,AlignmentType}=await import('docx')
  const blocks=roadmapExportBlocks(record,options)
  const rtl=['ar','fa'].includes(options.letterId?record.reference_language:record.output_language)
  const paragraph=block=>new Paragraph({
    bidirectional:rtl,keepNext:['title','heading','step'].includes(block.kind),
    spacing:{before:['heading','step'].includes(block.kind)?200:0,after:block.kind==='meta'?110:150,line:290},
    children:[...(block.light?[new TextRun({text:'● ',font:'Arial',color:ROADMAP_COLORS[block.light].slice(1),size:21})]:[]),
      ...block.text.split('\n').map((line,index)=>new TextRun({text:(block.kind==='bullet'&&index===0?'• ':'')+line,break:index?1:undefined,
        bold:['title','heading','step'].includes(block.kind),size:block.kind==='title'?34:block.kind==='meta'?18:22,color:block.kind==='meta'?'5F6874':'202B3B'}))]
  })
  const header=new Header({children:(record.style.letterhead||record.style.sender_name||'ASH Workspace Gold').split('\n').map(text=>new Paragraph({spacing:{after:50},children:[new TextRun({text,size:18,bold:true,color:'596375'})]}))})
  const footer=new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:'ASH Workspace Gold · ',size:16,color:'64748B'}),new TextRun({children:[PageNumber.CURRENT],size:16})]})]})
  return Packer.toBlob(new Document({creator:'ASH Workspace Gold',title:blocks[0]?.text,styles:{default:{document:{run:{font:'Arial',size:22}}}},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:2300,right:1134,bottom:1200,left:1134,header:500,footer:500}}},headers:{default:header},footers:{default:footer},children:blocks.map(paragraph)}]}))
}

export async function createRoadmapPdf(record,options={}) {
  return createTextPdf({blocks:roadmapExportBlocks(record,options),
    header:record.style.letterhead||record.style.sender_name||'ASH Workspace Gold',
    language:options.letterId?record.reference_language:record.output_language,fonts:options.fonts})
}

export async function createRoadmapExport(record,type,options={}) {
  const blob=type==='docx'?await createRoadmapDocx(record,options):await createRoadmapPdf(record,options)
  return {blob,filename:`ASH_${options.letterId?'Anschreiben_'+options.letterId:'Kundenfahrplan'}_${record.created_at.slice(0,10)}.${type}`}
}
