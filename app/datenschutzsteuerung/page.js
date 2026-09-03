import { LegalDocument, LegalNotice, LegalSection } from '../components/LegalDocument'
import PrivacyDashboard from '../modules/compliance/PrivacyDashboard'

export const metadata={title:'Datenschutz-Steuerung | AS Workspace Gold',description:'Persönliche Datenschutz- und KI-Freigaben in AS Workspace Gold prüfen und ändern.'}

export default function PrivacyControls(){
  return <LegalDocument pageId="datenschutzsteuerung" title="Datenschutz-Steuerung" intro="Prüfen Sie den aktuellen Kontostatus und schalten Sie KI-Verarbeitung sowie noch offene Dokumentfreigaben aus." localizedExtra={<PrivacyDashboard/>}>
    <LegalNotice><b>Ihre Entscheidung bleibt freiwillig</b><p>Ohne KI-Freigabe können Dokumentfelder weiterhin manuell bearbeitet werden. Eine KI-Übermittlung startet nur nach einer neuen ausdrücklichen Bestätigung am einzelnen Dokument.</p></LegalNotice>
    <LegalSection title="Persönlicher Status"><PrivacyDashboard/></LegalSection>
  </LegalDocument>
}
