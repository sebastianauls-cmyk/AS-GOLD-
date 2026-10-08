// Content-free provider evidence, not a price estimate. Null means unreported or
// invalid; it must never be interpreted as zero usage or the standard tier.
const identifier=value=>typeof value==='string'&&/^[A-Za-z0-9_.:/-]{1,128}$/.test(value)?value:null
const count=value=>Number.isSafeInteger(value)&&value>=0?value:null

export function modelUsageReceipt(response,request) {
  const input=count(response.usage?.input_tokens)
  const details=response.usage?.input_tokens_details
  const read=count(details?.cached_tokens),write=count(details?.cache_write_tokens)
  const actions=Array.isArray(response.output)?response.output.filter(item=>item?.type==='web_search_call'):null
  const actionCount=type=>actions===null?null:actions.filter(item=>item.action?.type===type).length
  return {
    schema_version:1,
    requested_model:identifier(request.model),response_model:identifier(response.model),
    response_id:identifier(response.id),response_status:identifier(response.status),
    requested_service_tier:identifier(request.service_tier),service_tier:identifier(response.service_tier),
    cache_read_tokens:input!==null&&read!==null&&read<=input?read:null,
    cache_write_tokens:input!==null&&write!==null&&write<=input-(read??0)?write:null,
    // Count returned search actions separately from browsing actions. Do not
    // keep search queries, URLs, page contents, or generated response text.
    web_search_calls:actionCount('search'),
    web_search_completed_calls:actions===null?null:actions.filter(item=>item.action?.type==='search'&&item.status==='completed').length,
    web_open_calls:actionCount('open_page'),web_find_calls:actionCount('find_in_page'),
    web_unknown_calls:actions===null?null:actions.filter(item=>!['search','open_page','find_in_page'].includes(item.action?.type)).length
  }
}
