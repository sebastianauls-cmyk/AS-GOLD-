'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function ErrorPage({error,retry}){
  useEffect(()=>{console.error('Unhandled application error',error)},[error])
  return <main className="center"><section className="card recoveryCard" role="alert">
    <span className="modeBadge">AS Workspace Gold</span>
    <h1>Diese Ansicht konnte nicht geladen werden.</h1>
    <p className="muted">Ihre gespeicherten Daten bleiben erhalten. Versuchen Sie es erneut oder kehren Sie zur Startseite zurück.</p>
    {error?.digest&&<p className="errorReference">Referenz: {error.digest}</p>}
    <div className="actions"><button className="primary" type="button" onClick={()=>retry()}>Erneut versuchen</button><Link className="secondary btn" href="/">Zur Startseite</Link></div>
  </section></main>
}

