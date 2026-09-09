export function PromoTesterGate(){
  return <main className="center"><section className="card recoveryCard" style={{maxWidth:700}}>
    <span className="modeBadge">V131 · Persönlicher Testerzugang</span>
    <h1>Vollständig kostenlosen Testzugang persönlich anfordern</h1>
    <p className="muted">Der persönliche Testzugang ist vollständig kostenlos. Um ihn zu erhalten, senden Sie dem Anbieter zunächst eine E-Mail mit Ihrem Namen und der E-Mail-Adresse, mit der Sie AS Workspace Gold nutzen möchten.</p>

    <div className="legalNotice legalNotice-warning">
      <b>Freigabe nur nach persönlicher Bestätigung.</b>
      <p>Erst wenn der Anbieter ausdrücklich zustimmt, wird ein individueller Promo-Code erzeugt. Dieser Code wird an die angegebene Login-E-Mail gebunden und kann von keinem anderen Konto eingelöst werden.</p>
    </div>

    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10,margin:'16px 0'}} aria-label="Ablauf Testerzugang">
      <div className="detailCard" style={{padding:14}}><b>1 · Anfrage senden</b><p className="muted">Persönlich per WhatsApp oder E-Mail anfragen und Name sowie spätere Login-E-Mail mitteilen.</p></div>
      <div className="detailCard" style={{padding:14}}><b>2 · Freigabe erhalten</b><p className="muted">Nach ausdrücklicher Zustimmung erhalten Sie Ihren persönlichen, E-Mail-gebundenen Code.</p></div>
      <div className="detailCard" style={{padding:14}}><b>3 · Anmelden</b><p className="muted">Mit genau der freigegebenen E-Mail registrieren oder anmelden.</p></div>
      <div className="detailCard" style={{padding:14}}><b>4 · Code einlösen</b><p className="muted">Den persönlichen Code auf der Einlöse-Seite aktivieren und AS Workspace Gold öffnen.</p></div>
    </section>

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
      <a className="primary btn" href="/kontakt">1 · E-Mail an den Anbieter senden</a>
      <a className="secondary btn" href="/">2 · Registrieren oder anmelden</a>
      <a className="secondary btn" href="/tester-freischalten">3 · Persönlichen Tester-Code einlösen</a>
      <a className="secondary btn" data-persistent-back href="/">← Zur Startseite</a>
    </div>
  </section></main>
}
