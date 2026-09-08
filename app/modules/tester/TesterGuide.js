import { LegalDocument, LegalNotice, LegalSection } from '../compliance/LegalDocument'
import { APP_RELEASE, APP_VERSION } from '../release/appRelease.mjs'
import { TesterShareButton } from './TesterShareButton'
import { GuestTestStartButton } from './GuestTestStartButton'
import { SyntheticTesterPanel } from '../testing/SyntheticTesterPanel'

const pilotTasks=[
  {level:'🟢 Klein',goal:'Ein einfacher Vorgang ohne Hilfe',steps:['Testzugang starten','einen einfachen synthetischen Fall öffnen','einen Status bzw. die Ampel verstehen','den vorgeschlagenen nächsten Schritt finden','zur Übersicht zurückkehren'],success:'Bestanden, wenn der Tester ohne Erklärung bis zum nächsten Schritt kommt.'},
  {level:'🟡 Mittel',goal:'Dokument, Sprache und Frist zusammen bearbeiten',steps:['einen mittleren Testfall öffnen','ein synthetisches Dokument hochladen oder den Musterfall verwenden','UI- und Ausgabesprache getrennt prüfen','Frist und Ampel finden','Dokumentauswertung und nächsten Schritt nachvollziehen'],success:'Bestanden, wenn Dokument, Sprache, Frist und Handlung ohne Sackgasse verständlich bleiben.'},
  {level:'🔴 Komplex',goal:'Kompletter Ablauf bis Freigabe und Übergabe',steps:['einen komplexen länderübergreifenden Testfall öffnen','Rechtsraumvergleich prüfen','Nachweislücken und Risiken nachvollziehen','zweisprachiges Schreiben bzw. Ergebnis prüfen','Vorschau öffnen und ausdrücklich freigeben','Export bzw. Übergabe als letzten Schritt erkennen'],success:'Bestanden, wenn der Tester den gesamten Ablauf ohne fachfremde Hilfe abschließen und den Freigabestatus eindeutig erkennen kann.'}
]

export function TesterGuide(){
  return <LegalDocument pageId="testen" localizable showRelease eyebrow="Testerbetrieb · v131 Pilot & Abnahme" title="AS Workspace Gold sicher ausprobieren" intro="Hier prüfen externe Tester den vollständigen modularen Ablauf mit sicheren Testdaten. Ziel ist jetzt die kontrollierte Abnahme von Verständlichkeit, Zuverlässigkeit und Marktreife." updated={APP_RELEASE.updated} localizedExtra={<><GuestTestStartButton/><TesterShareButton/></>} localizedExtraAfterSection={0}>
    <LegalSection title="Direktzugang ohne Passwort"><GuestTestStartButton/></LegalSection>
    <LegalSection title="Tester-Link weiterleiten"><p>Öffnen Sie mit einem Fingertipp das Teilen-Menü Ihres Handys oder senden Sie die vorbereitete Nachricht direkt per WhatsApp.</p><TesterShareButton/></LegalSection>
    <LegalNotice tone="warning"><b>Nur sichere Testdaten verwenden.</b><p>Bitte ausschließlich synthetische oder wirksam anonymisierte Unterlagen hochladen. Die Bezahlfunktion bleibt deaktiviert.</p></LegalNotice>

    <LegalSection title="Pilot-Abnahme: drei feste Teststufen">
      <p>Jeder Tester sollte mindestens einen kleinen, einen mittleren und einen komplexen Ablauf durchführen. Entscheidend ist, ob AS Workspace ohne zusätzliche Erklärung verständlich bleibt.</p>
      <div className="pilotTaskGrid">{pilotTasks.map(task=><article className="pilotTaskCard" key={task.level}><span className="modeBadge">{task.level}</span><h3>{task.goal}</h3><ol>{task.steps.map(step=><li key={step}>{step}</li>)}</ol><p><b>Erfolgskriterium:</b> {task.success}</p></article>)}</div>
    </LegalSection>

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

    <LegalSection title="Rückmeldung nur in drei Klassen">
      <div className="pilotFeedbackGrid"><div className="pilotFeedbackCard pilotRed"><b>🔴 Blockiert Nutzung</b><p>Weiterarbeiten ist nicht möglich, eine Funktion fehlt oder der Nutzer kommt nicht weiter.</p></div><div className="pilotFeedbackCard pilotYellow"><b>🟡 Stört oder ist unklar</b><p>Der Ablauf funktioniert, ist aber missverständlich, umständlich oder auf dem Gerät schlecht bedienbar.</p></div><div className="pilotFeedbackCard pilotGreen"><b>🟢 Funktioniert</b><p>Der Tester versteht den Schritt ohne Hilfe und kann ihn sicher abschließen.</p></div></div>
      <p>Bitte zusätzlich Gerät, Browser, getestete Sprache, Testfall-ID und den betroffenen Schritt angeben.</p>
    </LegalSection>

    <LegalSection title="Geschützter Tester-Vollzugang"><p>Für den schnellen Test genügt der Direktzugang oben. Er benötigt weder E-Mail noch Passwort, läuft nach zwei Stunden ab und erlaubt höchstens zwei Testdokumente. Ein dauerhaftes Konto kann weiterhin regulär registriert werden.</p></LegalSection>
    <LegalSection title="Alle 12 sichtbaren Testfälle"><p>Die folgenden vollständig erfundenen Fälle zeigen Sprache, Heimatland, Zielland, erwartete Ampel und Prüfschritte bereits vor der Anmeldung.</p><SyntheticTesterPanel language="de" showStart={false}/></LegalSection>
    <LegalSection title="Synthetischer Musterfall"><p><a className="secondary btn" href="/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf">Musterdatei herunterladen</a></p><p>Die Musterdatei enthält keine echten personenbezogenen Daten und kann für Upload, Analyse, Ampel und Export verwendet werden.</p></LegalSection>
    <LegalSection title="Abnahmeentscheidung"><p><b>v131 gilt für den Pilot als bestanden, wenn kein reproduzierbarer 🔴 Blocker offen bleibt und wiederkehrende 🟡 Punkte dokumentiert und priorisiert sind.</b></p><p>🟢 Rückmeldungen bestätigen den vorgesehenen Ablauf und werden nicht automatisch zu neuen Entwicklungswünschen.</p></LegalSection>
    <LegalSection title="Testfeedback"><p><a className="primary btn" href={`mailto:sebastian.auls@gmail.com?subject=AS%20Workspace%20Gold%20${APP_VERSION}%20Pilotfeedback&body=Ger%C3%A4t%3A%0ABrowser%3A%0ASprache%3A%0ATestfall%3A%0AEinstufung%20%28Rot%2FGelb%2FGr%C3%BCn%29%3A%0ABetroffener%20Schritt%3A%0ABeschreibung%3A`}>Pilotfeedback zu {APP_VERSION} senden</a></p><p>{APP_VERSION} ist ein kontrollierter Produkttest. Ergebnisse müssen vor einer verbindlichen Verwendung weiterhin geprüft und ausdrücklich freigegeben werden.</p></LegalSection>
  </LegalDocument>
}
