import Link from 'next/link'
import { LegalFooter } from '../modules/compliance/LegalFooter'
import { ProductBrand } from '../modules/brand/ProductBrand'
import { InstallAppButton } from '../modules/public/InstallAppButton'

export const metadata={
  title:'AS Workspace installieren',
  description:'AS Workspace Gold direkt auf diesem Gerät installieren und vom Startbildschirm öffnen.'
}

export default function InstallierenPage(){
  return <>
    <main className="installLanding">
      <section className="installLandingCard" aria-labelledby="install-landing-title">
        <ProductBrand showDescriptor language="de" className="installLandingBrand"/>
        <span className="installLandingLabel">Direkte Installation</span>
        <h1 id="install-landing-title">AS Workspace installieren</h1>
        <p className="installLandingLead">Tippen Sie auf den gelben Button. Danach können Sie AS Workspace direkt vom Startbildschirm öffnen – ohne den Link erneut suchen zu müssen.</p>
        <InstallAppButton language="de" surface="install" forceIntro/>
        <p className="installLandingHelp">Falls Ihr Browser nicht direkt installiert, erscheint automatisch die passende Anleitung für dieses Gerät.</p>
        <Link href="/" className="installLandingContinue">Ohne Installation zur normalen Startseite</Link>
      </section>
    </main>
    <LegalFooter language="de"/>
  </>
}
