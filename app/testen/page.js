import { LegalDocument, LegalNotice, LegalSection } from '../components/LegalDocument'

export const metadata={title:'AS Gold sicher testen',description:'Kontrollierter AS-Gold-V45-Test mit ausschliesslich synthetischen Daten und einer vorbereiteten Musterdatei.'}

const sample='/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf'

export default function TestingGuide(){
  return <LegalDocument pageId="testen" eyebrow="AS Gold · Testerbetrieb V45" title="AS Gold V45 sicher ausprobieren" intro="Mit diesem Ablauf können Tester den aktuellen V45-Stand vollständig erkunden, ohne echte Kundendaten oder sensible Informationen zu verwenden.">
    <LegalNotice tone="success"><b>Der Test kostet nichts.</b><p>Es gibt keine Zahlung, kein Abonnement und keine automatische Verlängerung. Die Bezahlfunktion bleibt deaktiviert.</p></LegalNotice>
    <LegalNotice tone="warning"><b>Nur die vorbereitete Musterdatei oder eigene vollständig erfundene Daten verwenden.</b><p>Keine Namen, Anschriften, Verträge, Gesundheitsdaten, Ausweise, Bankdaten oder Unterlagen realer Personen hochladen. Auch geschwärzte Unterlagen sind nur zulässig, wenn eine Rückführung auf Personen tatsächlich ausgeschlossen ist.</p></LegalNotice>

    <LegalSection title="Ihr sicherer V45-Test in vier Schritten">
      <ol className="testerSteps">
        <li><b>Kostenlos registrieren</b><span>Eine nur hierfür verwendete E-Mail-Adresse und ein einmaliges, starkes Passwort wählen. Beide Hinweise zu Rechtstexten und Testdaten bewusst bestätigen.</span></li>
        <li><b>E-Mail-Adresse bestätigen</b><span>Den Bestätigungslink im Postfach öffnen und danach in AS Gold anmelden.</span></li>
        <li><b>Synthetische Musterdatei laden</b><span>Das vorbereitete PDF enthält ausschliesslich frei erfundene Angaben und ist für Upload, Erkennung, Fristen und Beträge ausgelegt.</span><a className="primary btn testerDownload" href={sample} download>Muster-PDF herunterladen</a></li>
        <li><b>Den vollständigen V45-Ablauf prüfen</b><span>Oberflächensprache wählen, danach Ausgabesprache wählen, Fall anlegen, PDF als „Synthetische Testdaten“ hochladen, Analyse ausdrücklich starten, Fristenwarnung, Ampel, Timeline und nächsten Schritt prüfen und erst danach bewusst speichern, freigeben oder exportieren.</span></li>
      </ol>
    </LegalSection>

    <LegalSection title="Was Tester sinnvoll prüfen können">
      <div className="testerChecklist">
        {[
          'Registrierung, E-Mail-Bestätigung, Anmeldung, Abmeldung und Passwortanzeige',
          'Darstellung auf Smartphone, Tablet und Computer',
          'Oberflächensprache zuerst und getrennte Ausgabesprache danach – in allen 10 App-Sprachen',
          'Erklärvideo und klare Zurück-Navigation ohne Sackgasse',
          'Kunden- und Fallanlage mit ausschliesslich erfundenen Angaben',
          'Dokumentupload, Datenklassifizierung und zusätzliche KI-Bestätigung',
          'Erkannte Referenz, Frist, Betrag, Zusammenfassung und offene Punkte',
          'Fristenwarnung, begründete Ampel, Fall-Timeline und genau ein priorisierter nächster Schritt',
          'Nachweislücken, dokumentübergreifende Abweichungen und daraus abgeleitete konkrete Aufgaben',
          'Professionelle Übergabeakte für Anwalt, Versicherung oder Berater',
          'Manuelle Korrektur vor Speicherung und revisionsgebundene Freigabe',
          'Export nach PDF, Word, Excel, PowerPoint, CSV und Text',
          'Datenauskunft, Audit-Anzeige, KI-Ausschaltung und Löschanfrage',
        ].map(item=><div key={item}><span aria-hidden="true">✓</span><p>{item}</p></div>)}
      </div>
    </LegalSection>

    <LegalSection title="Unser Qualitätsmaßstab">
      <p>AS Gold soll nicht nur Fragen beantworten. Der Test soll zeigen, ob aus Dokumenten ein verständlicher, nachvollziehbarer Fall entsteht: mit Quellen, Lücken, Fristen, Ampel, Timeline, nächsten Aufgaben und einer sauberen Übergabe. Jede Sackgasse, unklare Auswahl oder nicht nachvollziehbare Empfehlung gilt als Abnahmefehler.</p>
    </LegalSection>

    <LegalSection title="Rückmeldung geben">
      <p>Bitte nur die betroffene Seite, den ausgeführten Schritt, das verwendete Gerät und die sichtbare Fehlermeldung beschreiben. Keine hochgeladenen Inhalte oder Zugangsdaten mitsenden.</p>
      <div className="testerActions"><a className="primary btn" href="/?start=register">Kostenlos testen</a><a className="secondary btn" href="mailto:sebastian.auls@gmail.com?subject=AS%20Gold%20V45%20Testfeedback">V45-Testfeedback per E-Mail</a></div>
    </LegalSection>

    <LegalSection title="Klare Freigabegrenze"><p>V45 ist ein kontrollierter Produkttest. Echte personenbezogene Kundendaten, besonders sensible Daten, Zahlungsvorgänge und eine Nutzung als Ersatz für individuelle Rechts- oder Steuerberatung sind nicht freigegeben.</p></LegalSection>
  </LegalDocument>
}
