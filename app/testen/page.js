import { LegalDocument, LegalNotice, LegalSection } from '../components/LegalDocument'
import { TesterShareButton } from '../components/TesterShareButton'

export const metadata={title:'AS Gold V70 testen und weiterleiten',description:'AS Gold sicher testen und den Tester-Link direkt über WhatsApp, E-Mail oder andere Apps weiterleiten.'}

export default function TestingGuide(){
  return <LegalDocument pageId="testen" eyebrow="Testerbetrieb V70" title="AS Gold V70 sicher ausprobieren" intro="Hier können Sie den vollständigen V70-Ablauf prüfen, den Link weiterleiten und ohne echte Kundendaten oder eine Zahlung testen." updated="1. September 2026" localizedExtra={<TesterShareButton/>} localizedExtraAfterSection={0}>
    <LegalSection title="Tester-Link weiterleiten">
      <p>Öffnen Sie mit einem Fingertipp das Teilen-Menü Ihres Handys oder senden Sie die vorbereitete Nachricht direkt per WhatsApp.</p>
      <TesterShareButton/>
    </LegalSection>
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
      <p><a className="primary btn" href="mailto:sebastian.auls@gmail.com?subject=AS%20Gold%20V70%20Testfeedback">Feedback zu V70 senden</a></p>
      <p>V70 ist ein kontrollierter Produkttest. Ergebnisse müssen vor einer verbindlichen Verwendung weiterhin geprüft und ausdrücklich freigegeben werden.</p>
    </LegalSection>
  </LegalDocument>
}
