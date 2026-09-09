import { LegalDocument, LegalNotice, LegalSection } from '../components/LegalDocument'

export const metadata={title:'Kontakt',description:'Kontakt zu AS Workspace Gold und Sebastian Auls.'}

export default function Contact(){
  const testerSubject='Persönlicher Testerzugang – AS Workspace Gold'
  const testerBody='Guten Tag,\n\nich möchte einen persönlichen kostenlosen Testerzugang für AS Workspace Gold anfragen.\n\nName: \nLogin-E-Mail: \n\nIch habe verstanden, dass die Freigabe persönlich erfolgt, der spätere Tester-Code an genau diese Login-E-Mail gebunden ist und der Zugang bis auf Widerruf gilt.\n\nFreundliche Grüße'
  const testerMail=`mailto:sebastian.auls@gmail.com?subject=${encodeURIComponent(testerSubject)}&body=${encodeURIComponent(testerBody)}`

  return <LegalDocument pageId="kontakt" title="Kontakt" intro="Direkter Kontakt ohne zusätzliches Webformular und ohne weitere Tracking-Dienste.">
    <LegalSection title="Sebastian Auls – Unternehmens- und Konzeptberatung"><address>Chrysanderstraße 75<br/>21029 Hamburg<br/>Deutschland</address><p>E-Mail: <a href="mailto:sebastian.auls@gmail.com">sebastian.auls@gmail.com</a></p></LegalSection>

    <LegalSection title="Persönlichen kostenlosen Testerzugang anfragen">
      <p>Für eine Testerfreigabe werden nur <b>Name</b> und die <b>E-Mail-Adresse benötigt, mit der Sie sich später bei AS Workspace Gold anmelden möchten</b>. Diese Login-E-Mail wird für die persönliche Code-Bindung verwendet.</p>
      <ol>
        <li>Name und spätere Login-E-Mail per E-Mail senden.</li>
        <li>Persönliche Freigabe durch den Anbieter abwarten.</li>
        <li>Mit genau dieser E-Mail registrieren oder anmelden.</li>
        <li>Den anschließend erhaltenen persönlichen Tester-Code unter „Tester-Code einlösen“ aktivieren.</li>
      </ol>
      <p><a className="primary btn" href={testerMail}>Testerzugang per E-Mail anfragen</a></p>
      <p><a className="secondary btn" href="/testen">Tester-Ablauf ansehen</a> <a className="secondary btn" href="/tester-freischalten">Tester-Code einlösen</a></p>
    </LegalSection>

    <LegalNotice><b>Passender Betreff</b><p>Tester: „{testerSubject}“ · Allgemein: „AS Workspace Gold“ · Datenschutz: „Datenschutz – AS Workspace Gold“ · Widerruf: Nutzen Sie bevorzugt die öffentliche Funktion <a href="/widerruf">Vertrag widerrufen</a>.</p></LegalNotice>
    <LegalSection title="Keine vertraulichen Kundendaten per E-Mail"><p>Übermitteln Sie keine echten Kundendokumente, besonderen Kategorien personenbezogener Daten, Passwörter, Zugangstoken oder Tester-Codes per allgemeiner Kontakt-E-Mail. Für die Testerfreigabe reichen Name und spätere Login-E-Mail.</p></LegalSection>
  </LegalDocument>
}
