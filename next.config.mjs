const supabaseOrigin='https://bcvggtnvuesaihqvgisg.supabase.co'
const heygenMediaOrigins='https://resource2.heygen.ai https://files2.heygen.ai'

const contentSecurityPolicy=[
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `media-src 'self' blob: ${heygenMediaOrigins}`,
  `connect-src 'self' ${supabaseOrigin} wss://bcvggtnvuesaihqvgisg.supabase.co`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ')

const securityHeaders=[
  {key:'Content-Security-Policy',value:contentSecurityPolicy},
  {key:'Referrer-Policy',value:'no-referrer'},
  {key:'X-Content-Type-Options',value:'nosniff'},
  {key:'X-Frame-Options',value:'DENY'},
  {key:'X-XSS-Protection',value:'0'},
  {key:'Cross-Origin-Opener-Policy',value:'same-origin'},
  {key:'Permissions-Policy',value:'camera=(), microphone=(self), geolocation=(), payment=(), usb=()'},
]

if(process.env.NODE_ENV==='production'){
  securityHeaders.push({key:'Strict-Transport-Security',value:'max-age=63072000'})
}

/** @type {import('next').NextConfig} */
const nextConfig={
  poweredByHeader:false,
  async headers(){
    const rules=[{source:'/:path*',headers:securityHeaders}]
    // Only the synthetic preview may be framed by its own origin, so its
    // responsive layout can be reviewed. All actual app routes keep DENY.
    if(process.env.VERCEL_ENV!=='production')rules.push({
      source:'/vorschau/v135',
      headers:[
        {key:'Content-Security-Policy',value:contentSecurityPolicy.replace("frame-ancestors 'none'","frame-ancestors 'self'")},
        {key:'X-Frame-Options',value:'SAMEORIGIN'},
      ],
    })
    if(process.env.VERCEL_ENV!=='production')rules.push({
      source:'/vorschau/v136',
      headers:[
        {key:'Content-Security-Policy',value:contentSecurityPolicy.replace("frame-ancestors 'none'","frame-ancestors 'self'")},
        {key:'X-Frame-Options',value:'SAMEORIGIN'},
      ],
    })
    return rules
  },
}

export default nextConfig
