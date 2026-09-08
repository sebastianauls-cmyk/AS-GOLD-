import './globals.css'
import './ux-v131.css'
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

const releaseBarStyle={
  width:'100%',
  boxSizing:'border-box',
  display:'flex',
  alignItems:'center',
  justifyContent:'center',
  gap:'10px',
  flexWrap:'wrap',
  padding:'9px 14px',
  background:'#17140d',
  color:'#fff7dd',
  borderBottom:'3px solid #b89035',
  fontSize:'13px',
  fontWeight:800,
  letterSpacing:'.02em',
  textAlign:'center',
  position:'relative',
  zIndex:220
}

const releaseLinkStyle={
  color:'#fff',
  textDecoration:'none',
  border:'1px solid #d8b45a',
  borderRadius:'999px',
  padding:'4px 10px',
  background:'#8f6e25',
  whiteSpace:'nowrap'
}

export default function RootLayout({ children }) {
  return <html lang="de"><body>
    <AccessibilityHardening/>
    <MobileResilience/>
    <div data-global-release-bar="v131" style={releaseBarStyle}>
      <span>● V131 · LIVE · PILOT &amp; ABNAHME</span>
      <span>11 Sprachen · 1.100 Testfälle · 8.800 Dokumente · Rechtsraumvergleich</span>
      <a href="/testen" style={releaseLinkStyle}>V131 testen →</a>
    </div>
    {children}
  </body></html>
}
