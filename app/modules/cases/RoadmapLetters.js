import { roadmapUi } from './lib/customerRoadmapCopy.mjs'

export function RoadmapLetters({record,onExport,busy=false,stale=false}){
  const letters=record.result.letters
  if(!letters.length)return null
  const ui=roadmapUi(record.output_language)
  const download=(type,id)=>{if(!busy&&!stale)onExport?.(type,id)}
  return <section className="roadmapLetters" aria-label={ui.letters}>
    <h4>{ui.letters}</h4>
    {letters.map(letter=><article key={letter.id}>
      <p><b>{letter.recipient}</b><br/>{letter.subject}</p>
      {onExport&&<div className="roadmapActions">
        <button type="button" className="secondary" disabled={busy||stale} onClick={()=>download('docx',letter.id)}>Word</button>
        <button type="button" className="secondary" disabled={busy||stale} onClick={()=>download('pdf',letter.id)}>PDF</button>
      </div>}
      <details>
        <summary>{ui.preview}</summary>
        <div lang={record.reference_language} dir={['ar','fa'].includes(record.reference_language)?'rtl':'ltr'} className="roadmapFormalLetter"><p>{letter.recipient}</p><h4>{letter.subject}</h4><p>{letter.body}</p></div>
        {letter.customer_translation&&<details><summary>{ui.translation}</summary><p className="roadmapFormalLetter">{letter.customer_translation}</p></details>}
      </details>
    </article>)}
  </section>
}
