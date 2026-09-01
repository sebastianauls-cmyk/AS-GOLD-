import { howAsGoldWorksCopy } from './asGoldIntroCopy.mjs'

export function ProductIntroCompact({language='de'}){
  const c=howAsGoldWorksCopy[language]||howAsGoldWorksCopy.de
  const rtl=language==='ar'||language==='fa'
  return <section id="asgold-product-intro-compact" dir={rtl?'rtl':'ltr'} style={{margin:'18px 0 8px',padding:16,border:'1px solid #dccb9f',borderRadius:18,background:'linear-gradient(135deg,#fffaf0,#fff)',boxShadow:'0 8px 24px rgba(72,55,18,.05)'}}>
    <b style={{display:'block',fontSize:'1.3rem',color:'#4d3b14'}}>{c.title}</b>
    <p style={{margin:'6px 0 10px',color:'#596472',lineHeight:1.4}}>{c.lead}</p>
    <div style={{display:'grid',gap:8}}>{c.items.map((item,index)=><div key={item} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 11px',borderRadius:10,background:'#fff',border:'1px solid #ece4cf',color:'#4f5966',lineHeight:1.4}}><span aria-hidden="true" style={{flex:'0 0 auto',display:'grid',placeItems:'center',width:25,height:25,borderRadius:999,background:'#9b7724',color:'#fff',fontWeight:900,fontSize:'.82rem'}}>{index+1}</span><span>{item}</span></div>)}</div>
  </section>
}
