// The database mutation already succeeded. Activity logging runs independently
// so its failure or a hanging connection cannot hide the committed result.
export function recordCommittedAction(recordLocalAction,recordServerAudit,eventType,metadata={},entityType=null,entityId=null){
  try{recordLocalAction(eventType)}catch(error){console.warn('Local activity unavailable',error)}
  void Promise.resolve().then(()=>recordServerAudit(eventType,metadata,entityType,entityId))
    .catch(error=>console.warn('Server activity unavailable',error))
}
