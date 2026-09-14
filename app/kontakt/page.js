import { LegalDocument, LegalNotice, LegalSection } from '../components/LegalDocument'

export const metadata={title:'Kontakt',description:'Kontakt zu ASH Workspace Gold und Sebastian Auls.'}

export default function Contact(){
  return <LegalDocument pageId="kontakt" title="Kontakt" intro="Direkter Kontakt ohne zusätzliches Webformular und ohne weitere Tracking-Dienste.">
    <LegalSection title="Sebastian Auls – Unternehmens- und Konzeptberatung"><address>Chrysanderstraße 75<br/>21029 Hamburg<br/>Deutschland</address><p>E-Mail: <a href="mailto:sebastian.auls@gmail.com">sebastian.auls@gmail.com</a></p></LegalSection>
    <LegalNotice><b>Passender Betreff</b><p>Allgemein: „ASH Workspace Gold“ · Promo-Code: „Promo-Code – ASH Workspace Gold“ · Datenschutz: „Datenschutz – ASH Workspace Gold“ · Widerruf: Nutzen Sie bevorzugt die öffentliche Funktion <a href="/widerruf">Vertrag widerrufen</a>.</p></LegalNotice>
    <LegalSection title="Keine vertraulichen Kundendaten per E-Mail"><p>Übermitteln Sie keine echten Kundendokumente, besonderen Kategorien personenbezogener Daten, Passwörter, Zugangstoken oder Promo-Codes per allgemeiner Kontakt-E-Mail.</p></LegalSection>
  </LegalDocument>
}
