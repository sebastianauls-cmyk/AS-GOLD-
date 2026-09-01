import { LegalDocument, LegalNotice, LegalSection } from '../compliance/LegalDocument'

export function TesterGuide(){
  return <LegalDocument pageId="testen" eyebrow="Testerbetrieb" title="AS Gold sicher ausprobieren" intro="Hier kann der vollständige AS-Gold-Ablauf mit synthetischen oder wirksam anonymisierten Testdaten geprüft werden, ohne eine Zahlung auszulösen.">
    <LegalNotice tone="warning"><b>Nur sichere Testdaten verwenden.</b><p>Bitte ausschließlich synthetische oder wirksam anonymisierte Unterlagen verwenden. Die Bezahlfunktion bleibt im Testerbetrieb deaktiviert.</p></LegalNotice>
    <LegalSection title="Diese Punkte bitte prüfen">
      <ul>
        <li>Genau ein Sprachmenü und genau ein Zurück-Element im geöffneten Sprachmenü</li>
        <li>Zurück schließt das Sprachmenü zuverlässig, auch auf Mobilgeräten</li>
        <li>Oberflächensprache zuerst und getrennte Ausgabesprache danach</li>
        <li>Erklärvideo mit weiblicher und männlicher Variante</li>
        <li>Klare Navigation ohne offensichtliche Sackgassen</li>
        <li>Fristenwarnung, begründete Ampel, Fall-Timeline und genau ein priorisierter nächster Schritt</li>
        <li>Nachweislücken, dokumentübergreifende Abweichungen und daraus abgeleitete konkrete Aufgaben</li>
        <li>Professionelle Übergabeakte für Anwalt, Versicherung oder Berater</li>
        <li>Darstellung und Bedienung in allen 10 App-Sprachen</li>
      </ul>
    </LegalSection>
    <LegalSection title="Test starten">
      <p><a className="primary btn" href="/">App-Test öffnen</a></p>
      <p><a className="secondary btn" href="/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf">Synthetischen Musterfall herunterladen</a></p>
      <p>Die Musterdatei enthält keine echten personenbezogenen Daten und kann für Upload, Analyse, Ampel und Export verwendet werden.</p>
    </LegalSection>
    <LegalSection title="Testfeedback">
      <p><a className="secondary btn" href="mailto:sebastian.auls@gmail.com?subject=AS%20Gold%20Testfeedback">Feedback senden</a></p>
      <p>Der Testerbetrieb ist für Funktions- und Bedienungsprüfungen vorgesehen. Ergebnisse müssen vor einer verbindlichen Verwendung weiterhin geprüft und ausdrücklich freigegeben werden.</p>
    </LegalSection>
  </LegalDocument>
}
