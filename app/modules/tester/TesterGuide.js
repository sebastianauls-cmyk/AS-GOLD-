import { LegalDocument, LegalNotice, LegalSection } from '../compliance/LegalDocument'
import { APP_RELEASE, APP_VERSION } from '../release/appRelease.mjs'
import { TesterShareButton } from './TesterShareButton'
import { GuestTestStartButton } from './GuestTestStartButton'
import { SyntheticTesterPanel } from '../testing/SyntheticTesterPanel'

export function TesterGuide(){
  return <LegalDocument pageId="testen" localizable showRelease eyebrow="Testerbetrieb" title="AS Workspace Gold sicher ausprobieren" intro="Hier können Sie den vollständigen modularen Ablauf prüfen, den Link weiterleiten und ohne echte Kundendaten oder eine Zahlung testen." updated={APP_RELEASE.updated} localizedExtra={<><GuestTestStartButton/><TesterShareButton/></>} localizedExtraAfterSection={0}>
    <LegalSection title="Direktzugang ohne Passwort">
      <GuestTestStartButton/>
    </LegalSection>
    <LegalSection title="Tester-Link weiterleiten">
      <p>Öffnen Sie mit einem Fingertipp das Teilen-Menü Ihres Handys oder senden Sie die vorbereitete Nachricht direkt per WhatsApp.</p>
      <TesterShareButton/>
    </LegalSection>
    <LegalNotice tone="warning"><b>Nur sichere Testdaten verwenden.</b><p>Bitte ausschließlich synthetische oder wirksam anonymisierte Unterlagen hochladen. Die Bezahlfunktion bleibt deaktiviert.</p></LegalNotice>
    <LegalSection title="Geschützter Tester-Vollzugang"><p>Für den schnellen Test genügt der Direktzugang oben. Er benötigt weder E-Mail noch Passwort, läuft nach zwei Stunden ab und erlaubt höchstens zwei Testdokumente. Ein dauerhaftes Konto kann weiterhin regulär registriert werden.</p></LegalSection>
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
    <LegalSection title="Alle 12 sichtbaren Testfälle"><p>Die folgenden vollständig erfundenen Fälle zeigen Sprache, Heimatland, Zielland, erwartete Ampel und Prüfschritte bereits vor der Anmeldung.</p><SyntheticTesterPanel language="de" showStart={false}/></LegalSection>
    <LegalSection title="Synthetischer Musterfall"><p><a className="secondary btn" href="/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf">Musterdatei herunterladen</a></p><p>Die Musterdatei enthält keine echten personenbezogenen Daten und kann für Upload, Analyse, Ampel und Export verwendet werden.</p></LegalSection>
    <LegalSection title="Testfeedback"><p><a className="primary btn" href={`mailto:sebastian.auls@gmail.com?subject=AS%20Workspace%20Gold%20${APP_VERSION}%20Testfeedback`}>Feedback zu {APP_VERSION} senden</a></p><p>{APP_VERSION} ist ein kontrollierter Produkttest. Ergebnisse müssen vor einer verbindlichen Verwendung weiterhin geprüft und ausdrücklich freigegeben werden.</p></LegalSection>
  </LegalDocument>
}
