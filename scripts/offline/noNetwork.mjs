// Preload before application imports. This guards trusted regression tests
// against accidental service calls; it is not a sandbox for untrusted code.
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import tls from 'node:tls'
import dns from 'node:dns'
import dgram from 'node:dgram'
import childProcess from 'node:child_process'
import {syncBuiltinESMExports} from 'node:module'

const attempts=[]
const deny=transport=>()=>{
  attempts.push(transport)
  throw Object.assign(new Error(`Offline-Prüfung: ${transport} ist gesperrt.`),{code:'ASH_OFFLINE_NETWORK'})
}
globalThis.fetch=async()=>deny('fetch')()
globalThis.WebSocket=class {constructor(){deny('WebSocket')()}}
globalThis.EventSource=class {constructor(){deny('EventSource')()}}
for(const [module,names] of [
  [http,['request','get']], [https,['request','get']],
  [net,['connect','createConnection']], [tls,['connect']],
  [dgram,['createSocket']],
  [childProcess,['exec','execFile','spawn','fork','execSync','execFileSync','spawnSync']]
])for(const name of names)module[name]=deny(name)
net.Socket.prototype.connect=deny('Socket.connect')
for(const module of [dns,dns.promises]){
  for(const name of Object.keys(module))if(/^(?:lookup|resolve|reverse)/.test(name)&&typeof module[name]==='function')module[name]=deny('dns.'+name)
  for(const name of Object.getOwnPropertyNames(module.Resolver.prototype))if(/^(?:resolve|reverse)/.test(name))module.Resolver.prototype[name]=deny('Resolver.'+name)
}
syncBuiltinESMExports()

export const offlineNetworkAttempts=()=>[...attempts]
