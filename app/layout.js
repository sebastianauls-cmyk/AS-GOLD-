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

export const metadata = {
  metadataBase: new URL('https://app-gold-workspace.vercel.app'),
  title: { default:'AS Gold', template:'%s' },
  description: 'Strukturierte Fallbearbeitung, Dokumente, Fristen und Freigaben im kontrollierten Testbetrieb.',
  applicationName: 'AS Gold',
  robots: { index:true, follow:true }
}

export default function RootLayout({ children }) {
  return <html lang="de"><body><V38MobileResilience/><HeroCopyEnhancer/><HeroTitleStabilizer/><V37FirstAction/><ProblemNavigator/><ExplainerVideo/><ProductIntroCompact/><CaseChoiceJumpEnhancer/><V38DeadlineCardEnhancer/><V38AssessmentExplainability/><V38PrimaryNextStep/>{children}</body></html>
}
