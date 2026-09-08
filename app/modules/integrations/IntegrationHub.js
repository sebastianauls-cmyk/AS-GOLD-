'use client'

import OptionalExtensions from '../optional/OptionalExtensions'
import { LegalFooter } from '../compliance/LegalFooter'

const button={border:'1px solid #c9ad66',background:'#fffaf0',borderRadius:10,padding:'10px 13px',fontWeight:800,color:'#5a4516',textDecoration:'none',textAlign:'center'}

export default function IntegrationHub(){
  return <><header style={{background:'#fff',borderBottom:'1px solid #e3e5e9'}}><div className="wrap" style={{minHeight:72,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><a href="/" style={{fontWeight:900,color:'#252b33',textDecoration:'none'}}>AS Workspace Gold</a><a className="integrationBackBtn" data-persistent-back href="/" style={button}>← Zurück</a></div></header>
  <main className="wrap" style={{padding:'42px 0 70px'}}>
    <OptionalExtensions/>
    <p style={{marginTop:20,color:'#666'}}>Hinweis: Direkte Verbindungs- oder Zahlungsaktionen werden im Standardbetrieb nicht angeboten. Externe Ablage, E-Mail, Cloud und Bezahlung werden nur nach ausdrücklicher Anfrage als eigener Baustein eingerichtet.</p>
  </main><LegalFooter language="de"/></>
}
