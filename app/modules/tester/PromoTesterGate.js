export function PromoTesterGate(){
  return <main className="center"><section className="card recoveryCard" style={{maxWidth:620}}>
    <span className="modeBadge">V131 · Persönlicher Testerzugang</span>
    <h1>Vollständig kostenlosen Testzugang persönlich anfordern</h1>
    <p className="muted">Der persönliche Testzugang ist vollständig kostenlos. Um ihn zu erhalten, senden Sie dem Anbieter zunächst eine E-Mail mit Ihrem Namen und der E-Mail-Adresse, mit der Sie AS Workspace Gold nutzen möchten.</p>
    <div className="legalNotice legalNotice-warning">
      <b>Freigabe nur nach persönlicher Bestätigung.</b>
      <p>Erst wenn der Anbieter ausdrücklich zustimmt, wird ein individueller Promo-Code erzeugt. Dieser Code wird an die angegebene Login-E-Mail gebunden und kann von keinem anderen Konto eingelöst werden.</p>
    </div>
    <ol style={{display:'grid',gap:10,paddingInlineStart:22}}>
      <li>Dem Anbieter per E-Mail persönlich den kostenlosen Testerzugang anfragen.</li>
      <li>Name und die spätere Login-E-Mail mitteilen.</li>
      <li>Ausdrückliche Freigabe des Anbieters abwarten.</li>
      <li>Persönlichen Promo-Code erhalten.</li>
      <li>Mit genau dieser E-Mail anmelden und den Code unter „Tester-Code einlösen“ aktivieren.</li>
    </ol>
    <div className="legalNotice" style={{marginTop:14}}>
      <b>Zugang bis auf Widerruf.</b>
      <p>Für den Testerzugang wird derzeit kein festes Enddatum angezeigt. Es besteht jedoch kein Anspruch auf dauerhafte oder unbefristete Nutzung. Der Anbieter kann den Zugang jederzeit beenden, sperren oder ändern.</p>
    </div>
    <p><b>Keine Kosten:</b> Es entstehen keine Kosten und keine automatische Verlängerung. Die Bezahlfunktion bleibt deaktiviert.</p>
    <div style={{display:'grid',gap:10}}>
      <a className="primary btn" href="/kontakt">E-Mail an den Anbieter senden</a>
      <a className="secondary btn" href="/tester-freischalten">Persönlichen Tester-Code einlösen</a>
      <a className="secondary btn" data-persistent-back href="/">← Zur Startseite</a>
    </div>
  </section></main>
}
