import { LegalDocument, LegalNotice, LegalSection } from '../compliance/LegalDocument'
import { TesterShareButton } from './TesterShareButton'

export function TesterGuide(){
  return <LegalDocument pageId="testen" eyebrow="Testerbetrieb V72" title="AS Gold V72 sicher ausprobieren" intro="Hier können Sie den vollständigen modularen Ablauf prüfen, den Link weiterleiten und ohne echte Kundendaten oder eine Zahlung testen." updated="2. September 2026" localizedExtra={<TesterShareButton/>} localizedExtraAfterSection={0}>
    <LegalSection title="Tester-Link weiterleiten">
      <p>Öffnen Sie mit einem Fingertipp das Teilen-Menü Ihres Handys oder senden Sie die vorbereitete Nachricht direkt per WhatsApp.</p>
      <TesterShareButton/>
    </LegalSection>
    <LegalNotice tone="warning"><b>Nur sichere Testdaten verwenden.</b><p>Bitte ausschließlich synthetische oder wirksam anonymisierte Unterlagen hochladen. Die Bezahlfunktion bleibt deaktiviert.</p></LegalNotice>
    <LegalSection title="Diese Punkte bitte prüfen"><ul>
      <li>Genau ein Sprachmenü und genau ein Zurück-Element im geöffneten Sprachmenü</li>
      <li>Zurück schließt das Sprachmenü zuverlässig, auch auf Mobilgeräten</li>
      <li>Oberflächensprache zuerst und getrennte Ausgabesprache danach</li>
      <li>Erklärvideo mit weiblicher und männlicher Variante</li>
      <li>Klare Navigation ohne offensichtliche Sackgassen</li>
      <li>Fristenwarnung, begründete Ampel, Fall-Timeline und genau ein priorisierter nächster Schritt</li>
      <li>Nachweislücken, dokumentübergreifende Abweichungen und daraus abgeleitete konkrete Aufgaben</li>
      <li>Professionelle Übergabeakte für Anwalt, Versicherung oder Berater</li>
      <li>Darstellung und Bedienung in allen 11 App-Sprachen einschließlich Vietnamesisch</li>
    </ul></LegalSection>
    <LegalSection title="Synthetischer Musterfall"><p><a className="secondary btn" href="/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf">Musterdatei herunterladen</a></p><p>Die Musterdatei enthält keine echten personenbezogenen Daten und kann für Upload, Analyse, Ampel und Export verwendet werden.</p></LegalSection>
    <LegalSection title="Testfeedback"><p><a className="primary btn" href="mailto:sebastian.auls@gmail.com?subject=AS%20Gold%20V72%20Testfeedback">Feedback zu V72 senden</a></p><p>V72 ist ein kontrollierter Produkttest. Ergebnisse müssen vor einer verbindlichen Verwendung weiterhin geprüft und ausdrücklich freigegeben werden.</p></LegalSection>
  </LegalDocument>
}