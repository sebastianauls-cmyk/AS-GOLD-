import './globals.css'
import { AccessibilityHardening } from './modules/navigation/AccessibilityHardening'
import { MobileResilience } from './modules/navigation/MobileResilience'

export const metadata = {
  metadataBase: new URL('https://app-gold-workspace.vercel.app'),
  title: { default:'AS Gold', template:'%s' },
  description: 'Strukturierte Fallbearbeitung, Dokumente, Fristen und Freigaben im kontrollierten Testbetrieb.',
  applicationName: 'AS Gold',
  appleWebApp: { capable:true, title:'AS Gold', statusBarStyle:'default' },
  robots: { index:true, follow:true }
}

export const viewport = { themeColor:'#8f6e25' }

export default function RootLayout({ children }) {
  return <html lang="de"><body><AccessibilityHardening/><MobileResilience/>{children}</body></html>
}
