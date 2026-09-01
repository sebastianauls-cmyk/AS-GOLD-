import { LegalDocument, LegalNotice, LegalSection } from '../components/LegalDocument'

export const metadata={title:'AS Gold Testzugang vorübergehend geschlossen',description:'Der öffentliche AS-Gold-Testzugang ist während der laufenden Navigationsabnahme vorübergehend geschlossen.'}

export default function TestingGuide(){
  return <LegalDocument pageId="testen" eyebrow="AS Gold · Testzugang pausiert" title="Testerzugang vorübergehend geschlossen" intro="Wir stabilisieren derzeit die Navigation und Benutzerführung. Bis zur erneuten Freigabe ist der öffentliche Testerzugang bewusst pausiert.">
    <LegalNotice tone="warning"><b>Aktuell keine Testerfreigabe.</b><p>Bitte noch keinen Test starten und keine Testdaten hochladen. Der Zugang wird erst wieder freigegeben, wenn die Navigation vollständig geprüft und abgenommen ist.</p></LegalNotice>
    <LegalSection title="Warum ist der Test pausiert?">
      <p>Wir möchten vermeiden, dass Tester einen Zwischenstand mit noch nicht finaler Navigation beurteilen. Erst nach erfolgreicher interner Prüfung wird der kontrollierte Testbetrieb wieder geöffnet.</p>
    </LegalSection>
    <LegalSection title="Was bleibt unverändert?">
      <p>Die interne Entwicklung läuft weiter. Bestehende Produktfunktionen und Daten werden durch diese vorübergehende Testsperre nicht gelöscht.</p>
    </LegalSection>
    <LegalSection title="Nächster Schritt">
      <p>Sobald die Menü- und Zurück-Navigation stabil funktioniert, wird der Testerzugang gezielt wieder freigegeben.</p>
    </LegalSection>
  </LegalDocument>
}
