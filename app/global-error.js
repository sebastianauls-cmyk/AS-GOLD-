'use client'

export default function GlobalError({error,retry}){
  return <html lang="de"><body style={{margin:0,background:'#f5f6f8',color:'#1f2937',fontFamily:'Inter,ui-sans-serif,system-ui,sans-serif'}}>
    <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:20}}><section role="alert" style={{width:'min(520px,100%)',background:'#fff',border:'1px solid #e3e5e9',borderRadius:20,padding:28,boxShadow:'0 16px 50px #11182714'}}>
      <title>Technischer Fehler | AS Workspace Gold</title>
      <p style={{color:'#6e5519',fontWeight:800}}>AS Workspace Gold</p>
      <h1>Die Anwendung konnte nicht vollständig geladen werden.</h1>
      <p style={{color:'#67717f',lineHeight:1.6}}>Bitte versuchen Sie es erneut. Falls der Fehler bestehen bleibt, öffnen Sie die Startseite neu.</p>
      {error?.digest&&<p style={{fontSize:13,color:'#737d8a'}}>Referenz: {error.digest}</p>}
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:24}}><button type="button" onClick={()=>retry()} style={{border:0,borderRadius:12,padding:'11px 16px',background:'#8f6e25',color:'#fff',fontWeight:700,cursor:'pointer'}}>Erneut versuchen</button><a href="/" style={{border:'1px solid #d7d9df',borderRadius:12,padding:'11px 16px',background:'#fff',color:'#374151',fontWeight:700,textDecoration:'none'}}>Zur Startseite</a></div>
    </section></main>
  </body></html>
}

