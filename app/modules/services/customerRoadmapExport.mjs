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
    for(const [key,value] of [['owner',step.owner],['reason',step.reason],['action',step.action],['waitFor',step.waiting_for],['afterReply',step.after_response],['doneWhen',step.done_when],['followUp',step.follow_up],['deadline',step.deadline?.date]]) if(value) add(`${ui[key]}: ${value}`)
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

function wrap(context,text,width) {
  const lines=[]
  for(const paragraph of String(text).split('\n')) {
    if(!paragraph){lines.push('');continue}
    let line=''
    for(const word of paragraph.split(/\s+/u)) {
      if(context.measureText(word).width>width) {
        if(line){lines.push(line);line=''}
        for(const char of Array.from(word)) {if(context.measureText(line+char).width>width){lines.push(line);line=''}line+=char}
      } else {
        if(line&&context.measureText(line+' '+word).width>width){lines.push(line);line=''}
        line+=(line?' ':'')+word
      }
    }
    if(line)lines.push(line)
  }
  return lines
}

export async function createRoadmapPdf(record,options={}) {
  if(typeof document==='undefined') throw new Error('PDF export requires a browser.')
  const {jsPDF}=await import('jspdf')
  const rtl=['ar','fa'].includes(options.letterId?record.reference_language:record.output_language)
  const width=1240,height=1754,margin=100,maxY=height-115,contentWidth=width-margin*2,pages=[]
  let canvas,context,y
  function page() {
    canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;context=canvas.getContext('2d')
    context.fillStyle='white';context.fillRect(0,0,width,height)
    context.font='bold 20px Arial, sans-serif';context.fillStyle='#596375';context.textAlign=rtl?'right':'left';context.direction=rtl?'rtl':'ltr'
    y=75
    const header=wrap(context,record.style.letterhead||record.style.sender_name||'ASH Workspace Gold',contentWidth)
    for(const line of header) {context.fillText(line,rtl?width-margin:margin,y);y+=25}
    context.strokeStyle='#d8dfe6';context.beginPath();context.moveTo(margin,y+8);context.lineTo(width-margin,y+8);context.stroke();y+=60
    pages.push({canvas,context})
  }
  page()
  for(const block of roadmapExportBlocks(record,options)) {
    const heading=['title','heading','step'].includes(block.kind)
    const size=block.kind==='title'?35:block.kind==='meta'?20:25
    const lineHeight=size*1.43
    const font=`${heading?'bold ':''}${size}px Arial, sans-serif`
    if(heading)y+=12
    context.font=font
    const inset=block.light?24:block.kind==='bullet'?18:0
    const lines=wrap(context,(block.kind==='bullet'?'• ':'')+block.text,contentWidth-inset)
    if(heading&&y+lineHeight*Math.min(lines.length+2,5)>maxY)page()
    for(let index=0;index<lines.length;index++) {
      if(y+lineHeight>maxY)page()
      context.font=font;context.fillStyle=block.kind==='meta'?'#596375':'#202B3B';context.textAlign=rtl?'right':'left';context.direction=rtl?'rtl':'ltr'
      if(block.light&&index===0) {context.fillStyle=ROADMAP_COLORS[block.light];context.beginPath();context.arc(rtl?width-margin-7:margin+7,y-size*.3,6,0,Math.PI*2);context.fill();context.fillStyle='#202B3B'}
      context.fillText(lines[index],rtl?width-margin-inset:margin+inset,y);y+=lineHeight
    }
    y+=block.kind==='meta'?13:20
  }
  const pdf=new jsPDF({unit:'pt',format:'a4',compress:true})
  pages.forEach((entry,index)=>{
    const ctx=entry.context;ctx.font='18px Arial';ctx.fillStyle='#64748b';ctx.textAlign='left';ctx.direction='ltr';ctx.fillText('ASH Workspace Gold',margin,height-55)
    ctx.textAlign='right';ctx.fillText(`${index+1} / ${pages.length}`,width-margin,height-55)
    if(index)pdf.addPage()
    pdf.addImage(entry.canvas.toDataURL('image/jpeg',.95),'JPEG',0,0,595.28,841.89,undefined,'FAST')
  })
  return pdf.output('blob')
}

export async function createRoadmapExport(record,type,options={}) {
  const blob=type==='docx'?await createRoadmapDocx(record,options):await createRoadmapPdf(record,options)
  return {blob,filename:`ASH_${options.letterId?'Anschreiben_'+options.letterId:'Kundenfahrplan'}_${record.created_at.slice(0,10)}.${type}`}
}
