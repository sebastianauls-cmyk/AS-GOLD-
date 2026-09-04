import fs from 'node:fs'

const panel=fs.readFileSync('app/modules/documents/DeviceReadinessPanel.js','utf8')
const surface=fs.readFileSync('app/modules/documents/DocumentsSurface.js','utf8')
const voice=fs.readFileSync('app/modules/documents/VoiceContextInput.js','utf8')

const need=(source,needle,label)=>{if(!source.includes(needle))throw new Error(`V99 device guard missing ${label}: ${needle}`)}

need(surface,"./DeviceReadinessPanel",'device readiness import')
need(surface,'<DeviceReadinessPanel language={interfaceLanguage}/>','device readiness mount')
need(panel,'navigator.mediaDevices.getUserMedia','user-initiated media capability check')
need(panel,"kind==='audio'?{audio:true}:{video:true}",'separate microphone and camera checks')
need(panel,"track=>track.stop()",'immediate media stream cleanup')
need(panel,"'denied'",'permission denial state')
need(panel,"'missing'",'unsupported-device state')
need(panel,'🟢','green readiness indicator')
need(panel,'🟡','checking indicator')
need(panel,'🔴','blocked/unavailable indicator')
need(voice,'voiceUnsupported','speech-recognition fallback message')
need(voice,'textarea','manual voice-context fallback')

for(const language of ['de','en','pl','tr','ru','ar','fr','fa','ro','bg','vi']) need(panel,`${language}:{`,`${language} device copy`)

console.log('V99 device readiness guard passed: camera/microphone permission checks, cleanup, status indicators and manual fallback are wired in 11 languages.')
