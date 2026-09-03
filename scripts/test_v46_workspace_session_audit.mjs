import fs from 'node:fs'

const workspace=fs.readFileSync('app/modules/workspace/WorkspaceController.js','utf8')
const audit=fs.readFileSync('app/modules/workspace/useWorkspaceAudit.js','utf8')
const session=fs.readFileSync('app/modules/workspace/useWorkspaceSession.js','utf8')
function assert(condition,message){if(!condition) throw new Error(message)}
assert(workspace.includes("import { useWorkspaceAudit } from './useWorkspaceAudit'"),'WorkspaceController must import useWorkspaceAudit')
assert(workspace.includes("import { useWorkspaceSession } from './useWorkspaceSession'"),'WorkspaceController must import useWorkspaceSession')
assert(!workspace.includes("recordAuditEvent"),'WorkspaceController must not own server audit persistence')
assert(!workspace.includes("getAuthSession"),'WorkspaceController must not own auth session reads')
assert(!workspace.includes("watchAuthState"),'WorkspaceController must not own auth state subscriptions')
assert(!workspace.includes("setActivityLog(previous=>"),'WorkspaceController must not own activity log persistence')
assert(audit.includes("recordAuditEvent"),'workspace audit hook must own server audit recording')
assert(audit.includes("localStorage.getItem"),'workspace audit hook must own local activity restore')
assert(audit.includes("resetAudit"),'workspace audit hook must expose a signed-out reset')
assert(session.includes("getAuthSession"),'workspace session hook must own initial auth session lookup')
assert(session.includes("watchAuthState"),'workspace session hook must own auth state subscription')
assert(session.includes("subscription.unsubscribe()"),'workspace session hook must clean up the auth subscription')
console.log('V80 workspace session/audit boundary guard passed against WorkspaceController')
