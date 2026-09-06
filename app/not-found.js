import Link from 'next/link'

export const metadata={title:'Seite nicht gefunden'}

export default function NotFound(){
  return <main className="center"><section className="card recoveryCard">
    <span className="modeBadge">404</span>
    <h1>Diese Seite wurde nicht gefunden.</h1>
    <p className="muted">Der Link ist möglicherweise veraltet. Von der Startseite aus erreichen Sie Anmeldung, Testzugang und Produktinformationen.</p>
    <Link className="primary btn" href="/">Zur Startseite</Link>
  </section></main>
}

