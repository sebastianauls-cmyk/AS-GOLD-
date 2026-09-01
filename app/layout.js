import './globals.css'
import { HeroCopyEnhancer } from './components/HeroCopyEnhancer'
import { HeroTitleStabilizer } from './components/HeroTitleStabilizer'
import { V37FirstAction } from './components/V37FirstAction'
import { ProductIntroCompact } from './components/ProductIntroCompact'
import { ExplainerVideo } from './components/ExplainerVideo'
import { ProblemNavigator } from './components/ProblemNavigator'
import { CaseChoiceJumpEnhancer } from './components/CaseChoiceJumpEnhancer'
import { V38DeadlineCardEnhancer } from './components/V38DeadlineCardEnhancer'
import { V38AssessmentExplainability } from './components/V38AssessmentExplainability'
import { V38PrimaryNextStep } from './components/V38PrimaryNextStep'
import { V38MobileResilience } from './components/V38MobileResilience'
import { V38AccessibilityHardening } from './components/V38AccessibilityHardening'
import { V38IntegrationAvailabilityGuard } from './components/V38IntegrationAvailabilityGuard'
import { V39CaseTimelineAutoAssessment } from './components/V39CaseTimelineAutoAssessment'
import { V40ProfessionalHandoff } from './components/V40ProfessionalHandoff'
import { V41CaseConsistency } from './components/V41CaseConsistency'
import { V42ActionableGaps } from './components/V42ActionableGaps'
import { V45OutputLanguageBridge } from './components/V45OutputLanguageBridge'
import { HomepageFlowAnchors } from './components/HomepageFlowAnchors'

export const metadata = {
  metadataBase: new URL('https://app-gold-workspace.vercel.app'),
  title: { default:'AS Gold', template:'%s' },
  description: 'Strukturierte Fallbearbeitung, Dokumente, Fristen und Freigaben im kontrollierten Testbetrieb.',
  applicationName: 'AS Gold',
  robots: { index:true, follow:true }
}

export default function RootLayout({ children }) {
  return <html lang="de"><body><V45OutputLanguageBridge/><V38AccessibilityHardening/><V38MobileResilience/><V38IntegrationAvailabilityGuard/><HeroCopyEnhancer/><HeroTitleStabilizer/><HomepageFlowAnchors/><ProductIntroCompact/><V37FirstAction/><ProblemNavigator/><ExplainerVideo/><CaseChoiceJumpEnhancer/><V38DeadlineCardEnhancer/><V38AssessmentExplainability/><V38PrimaryNextStep/><V39CaseTimelineAutoAssessment/><V40ProfessionalHandoff/><V41CaseConsistency/><V42ActionableGaps/>{children}</body></html>
}
