import { PRODUCT_DESCRIPTOR, PRODUCT_NAME } from './modules/brand/productBrand.mjs'

export default function manifest(){
  return {
    name:PRODUCT_NAME,
    short_name:PRODUCT_NAME,
    description:`${PRODUCT_DESCRIPTOR}: Dokumente, Fälle, Fristen und Freigaben strukturiert bearbeiten.`,
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
