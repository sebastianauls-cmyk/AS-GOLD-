import './globals.css'

export const metadata = {
  title: 'AS Gold',
  description: 'Strukturierte Fallbearbeitung, Dokumente, Fristen und Freigaben.'
}

export default function RootLayout({ children }) {
  return <html lang="de"><body>{children}</body></html>
}
