import fs from 'node:fs'

const workspace=fs.readFileSync('app/modules/workspace/WorkspaceAppV2.js','utf8')
const audit=fs.readFileSync('app/modules/workspace/useWorkspaceAudit.js','utf8')
const session=fs.readFileSync('app/modules/workspace/useWorkspaceSession.js','utf8')

function assert(condition,message){if(!condition) throw new Error(message)}

assert(workspace.includes("import { useWorkspaceAudit } from './useWorkspaceAudit'"),'WorkspaceAppV2 must import useWorkspaceAudit')
assert(workspace.includes("import { useWorkspaceSession } from './useWorkspaceSession'"),'WorkspaceAppV2 must import useWorkspaceSession')
assert(!workspace.includes("recordAuditEvent"),'WorkspaceAppV2 must not own server audit persistence')
assert(!workspace.includes("getAuthSession"),'WorkspaceAppV2 must not own auth session reads')
assert(!workspace.includes("watchAuthState"),'WorkspaceAppV2 must not own auth state subscriptions')
assert(!workspace.includes("setActivityLog(previous=>"),'WorkspaceAppV2 must not own activity log persistence')
assert(audit.includes("recordAuditEvent"),'workspace audit hook must own server audit recording')
assert(audit.includes("localStorage.getItem"),'workspace audit hook must own local activity restore')
assert(audit.includes("resetAudit"),'workspace audit hook must expose a signed-out reset')
assert(session.includes("getAuthSession"),'workspace session hook must own initial auth session lookup')
assert(session.includes("watchAuthState"),'workspace session hook must own auth state subscription')
assert(session.includes("subscription.unsubscribe()"),'workspace session hook must clean up the auth subscription')
console.log('V46 workspace session/audit boundary guard passed')
