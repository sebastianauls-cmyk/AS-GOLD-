import './globals.css'
import { AccessibilityHardening } from './modules/navigation/AccessibilityHardening'
import { MobileResilience } from './modules/navigation/MobileResilience'
import { PRODUCT_DESCRIPTOR, PRODUCT_NAME, PRODUCT_PROMISE } from './modules/brand/productBrand.mjs'

export const metadata = {
  metadataBase: new URL('https://app-gold-workspace.vercel.app'),
  title: { default:`${PRODUCT_NAME} – ${PRODUCT_DESCRIPTOR}`, template:`%s | ${PRODUCT_NAME}` },
  description: `${PRODUCT_DESCRIPTOR}. ${PRODUCT_PROMISE}.`,
  applicationName: PRODUCT_NAME,
  appleWebApp: { capable:true, title:PRODUCT_NAME, statusBarStyle:'default' },
  robots: { index:true, follow:true }
}

export const viewport = { themeColor:'#8f6e25' }

export default function RootLayout({ children }) {
  return <html lang="de"><body><AccessibilityHardening/><MobileResilience/>{children}</body></html>
}
