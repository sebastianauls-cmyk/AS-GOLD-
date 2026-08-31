import './globals.css'
import { HeroCopyEnhancer } from './components/HeroCopyEnhancer'
import { HeroTitleStabilizer } from './components/HeroTitleStabilizer'
import { V37FirstAction } from './components/V37FirstAction'
import { ProductIntroCompact } from './components/ProductIntroCompact'
import { ExplainerVideo } from './components/ExplainerVideo'
import { ProblemNavigator } from './components/ProblemNavigator'
import { CaseChoiceJumpEnhancer } from './components/CaseChoiceJumpEnhancer'

export const metadata = {
  metadataBase: new URL('https://app-gold-workspace.vercel.app'),
  title: { default:'AS Gold', template:'%s' },
  description: 'Strukturierte Fallbearbeitung, Dokumente, Fristen und Freigaben im kontrollierten Testbetrieb.',
  applicationName: 'AS Gold',
  robots: { index:true, follow:true }
}

export default function RootLayout({ children }) {
  return <html lang="de"><body><HeroCopyEnhancer/><HeroTitleStabilizer/><V37FirstAction/><ProblemNavigator/><ExplainerVideo/><ProductIntroCompact/><CaseChoiceJumpEnhancer/>{children}</body></html>
}
