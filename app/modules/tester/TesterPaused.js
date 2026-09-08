import { LegalDocument, LegalNotice, LegalSection } from '../compliance/LegalDocument'

export function TesterPaused(){
  return <LegalDocument pageId="testen" eyebrow="AS Workspace Gold · Externer Testzugang pausiert" title="Testerzugang derzeit geschlossen" intro="AS Workspace Gold befindet sich in der internen Abschlussprüfung. Bis zur ausdrücklichen Freigabe läuft die Qualitätssicherung ausschließlich mit synthetischen Testfällen; externe Tester und echte Kundendaten sind bewusst ausgeschlossen.">
    <LegalNotice tone="warning"><b>Aktuell keine externe Testerfreigabe.</b><p>Bitte keinen Test starten und keine Daten hochladen. Die Bezahlfunktion bleibt ebenfalls deaktiviert.</p></LegalNotice>
    <LegalSection title="Was wird intern geprüft?">
      <p>Navigation, Sprachumschaltung, Dokumentanalyse, Ampeln, Fristen, Rechtsraumvergleich, zweisprachige Ausgaben, Vorschau, Freigabe sowie PDF-, Word-, Excel- und PowerPoint-Exporte werden ausschließlich mit synthetischen Testdaten geprüft.</p>
    </LegalSection>
    <LegalSection title="Was bleibt unverändert?">
      <p>Die Produktentwicklung und interne Qualitätsprüfung laufen weiter. Bestehende Funktionen und Datenstrukturen werden durch die Testsperre nicht gelöscht.</p>
    </LegalSection>
    <LegalSection title="Nächster Schritt">
      <p>Ein externer Testerzugang wird erst wieder geöffnet, wenn AS Workspace Gold intern abgeschlossen und dafür ausdrücklich freigegeben wurde.</p>
    </LegalSection>
  </LegalDocument>
}
