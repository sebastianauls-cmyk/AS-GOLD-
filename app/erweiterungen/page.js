import OptionalExtensions from '../modules/optional/OptionalExtensions'
import { LegalFooter } from '../modules/compliance/LegalFooter'

export const metadata={title:'Optionale Erweiterungen',description:'Optionale AS Workspace Gold Bausteine für Cloud, Ablage und Bezahlung – nur auf ausdrücklichen Wunsch.'}

export default function ErweiterungenPage(){
  return <><header style={{background:'#fff',borderBottom:'1px solid #e3e5e9'}}><div className="wrap" style={{minHeight:72,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><a href="/" style={{fontWeight:900,color:'#252b33',textDecoration:'none'}}>AS Workspace Gold</a><a data-persistent-back href="/" style={{border:'1px solid #c9ad66',background:'#fffaf0',borderRadius:10,padding:'10px 13px',fontWeight:800,color:'#5a4516',textDecoration:'none'}}>← Zurück</a></div></header><main className="wrap" style={{padding:'42px 0 70px'}}><OptionalExtensions/></main><LegalFooter language="de"/></>
}
