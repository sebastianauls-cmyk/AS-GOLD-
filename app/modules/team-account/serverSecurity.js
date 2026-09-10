import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

import { AUTH_REDIRECT_URL } from '../services/authRepository.js'

const LOCAL_ORIGIN='http://localhost:3000'
const MASTER_HASH_PREFIX='scrypt'

function normalizeOrigin(value){
  if(typeof value!=='string'||!value.trim())return null
  try{return new URL(value).origin}catch{return null}
}

export function allowedTeamOrigins(){
  const values=[AUTH_REDIRECT_URL,process.env.APP_BASE_URL,LOCAL_ORIGIN]
  if(process.env.VERCEL_URL)values.push(`https://${process.env.VERCEL_URL}`)
  return new Set(values.map(normalizeOrigin).filter(Boolean))
}

export function isAllowedTeamOrigin(origin){
  const normalized=normalizeOrigin(origin)
  return !!normalized&&allowedTeamOrigins().has(normalized)
}

export function teamResponseHeaders(origin,{authorization=false}={}){
  const headers={
    'cache-control':'no-store, max-age=0',
    'content-type':'application/json; charset=utf-8',
    'vary':'Origin'
  }
  if(isAllowedTeamOrigin(origin)){
    headers['access-control-allow-origin']=normalizeOrigin(origin)
    headers['access-control-allow-methods']='POST, OPTIONS'
    headers['access-control-allow-headers']=authorization?'authorization, content-type':'content-type'
  }
  return headers
}

export function readBearerToken(request){
  const value=request.headers.get('authorization')||''
  const match=value.match(/^Bearer\s+([^\s]+)$/i)
  return match?.[1]||''
}

export function parseMasterPasswordHash(encoded=process.env.TEAM_MASTER_PASSWORD_HASH){
  if(typeof encoded!=='string')return null
  const [prefix,saltHex,hashHex]=encoded.split(':')
  if(prefix!==MASTER_HASH_PREFIX||!/^[a-f0-9]{32,128}$/i.test(saltHex||'')||!/^[a-f0-9]{64,256}$/i.test(hashHex||''))return null
  try{
    const salt=Buffer.from(saltHex,'hex')
    const hash=Buffer.from(hashHex,'hex')
    if(!salt.length||!hash.length)return null
    return {salt,hash}
  }catch{return null}
}

export function verifyMasterPassword(password,encoded=process.env.TEAM_MASTER_PASSWORD_HASH){
  if(typeof password!=='string'||password.length<12||password.length>256)return false
  const parsed=parseMasterPasswordHash(encoded)
  if(!parsed)return false
  try{
    const candidate=scryptSync(password,parsed.salt,parsed.hash.length)
    return candidate.length===parsed.hash.length&&timingSafeEqual(candidate,parsed.hash)
  }catch{return false}
}

export function createMasterPasswordHash(password){
  if(typeof password!=='string'||password.length<12||password.length>256)return null
  try{
    const salt=randomBytes(24)
    const hash=scryptSync(password,salt,64)
    return `${MASTER_HASH_PREFIX}:${salt.toString('hex')}:${hash.toString('hex')}`
  }catch{return null}
}

export function masterPasswordConfigured(encoded=process.env.TEAM_MASTER_PASSWORD_HASH){
  return !!parseMasterPasswordHash(encoded)
}
