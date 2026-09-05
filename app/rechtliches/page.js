import { LegalDocument, LegalNotice, LegalSection } from '../components/LegalDocument'

export const metadata={title:'Rechtliches',description:'Zentrale rechtliche Informationen zu AS Workspace Gold.'}

const cards=[
  ['/impressum','Impressum','Anbieter, Anschrift, Kontakt und Streitbeilegung.'],
  ['/datenschutz','Datenschutzerklärung','Verarbeitungen, Rechtsgrundlagen, Empfänger, Speicherdauer und Betroffenenrechte.'],
  ['/datenschutzsteuerung','Datenschutz-Steuerung','Kontostatus prüfen und KI-Verarbeitung samt offener Dokumentfreigaben ausschalten.'],
  ['/nutzungsbedingungen','Nutzungsbedingungen','Regeln des kostenlosen, kontrollierten Tests und Abgrenzung zu künftigen Bezahlangeboten.'],
  ['/widerruf','Widerruf','Widerrufsinformation, Muster und zweistufige elektronische Widerrufsfunktion.'],
  ['/cookies','Cookies & Browser-Speicher','Notwendige Sitzungsspeicherung, Spracheinstellungen und lokale Gerätehistorie.'],
  ['/ki-transparenz','KI-Transparenz','Wann Dokumente an die OpenAI API gehen, welche Schutzschalter gelten und was KI-Ergebnisse bedeuten.'],
  ['/kontakt','Kontakt','Direkter Kontakt für allgemeine, rechtliche und datenschutzbezogene Anliegen.']
]

export default function LegalHub(){
  return <LegalDocument pageId="rechtliches" title="Rechtliches" intro="Alle Pflichtinformationen und Kontrollmöglichkeiten für den aktuellen, kostenlosen Testbetrieb von AS Workspace Gold an einem Ort.">
    <LegalNotice tone="warning"><b>Kontrollierter Testbetrieb</b><p>Die Bezahlfunktion ist deaktiviert. Zulässig sind ausschließlich synthetische oder wirksam anonymisierte Testdaten. Echte personenbezogene Kundendaten und besonders sensible Daten sind technisch und vertraglich nicht freigegeben.</p></LegalNotice>
    <LegalSection title="Dokumente und Funktionen"><div className="legalCardGrid">{cards.map(([href,title,text])=><a className="legalCard" href={href} key={href}><h2>{title}</h2><p>{text}</p><span>Öffnen →</span></a>)}</div></LegalSection>
    <LegalSection title="Vor einem späteren Bezahlbetrieb"><p>Die Rechtstexte bilden den transparenten Stand des kontrollierten Tests ab. Vor Aktivierung von Zahlungen oder echten personenbezogenen Daten sind insbesondere Anbieterpflichtangaben, Auftragsverarbeitungsverträge, Drittlandtransfers, Löschprozesse und gegebenenfalls eine Datenschutz-Folgenabschätzung operativ zu dokumentieren und freizugeben.</p></LegalSection>
  </LegalDocument>
}
