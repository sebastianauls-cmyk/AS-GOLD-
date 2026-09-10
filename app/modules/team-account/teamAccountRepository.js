function repositoryError(code,message='Team account request failed'){
  return {code,message}
}

export async function signInTeamAccount(supabase,{password}){
  try{
    const response=await fetch('/api/team-account/login',{
      method:'POST',
      headers:{'content-type':'application/json'},
      cache:'no-store',
      body:JSON.stringify({password})
    })
    const payload=await response.json().catch(()=>({}))
    if(!response.ok){
      return {data:{session:null},error:repositoryError(payload.code||'team_login_failed')}
    }
    const {data,error}=await supabase.auth.setSession({
      access_token:payload.accessToken,
      refresh_token:payload.refreshToken
    })
    return {data,error}
  }catch{
    return {data:{session:null},error:repositoryError('team_login_unavailable')}
  }
}
