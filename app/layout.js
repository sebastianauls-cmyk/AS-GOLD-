import './globals.css'
import { V37FirstAction } from './modules/public/V37FirstAction'
import { ProductIntroCompact } from './modules/public/ProductIntroCompact'
import { ExplainerVideo } from './modules/public/ExplainerVideo'
import { ProblemNavigator } from './modules/public/ProblemNavigator'
import { V38DeadlineCardEnhancer } from './modules/cases/V38DeadlineCardEnhancer'
import { V38AssessmentExplainability } from './modules/cases/V38AssessmentExplainability'
import { V38PrimaryNextStep } from './modules/cases/V38PrimaryNextStep'
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
  return <html lang="de"><body><AccessibilityHardening/><MobileResilience/><V37FirstAction/><ProblemNavigator/><ExplainerVideo/><ProductIntroCompact/><V38DeadlineCardEnhancer/><V38AssessmentExplainability/><V38PrimaryNextStep/><V39CaseTimelineAutoAssessment/><V40ProfessionalHandoff/><V41CaseConsistency/><V42ActionableGaps/>{children}</body></html>
}
