import { TesterGuide } from '../modules/tester/TesterGuide'
import { APP_VERSION } from '../modules/release/appRelease.mjs'

export const metadata={title:`AS Gold ${APP_VERSION} testen und weiterleiten`,description:'AS Gold sicher testen und den Tester-Link direkt über WhatsApp oder andere Apps weiterleiten.'}

export default function TestingGuide(){return <TesterGuide/>}
