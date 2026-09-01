import { LegalDocument, LegalNotice, LegalSection } from '../components/LegalDocument'

export const metadata={title:'AS Gold V49 sicher ausprobieren',description:'Kontrollierter AS-Gold-V49-Testbetrieb mit synthetischen oder anonymisierten Testdaten.'}

export default function TestingGuide(){
  return <LegalDocument pageId="testen" eyebrow="Testerbetrieb V49" title="AS Gold V49 sicher ausprobieren" intro="Hier können Sie den vollständigen V49-Ablauf prüfen, ohne echte Kundendaten oder eine Zahlung zu verwenden.">
    <LegalNotice tone="warning"><b>Nur sichere Testdaten verwenden.</b><p>Bitte ausschließlich synthetische oder wirksam anonymisierte Unterlagen hochladen. Die Bezahlfunktion bleibt deaktiviert.</p></LegalNotice>
    <LegalSection title="Diese Punkte bitte prüfen">
      <ul>
        <li>Oberflächensprache zuerst und getrennte Ausgabesprache danach</li>
        <li>Erklärvideo mit weiblicher und männlicher Variante</li>
        <li>Klare Zurück-Navigation ohne Sackgasse und ohne doppelte Schaltflächen</li>
        <li>Fristenwarnung, begründete Ampel, Fall-Timeline und genau ein priorisierter nächster Schritt</li>
        <li>Nachweislücken, dokumentübergreifende Abweichungen und daraus abgeleitete konkrete Aufgaben</li>
        <li>Professionelle Übergabeakte für Anwalt, Versicherung oder Berater</li>
        <li>Darstellung und Bedienung in allen 10 App-Sprachen</li>
      </ul>
    </LegalSection>
    <LegalSection title="Synthetischer Musterfall">
      <p><a className="secondary btn" href="/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf">Musterdatei herunterladen</a></p>
      <p>Die Musterdatei enthält keine echten personenbezogenen Daten und kann für Upload, Analyse, Ampel und Export verwendet werden.</p>
    </LegalSection>
    <LegalSection title="Testfeedback">
      <p><a className="primary btn" href="mailto:sebastian.auls@gmail.com?subject=AS%20Gold%20V49%20Testfeedback">Feedback zu V49 senden</a></p>
      <p>V49 ist ein kontrollierter Produkttest. Ergebnisse müssen vor einer verbindlichen Verwendung weiterhin geprüft und ausdrücklich freigegeben werden.</p>
    </LegalSection>
  </LegalDocument>
}
