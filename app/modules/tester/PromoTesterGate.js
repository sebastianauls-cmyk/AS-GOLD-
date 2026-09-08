export function PromoTesterGate(){
  return <main className="center"><section className="card recoveryCard" style={{maxWidth:620}}>
    <span className="modeBadge">V131 · Persönlicher Testerzugang</span>
    <h1>Promo-Code persönlich anfordern</h1>
    <p className="muted">Testerzugänge werden nicht öffentlich und nicht automatisch freigeschaltet. Bitte schreiben Sie dem Anbieter persönlich per WhatsApp oder E-Mail und nennen Sie Ihren Namen sowie die E-Mail-Adresse, mit der Sie sich bei AS Workspace Gold anmelden.</p>
    <div className="legalNotice legalNotice-warning">
      <b>Freigabe nur nach persönlicher Bestätigung.</b>
      <p>Erst wenn der Anbieter ausdrücklich zustimmt, wird ein individueller Promo-Code erzeugt. Dieser Code wird an die angegebene Login-E-Mail gebunden und kann von keinem anderen Konto eingelöst werden.</p>
    </div>
    <ol style={{display:'grid',gap:10,paddingInlineStart:22}}>
      <li>Per WhatsApp oder E-Mail persönlich Testerzugang anfragen.</li>
      <li>Name und die spätere Login-E-Mail mitteilen.</li>
      <li>Ausdrückliche Freigabe des Anbieters abwarten.</li>
      <li>Persönlichen Promo-Code erhalten.</li>
      <li>Mit genau dieser E-Mail anmelden und den Code im Promo-Bereich einlösen.</li>
    </ol>
    <p><b>Wichtig:</b> Die Bezahlfunktion bleibt deaktiviert. Ein Tester-Code löst keine Zahlung und keine automatische Verlängerung aus.</p>
    <div style={{display:'grid',gap:10}}>
      <a className="primary btn" href="/kontakt">Kontakt zum Anbieter öffnen</a>
      <a className="secondary btn" data-persistent-back href="/">← Zur Startseite</a>
    </div>
  </section></main>
}
