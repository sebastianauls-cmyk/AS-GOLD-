import Link from 'next/link'
import { TEAM_LOGIN_PATH } from './teamAccountConfig.mjs'

export function TeamAccountEntry(){
  return <>
    <section className="insiderRights" aria-label="Rechte des gemeinsamen Teamkontos">
      <strong>Gemeinsamer Arbeitsstand für alle im Teamkonto</strong>
      <span>Fälle & Kunden</span>
      <span>Dokumente & Auswertungen</span>
      <span>Schreiben & Freigaben</span>
      <span>Alle internen Einstellungen</span>
      <span>Alle Inhalte, Funktionen & Module</span>
      <span>Öffentliche und interne Bereiche</span>
    </section>

    <article className="insiderActionCard">
      <span className="insiderActionIcon" aria-hidden="true">🔐</span>
      <h2>Gemeinsames Teamkonto</h2>
      <p>Passwort 1 gibt allen autorisierten Teammitgliedern Vollzugriff auf das gesamte AS Workspace. Sie dürfen überall arbeiten und jede Änderung vorbereiten. Als neue Live-Version wirksam wird eine Änderung erst nach Ihrer Freigabe mit Passwort 2.</p>
      <Link className="primary insiderPrimaryAction" href={TEAM_LOGIN_PATH}>Mit Passwort 1 alles öffnen</Link>
    </article>
  </>
}
