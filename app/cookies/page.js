import { LegalDocument, LegalNotice, LegalSection } from '../components/LegalDocument'

export const metadata={title:'Cookies & Browser-Speicher | AS Gold',description:'Informationen zu Cookies, Sitzungen und lokalem Speicher bei AS Gold.'}

export default function Cookies(){
  return <LegalDocument title="Cookies & Browser-Speicher" intro="AS Gold setzt derzeit keine Werbe-, Reichweitenmessungs- oder Profiling-Cookies ein.">
    <LegalNotice tone="success"><b>Kein Marketing-Tracking</b><p>Im aktuellen Quellstand sind keine Analyse-, Werbe- oder Social-Media-Tracker eingebunden. Deshalb erscheint kein Einwilligungsbanner für optionale Tracker.</p></LegalNotice>
    <LegalSection title="Technisch notwendiger Sitzungsspeicher"><p>Nach der Anmeldung speichert die Supabase-Clientbibliothek Zugangs- und Aktualisierungstoken im Browser, damit die geschützte Sitzung erhalten und sicher erneuert werden kann. Dieser Speicher ist für die ausdrücklich gewünschte Anmeldung erforderlich. Beim Abmelden werden die Sitzungsinformationen durch die Authentifizierung abgemeldet; Browserspeicher kann zusätzlich über die Browsereinstellungen gelöscht werden.</p></LegalSection>
    <LegalSection title="Sprache und Ausgabesprache"><p>Die Schlüssel <code>asgold-language</code> und <code>asgold-output-language</code> speichern ausschließlich die gewählten Spracheinstellungen auf dem Gerät. Zweck ist, die Auswahl beim nächsten Aufruf wiederherzustellen.</p></LegalSection>
    <LegalSection title="Lokale Gerätehistorie"><p>Für angemeldete Nutzer speichert AS Gold bis zu 50 kurze Aktivitätseinträge unter einem nutzerbezogenen Schlüssel im lokalen Speicher. Sie dienen nur der transparenten Gerätehistorie und können Bezeichnungen selbst angelegter Fälle, Dokumente oder Kunden enthalten. Die Historie bleibt auf diesem Browser und ist kein Ersatz für den serverseitigen Audit-Verlauf. Sie kann durch Löschen der Websitedaten im Browser entfernt werden.</p></LegalSection>
    <LegalSection title="Rechtsgrundlage"><p>Der Zugriff auf technisch erforderlichen Browser-Speicher erfolgt zur Bereitstellung der ausdrücklich gewünschten Funktionen. Soweit dabei personenbezogene Daten verarbeitet werden, gelten die in der <a href="/datenschutz">Datenschutzerklärung</a> beschriebenen Rechtsgrundlagen. Falls später optionale Analyse- oder Marketingdienste hinzukommen, werden sie erst nach gesonderter Einwilligung aktiviert und diese Seite wird aktualisiert.</p></LegalSection>
  </LegalDocument>
}
