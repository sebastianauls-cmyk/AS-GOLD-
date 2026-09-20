'use client'

import { useRef, useState } from 'react'
import { publicTourAreas } from './publicExperienceCopy.mjs'

export function PublicTourPanel({area,c,onRegister,panelRef}){
  return <section ref={panelRef} className="publicTourPanel" id="public-tour-panel" aria-labelledby={`public-tour-${area.key}`} aria-live="polite">
    <span className="publicPreviewLabel">{c.example}</span>
    <h3>{area.title}</h3>
    <dl>{area.items.map(([title,body])=><div key={title}><dt>{title}</dt><dd>{body}</dd></div>)}</dl>
    <button type="button" className="primary btn" onClick={onRegister}>{c.start}</button>
  </section>
}

export function PublicTourChoices({areas,selected,c,onSelect}){
  return <div className="publicTourChoices" role="group" aria-label={c.features}>{areas.map(item=><button type="button" id={`public-tour-${item.key}`} key={item.key} aria-pressed={selected===item.key} aria-controls="public-tour-panel" onClick={()=>onSelect(item.key)}><span aria-hidden="true">{item.icon}</span><b>{item.title}</b></button>)}</div>
}

export function PublicProductTour({pc,c,onRegister,compact=false}){
  const [selected,setSelected]=useState('overview')
  const panelRef=useRef(null)
  const areas=publicTourAreas(pc,c)
  const area=areas.find(item=>item.key===selected)||areas[0]
  function selectArea(key){
    setSelected(key)
    if(window.matchMedia('(max-width: 700px)').matches){
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
      requestAnimationFrame(()=>panelRef.current?.scrollIntoView({block:'start',behavior:reduced?'auto':'smooth'}))
    }
  }
  return <section className="publicFeatureTour section" id="funktionen" aria-labelledby="public-tour-title">
    <div className="wrap">
      <details className="publicTourDetails" open={compact?undefined:true}>
      <summary id="public-tour-title">{c.allFeatures||c.tour}</summary>
      <h2>{c.tour}</h2>
      <p className="lead">{c.tourLead}</p>
      <div className="publicTourLayout">
        <PublicTourChoices areas={areas} selected={selected} c={c} onSelect={selectArea}/>
        <PublicTourPanel area={area} c={c} onRegister={onRegister} panelRef={panelRef}/>
      </div>
      <p className="publicAvailability">{c.availability} <a href="#preise">{c.details} →</a></p>
      </details>
    </div>
  </section>
}
