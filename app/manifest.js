export default function manifest(){
  return {
    name:'AS Gold',
    short_name:'AS Gold',
    description:'Dokumente, Fälle, Fristen und Freigaben strukturiert bearbeiten.',
    start_url:'/',
    scope:'/',
    display:'standalone',
    background_color:'#f5f6f8',
    theme_color:'#8f6e25',
    orientation:'any',
    icons:[
      {src:'/as-gold-icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}
    ]
  }
}
