'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ProductBrand } from '../brand/ProductBrand'
import { InstallAppButton } from '../public/InstallAppButton'
import { TeamAccountEntry } from '../team-account/TeamAccountEntry'

const publicInstallPath='/installieren?neu=1'

export function InsiderLanding(){
  const [copyStatus,setCopyStatus]=useState('')

  async function copyPublicLink(){
    const link=new URL(publicInstallPath,window.location.origin).toString()
    try{
      await navigator.clipboard.writeText(link)
      setCopyStatus('Nutzerlink wurde kopiert.')
    }catch{
      setCopyStatus(`Bitte diesen Link kopieren: ${link}`)
    }
  }

  return <main className="insiderLanding">
    <section className="insiderShell" aria-labelledby="insider-title">
      <ProductBrand showDescriptor language="de" className="insiderBrand"/>
      <span className="insiderLabel">GETRENNTER INTERNER ZUGANG</span>
      <h1 id="insider-title">Gemeinsamer interner Arbeitsbereich</h1>
      <p className="insiderLead">Passwort 1 gibt allen autorisierten internen Personen Vollzugriff auf das gesamte AS Workspace: öffentliche und interne Bereiche, Inhalte, Funktionen, Module, Einstellungen und Programmierungsänderungen. Alle dürfen Änderungen vorbereiten. Passwort 2 bleibt ausschließlich bei Ihnen und gibt einen fertigen Entwurf als neue Live-Version frei. Öffentlich sichtbar ist nur der Zugangsbutton neben dem Impressum; Inhalte und Funktionen bleiben bis zur Prüfung von Passwort 1 geschützt.</p>

      <section className="insiderSetupCallout" aria-labelledby="insider-setup-title">
        <span className="insiderActionIcon" aria-hidden="true">🔑</span>
        <div><strong>ERSTER SCHRITT</strong><h2 id="insider-setup-title">Passwort 1 und Passwort 2 festlegen</h2><p>Die private Ersteinrichtung ist nur nach Ihrer persönlichen Anmeldung möglich.</p></div>
        <Link className="primary insiderSetupAction" href="/insider/einrichten">Passwörter jetzt einrichten</Link>
      </section>

      <div className="insiderActionGrid">
        <TeamAccountEntry/>

        <article className="insiderActionCard">
          <span className="insiderActionIcon" aria-hidden="true">🔗</span>
          <h2>Link für neue Nutzer</h2>
          <p>Nur dieser öffentliche Installationslink wird an neue Nutzer weitergegeben.</p>
          <button type="button" className="insiderCopyButton" onClick={copyPublicLink}>Nutzerlink kopieren</button>
          {copyStatus&&<p className="insiderCopyStatus" role="status">✓ {copyStatus}</p>}
        </article>
      </div>

      <section className="insiderUserPreview" aria-labelledby="insider-preview-title">
        <span className="insiderPreviewLabel">CHEF-VORSCHAU</span>
        <h2 id="insider-preview-title">So sieht ein neuer Nutzer den Installationsbereich</h2>
        <p>Diese Vorschau bleibt für Sie sichtbar, auch wenn AS Workspace auf Ihrem eigenen Handy bereits installiert ist.</p>
        <InstallAppButton language="de" surface="preview" previewOnly/>
      </section>

      <div className="insiderFooterActions">
        <Link href="/" className="insiderPublicLink">Zur öffentlichen Startseite</Link>
      </div>
    </section>
  </main>
}
