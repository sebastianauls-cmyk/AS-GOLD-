import { LegalDocument, LegalNotice, LegalSection } from '../components/LegalDocument'

export const metadata={title:'AS Gold sicher testen',description:'Kontrollierter AS-Gold-Test mit ausschliesslich synthetischen Daten und einer vorbereiteten Musterdatei.'}

const sample='/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf'

export default function TestingGuide(){
  return <LegalDocument pageId="testen" eyebrow="AS Gold · Testerbetrieb V31" title="AS Gold sicher ausprobieren" intro="Mit diesem Ablauf können Tester die App vollständig erkunden, ohne echte Kundendaten oder sensible Informationen zu verwenden.">
    <LegalNotice tone="success"><b>Der Test kostet nichts.</b><p>Es gibt keine Zahlung, kein Abonnement und keine automatische Verlängerung. Die Bezahlfunktion bleibt deaktiviert.</p></LegalNotice>
    <LegalNotice tone="warning"><b>Nur die vorbereitete Musterdatei oder eigene vollständig erfundene Daten verwenden.</b><p>Keine Namen, Anschriften, Verträge, Gesundheitsdaten, Ausweise, Bankdaten oder Unterlagen realer Personen hochladen. Auch geschwärzte Unterlagen sind nur zulässig, wenn eine Rückführung auf Personen tatsächlich ausgeschlossen ist.</p></LegalNotice>

    <LegalSection title="Ihr sicherer Test in vier Schritten">
      <ol className="testerSteps">
        <li><b>Kostenlos registrieren</b><span>Eine nur hierfür verwendete E-Mail-Adresse und ein einmaliges, starkes Passwort wählen. Beide Hinweise zu Rechtstexten und Testdaten bewusst bestätigen.</span></li>
        <li><b>E-Mail-Adresse bestätigen</b><span>Den Bestätigungslink im Postfach öffnen und danach in AS Gold anmelden.</span></li>
        <li><b>Synthetische Musterdatei laden</b><span>Das vorbereitete PDF enthält ausschliesslich frei erfundene Angaben und ist für Upload, Erkennung, Fristen und Beträge ausgelegt.</span><a className="primary btn testerDownload" href={sample} download>Muster-PDF herunterladen</a></li>
        <li><b>Den vollständigen Ablauf prüfen</b><span>Fall anlegen, PDF als „Synthetische Testdaten“ hochladen, Analyse ausdrücklich starten, Vorschläge kontrollieren und erst danach bewusst speichern oder freigeben.</span></li>
      </ol>
    </LegalSection>

    <LegalSection title="Was Tester sinnvoll prüfen können">
      <div className="testerChecklist">
        {[
          'Registrierung, E-Mail-Bestätigung, Anmeldung, Abmeldung und Passwortanzeige',
          'Darstellung auf Smartphone, Tablet und Computer',
          'Sprachwechsel und getrennte Ausgabesprache',
          'Kunden- und Fallanlage mit ausschliesslich erfundenen Angaben',
          'Dokumentupload, Datenklassifizierung und zusätzliche KI-Bestätigung',
          'Erkannte Referenz, Frist, Betrag, Zusammenfassung und offene Punkte',
          'Manuelle Korrektur vor Speicherung und revisionsgebundene Freigabe',
          'Export nach PDF, Word, Excel, PowerPoint, CSV und Text',
          'Datenauskunft, Audit-Anzeige, KI-Ausschaltung und Löschanfrage',
        ].map(item=><div key={item}><span aria-hidden="true">✓</span><p>{item}</p></div>)}
      </div>
    </LegalSection>

    <LegalSection title="Rückmeldung geben">
      <p>Bitte nur die betroffene Seite, den ausgeführten Schritt, das verwendete Gerät und die sichtbare Fehlermeldung beschreiben. Keine hochgeladenen Inhalte oder Zugangsdaten mitsenden.</p>
      <div className="testerActions"><a className="primary btn" href="/?start=register">Kostenlos testen</a><a className="secondary btn" href="mailto:sebastian.auls@gmail.com?subject=AS%20Gold%20V30%20Testfeedback">Testfeedback per E-Mail</a></div>
    </LegalSection>

    <LegalSection title="Klare Freigabegrenze"><p>V30 ist ein kontrollierter Produkttest. Echte personenbezogene Kundendaten, besonders sensible Daten, Zahlungsvorgänge und eine Nutzung als Ersatz für individuelle Rechts- oder Steuerberatung sind nicht freigegeben.</p></LegalSection>
  </LegalDocument>
}
