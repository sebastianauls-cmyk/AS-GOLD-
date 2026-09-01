import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

function key(){
  const secret=process.env.INTEGRATION_TOKEN_KEY
  if(!secret) throw new Error('INTEGRATION_TOKEN_KEY fehlt')
  return createHash('sha256').update(secret).digest()
}

export function sealIntegrationToken(value){
  const iv=randomBytes(12)
  const cipher=createCipheriv('aes-256-gcm',key(),iv)
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()])
  const tag=cipher.getAuthTag()
  return Buffer.concat([iv,tag,encrypted]).toString('base64url')
}

export function openIntegrationToken(value){
  if(!value) return null
  try{
    const raw=Buffer.from(value,'base64url')
    const iv=raw.subarray(0,12)
    const tag=raw.subarray(12,28)
    const encrypted=raw.subarray(28)
    const decipher=createDecipheriv('aes-256-gcm',key(),iv)
    decipher.setAuthTag(tag)
    return JSON.parse(Buffer.concat([decipher.update(encrypted),decipher.final()]).toString('utf8'))
  }catch{return null}
}
