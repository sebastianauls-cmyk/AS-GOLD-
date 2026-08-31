const supabaseOrigin='https://bcvggtnvuesaihqvgisg.supabase.co'

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
  "media-src 'self' blob:",
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
    return [{source:'/:path*',headers:securityHeaders}]
  },
}

export default nextConfig
