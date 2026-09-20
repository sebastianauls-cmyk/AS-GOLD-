import { createTextPdf } from './textPdf.mjs'

export function handoffExportBlocks(data,copy) {
  const blocks=[{text:data.title,kind:'title'}]
  const add=(text,kind='body',light=null)=>blocks.push({text,kind,light})
  for(const [key,value] of [['goal',data.goal],['summary',data.summary],['deadline',data.deadline],['next',data.nextAction]]) {add(copy[key],'heading');add(value||'—')}
  add(copy.documents,'heading');data.documents.forEach((entry,index)=>add(`${index+1}. ${entry.date||'—'} · ${entry.title}${entry.status?' · '+entry.status:''}`))
  add(copy.assessments,'heading');data.assessments.forEach(entry=>{add(entry.title,'step',entry.trafficLight);add(entry.reasoning);if(entry.nextStep)add(entry.nextStep)})
  if(data.timeline.length){add(copy.timeline,'heading');data.timeline.forEach(entry=>add(`${entry.date} · ${entry.title}${entry.detail?' · '+entry.detail:''}`))}
  add(copy.generated,'meta')
  return blocks
}
export function createHandoffPdf(data,copy,language='de',options={}) {return createTextPdf({blocks:handoffExportBlocks(data,copy),header:`ASH Workspace Gold · ${copy.handoffTitle}`,language,fonts:options.fonts})}
