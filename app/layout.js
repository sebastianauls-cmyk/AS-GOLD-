import './globals.css'
import { HeroCopyEnhancer } from './components/HeroCopyEnhancer'
import { ProblemNavigator } from './components/ProblemNavigator'

export const metadata = {
  metadataBase: new URL('https://app-gold-workspace.vercel.app'),
  title: { default:'AS Gold', template:'%s' },
  description: 'Strukturierte Fallbearbeitung, Dokumente, Fristen und Freigaben im kontrollierten Testbetrieb.',
  applicationName: 'AS Gold',
  robots: { index:true, follow:true }
}

export default function RootLayout({ children }) {
  return <html lang="de"><body><HeroCopyEnhancer/><ProblemNavigator/>{children}</body></html>
}
