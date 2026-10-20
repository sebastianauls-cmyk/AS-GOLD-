// Controlled provider replies only. The reasons below are fixture data, not
// evidence, semantic review or a measurement of live correction quality.
export function repairReplyWithFieldDecisions(reply,assignments){
  const topics=assignments.filter(item=>item.check_fields)
  if(!topics.length)return reply
  if(reply.requires_full_correction)return {...reply,topic_checks:null}
  const changes=structuredClone(reply.changes),topic_checks={}
  for(const item of topics){
    topic_checks[item.key]=Object.fromEntries(item.check_fields.map(field=>{
      const value=changes[item.key][field],preserve=value===item.previous[field]
      delete changes[item.key][field]
      return [field,{action:preserve?'preserve':'replace',
        reason:'Controlled fixture decision for '+field+'; independent review still checks the complete text.',
        replacement:preserve?null:value}]
    }))
  }
  return {...reply,topic_checks,changes}
}
