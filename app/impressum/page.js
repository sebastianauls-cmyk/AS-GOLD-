import { LegalDocument, LegalSection } from '../components/LegalDocument'

export const metadata={title:'Impressum | AS Gold',description:'Anbieterkennzeichnung von AS Gold.'}

export default function Imprint(){
  return <LegalDocument pageId="impressum" title="Impressum" intro="Anbieterkennzeichnung für AS Gold gemäß § 5 Digitale-Dienste-Gesetz (DDG).">
    <LegalSection title="Diensteanbieter">
      <address><b>Sebastian Auls – Unternehmens- und Konzeptberatung</b><br/>Chrysanderstraße 75<br/>21029 Hamburg<br/>Deutschland</address>
    </LegalSection>
    <LegalSection title="Kontakt"><p>E-Mail: <a href="mailto:sebastian.auls@gmail.com">sebastian.auls@gmail.com</a></p><p>Für datenschutzbezogene Anliegen kann dieselbe E-Mail-Adresse mit dem Betreff „Datenschutz – AS Gold“ verwendet werden.</p></LegalSection>
    <LegalSection title="Inhaltlich verantwortlich"><p>Sebastian Auls, Anschrift wie oben.</p></LegalSection>
    <LegalSection title="Verbraucherstreitbeilegung"><p>Der Anbieter ist weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p><p>Die frühere EU-Plattform zur Online-Streitbeilegung wurde zum 20. Juli 2025 eingestellt; deshalb wird kein veralteter OS-Link angegeben.</p></LegalSection>
    <LegalSection title="Hinweis zum aktuellen Angebot"><p>AS Gold befindet sich in einem kostenlosen, kontrollierten Testbetrieb. Die auf der Produktseite dargestellten Preise sind eine transparente Produktvorschau; die Bezahlfunktion ist deaktiviert und durch Registrierung wird kein kostenpflichtiges Abonnement abgeschlossen.</p></LegalSection>
  </LegalDocument>
}
