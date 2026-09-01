import './globals.css'
import { AccessibilityHardening } from './modules/navigation/AccessibilityHardening'
import { MobileResilience } from './modules/navigation/MobileResilience'
import { V39CaseTimelineAutoAssessment } from './modules/cases/V39CaseTimelineAutoAssessment'
import { V40ProfessionalHandoff } from './modules/cases/V40ProfessionalHandoff'
import { V41CaseConsistency } from './modules/cases/V41CaseConsistency'
import { V42ActionableGaps } from './modules/cases/V42ActionableGaps'

export const metadata = {
  metadataBase: new URL('https://app-gold-workspace.vercel.app'),
  title: { default:'AS Gold', template:'%s' },
  description: 'Strukturierte Fallbearbeitung, Dokumente, Fristen und Freigaben im kontrollierten Testbetrieb.',
  applicationName: 'AS Gold',
  robots: { index:true, follow:true }
}

export default function RootLayout({ children }) {
  return <html lang="de"><body><AccessibilityHardening/><MobileResilience/><V39CaseTimelineAutoAssessment/><V40ProfessionalHandoff/><V41CaseConsistency/><V42ActionableGaps/>{children}</body></html>
}
