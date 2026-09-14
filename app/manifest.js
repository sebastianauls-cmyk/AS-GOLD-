import { PRODUCT_BRAND, PRODUCT_DESCRIPTOR, PRODUCT_NAME } from './modules/brand/productBrand.mjs'

export default function manifest(){
  return {
    id:'/',
    name:PRODUCT_NAME,
    short_name:PRODUCT_BRAND.shortName,
    description:`${PRODUCT_DESCRIPTOR}: Dokumente, Fälle, Fristen und Freigaben strukturiert bearbeiten.`,
    start_url:'/',
    scope:'/',
    display:'standalone',
    background_color:'#f5f6f8',
    theme_color:'#8f6e25',
    orientation:'any',
    icons:[
      {src:'/ash-workspace-icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
      {src:'/ash-workspace-icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
      {src:'/ash-workspace-icon-512-maskable.png',sizes:'512x512',type:'image/png',purpose:'maskable'},
      {src:'/ash-workspace-gold-icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}
    ]
  }
}
