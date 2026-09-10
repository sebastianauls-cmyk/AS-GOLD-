'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ProductBrand } from '../brand/ProductBrand'
import { InstallAppButton } from '../public/InstallAppButton'

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
      <h1 id="insider-title">Chef- & Insiderbereich</h1>
      <p className="insiderLead">Diese Fläche ist ausschließlich für Sie, freigeschaltete Tester und bestehende interne Zugänge gedacht. Auf der öffentlichen Nutzerseite ist davon nichts zu sehen.</p>

      <div className="insiderActionGrid">
        <article className="insiderActionCard">
          <span className="insiderActionIcon" aria-hidden="true">🔐</span>
          <h2>Eigene Arbeitsfläche</h2>
          <p>Anmelden und den persönlichen, geschützten Workspace öffnen.</p>
          <Link className="primary insiderPrimaryAction" href="/?start=login">Geschützten Bereich öffnen</Link>
        </article>

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
