import './globals.css'
import { HeroCopyEnhancer } from './components/HeroCopyEnhancer'
import { HeroTitleStabilizer } from './modules/public/HeroTitleStabilizer'
import { V37FirstAction } from './modules/public/V37FirstAction'
import { ProductIntroCompact } from './modules/public/ProductIntroCompact'
import { ExplainerVideo } from './modules/public/ExplainerVideo'
import { ProblemNavigator } from './modules/public/ProblemNavigator'
import { CaseChoiceJumpEnhancer } from './modules/public/CaseChoiceJumpEnhancer'
import { V38DeadlineCardEnhancer } from './components/V38DeadlineCardEnhancer'
import { V38AssessmentExplainability } from './components/V38AssessmentExplainability'
import { V38PrimaryNextStep } from './components/V38PrimaryNextStep'
import { AccessibilityHardening } from './modules/navigation/AccessibilityHardening'
import { MobileResilience } from './modules/navigation/MobileResilience'
import { V39CaseTimelineAutoAssessment } from './components/V39CaseTimelineAutoAssessment'
import { V40ProfessionalHandoff } from './components/V40ProfessionalHandoff'
import { V41CaseConsistency } from './components/V41CaseConsistency'
import { V42ActionableGaps } from './components/V42ActionableGaps'
import { V45OutputLanguageBridge } from './components/V45OutputLanguageBridge'

export const metadata = {
  metadataBase: new URL('https://app-gold-workspace.vercel.app'),
  title: { default:'AS Gold', template:'%s' },
  description: 'Strukturierte Fallbearbeitung, Dokumente, Fristen und Freigaben im kontrollierten Testbetrieb.',
  applicationName: 'AS Gold',
  robots: { index:true, follow:true }
}

export default function RootLayout({ children }) {
  return <html lang="de"><body><V45OutputLanguageBridge/><AccessibilityHardening/><MobileResilience/><HeroCopyEnhancer/><HeroTitleStabilizer/><V37FirstAction/><ProblemNavigator/><ExplainerVideo/><ProductIntroCompact/><CaseChoiceJumpEnhancer/><V38DeadlineCardEnhancer/><V38AssessmentExplainability/><V38PrimaryNextStep/><V39CaseTimelineAutoAssessment/><V40ProfessionalHandoff/><V41CaseConsistency/><V42ActionableGaps/>{children}</body></html>
}
