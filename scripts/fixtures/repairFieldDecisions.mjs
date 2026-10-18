// Controlled provider replies only. The reasons below are fixture data, not
// evidence, semantic review or a measurement of live correction quality.
export function repairReplyWithFieldDecisions(reply,assignments){
  const topics=assignments.filter(item=>item.check_fields)
  if(!topics.length)return reply
  if(reply.requires_full_correction)return {...reply,topic_checks:null}
  return {...reply,topic_checks:Object.fromEntries(topics.map(item=>[item.key,Object.fromEntries(item.check_fields.map(field=>[field,{
    action:reply.changes[item.key][field]===item.previous[field]?'preserve':'replace',
    reason:'Controlled fixture decision for '+field+'; independent review still checks the complete text.'
  }]))]))}
}
