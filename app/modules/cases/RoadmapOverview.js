import {ROADMAP_COLORS} from '../../../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapOverviewCopy,roadmapOverviewDate} from './lib/roadmapOverview.mjs'
import {roadmapUi} from './lib/customerRoadmapCopy.mjs'

export function RoadmapOverview({overview,language='de',onOpenStep,busy=false}) {
  const copy=roadmapOverviewCopy(language),ui=roadmapUi(language)
  const {today,stale,steps,counts,next,deadline,current}=overview
  return <section className="roadmapOverview" aria-label={copy.title}>
    <h4>{copy.title}</h4>
    <p className="roadmapMeta">{copy.asOf} {roadmapOverviewDate(today,language)}</p>
    <dl className="roadmapOverviewCounts">{['red','yellow','green','white'].filter(light=>light!=='white'||counts.white).map(light=><div key={light} data-overview-light={light}>
      <dt><span aria-hidden="true" style={{backgroundColor:ROADMAP_COLORS[light]}}/>{copy[light]}</dt><dd>{counts[light]}</dd>
    </div>)}</dl>
    {stale&&<p className="roadmapStale">{ui.stale}</p>}
    <h5>{copy.next}</h5>
    {next.length?<ol className="roadmapOverviewNext">{next.map(step=><li key={step.id} value={steps.findIndex(entry=>entry.id===step.id)+1}>
      {onOpenStep?<button type="button" className="secondary" disabled={busy} onClick={()=>onOpenStep(step.id)}>{step.title}</button>:<b>{step.title}</b>}
      <p className="roadmapMeta">{ui.owner}: {step.owner}{step.phase==='waiting'?' · '+ui.waiting:''}</p>
    </li>)}</ol>:<p>{current.next}</p>}
    {!stale&&<div className="roadmapOverviewDeadline"><h5>{copy.deadline}</h5><p>{deadline?<><time dateTime={deadline.deadline.date}>{roadmapOverviewDate(deadline.deadline.date,language)}</time>{' · '+deadline.title}</>:copy.noDate}</p></div>}
  </section>
}
