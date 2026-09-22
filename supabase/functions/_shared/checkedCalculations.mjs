// Exact decimal arithmetic. Model expressions are parsed, never executed as code.
const fail=message=>{throw new Error(message)}
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a
function rational(n,d=1n){if(n.toString().length>256||d.toString().length>256)fail('Rechenwert ist zu groß.');if(!d)fail('Division durch null.');if(d<0n){n=-n;d=-d}const g=gcd(n,d)||1n;return {n:n/g,d:d/g}}
function decimal(value){
  if(!/^-?\d{1,16}(?:\.\d{1,8})?$/.test(String(value)))fail('Ungültiger Rechenwert: '+value)
  const [whole,fraction='']=String(value).split('.'),negative=whole.startsWith('-')
  return rational(BigInt(whole.replace('-','')+fraction)*(negative?-1n:1n),10n**BigInt(fraction.length))
}
const compare=(a,b)=>a.n*b.d-b.n*a.d
function rounded(value,places){
  if(!Number.isInteger(places)||places<0||places>8)fail('Ungültige Rundung.')
  const scale=10n**BigInt(places),negative=value.n<0n,absolute=(negative?-value.n:value.n)*scale
  const cents=absolute/value.d+(absolute%value.d*2n>=value.d?1n:0n)
  const digits=cents.toString().padStart(places+1,'0')
  return (negative&&cents?'-':'')+(places?digits.slice(0,-places)+'.'+digits.slice(-places):digits)
}
export function calculateExpression(expression,variables={},places=2){
  if(typeof expression!=='string'||expression.length>1000)fail('Rechenweg fehlt oder ist zu lang.')
  const tokens=expression.match(/[a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|[()+*/^,\-]/g)||[]
  if(tokens.join('')!==expression.replace(/\s/g,'')||tokens.length>200)fail('Nicht erlaubter Rechenweg.')
  let at=0,depth=0
  const peek=()=>tokens[at],take=()=>tokens[at++]
  function atom(){
    if(++depth>30)fail('Rechenweg zu tief verschachtelt.')
    let result,token=take()
    if(token==='-'){result=atom();result=rational(-result.n,result.d)}
    else if(token==='+')result=atom()
    else if(token==='('){result=sum();if(take()!==')')fail('Klammer fehlt.')}
    else if(/^\d/.test(token||'')){
      // Nontrivial constants (rates, divisors, thresholds, periods) need a named,
      // sourced input. 0 and 1 are arithmetic identities, not case assumptions.
      if(!['0','1'].includes(token))fail('Zahl '+token+' als belegten Eingabewert angeben.')
      result=decimal(token)
    }else if(['min','max','round','floor','percent'].includes(token)&&peek()==='('){
      take();const args=[sum()]
      while(peek()===','){
        take()
        // A lone round precision is an operator setting, not a sourced amount.
        // rounded() still restricts it to an integer between zero and eight.
        args.push(token==='round'&&args.length===1&&/^\d/.test(peek()||'')&&tokens[at+1]===')'?decimal(take()):sum())
      }
      if(take()!==')')fail('Klammer fehlt.')
      if(['min','max'].includes(token)&&args.length>=2&&args.length<=8)result=args.reduce((a,b)=>(compare(a,b)<0n)===(token==='min')?a:b)
      else if(token==='floor'&&args.length===1){const a=args[0];result=rational(a.n/a.d-(a.n<0n&&a.n%a.d?1n:0n))}
      else if(token==='percent'&&args.length===1)result=rational(args[0].n,args[0].d*100n)
      else if(token==='round'&&args.length===2&&args[1].d===1n)result=decimal(rounded(args[0],Number(args[1].n)))
      else fail('Ungültige Rechenfunktion.')
    }else if(Object.hasOwn(variables,token))result=decimal(variables[token])
    else fail('Unbekannter Rechenwert: '+token)
    depth--;return result
  }
  function power(){
    let a=atom()
    if(peek()==='^'){
      take();let b
      // ^2 is exactly the already-permitted x*x operation. Higher exponents
      // (potential periods) and every ordinary numeric input remain sourced.
      if(peek()==='2')b=decimal(take())
      else if(peek()==='('&&tokens[at+1]==='2'&&tokens[at+2]===')'){at+=3;b=decimal('2')}
      else b=atom()
      if(b.d!==1n||b.n<0n||b.n>4n)fail('Ungültige Potenz.')
      a=rational(a.n**b.n,a.d**b.n)
    }
    return a
  }
  function product(){let a=power();while(['*','/'].includes(peek())){const op=take(),b=power();a=op==='*'?rational(a.n*b.n,a.d*b.d):rational(a.n*b.d,a.d*b.n)}return a}
  function sum(){let a=product();while(['+','-'].includes(peek())){const op=take(),b=product();a=rational(a.n*b.d+(op==='+'?1n:-1n)*b.n*a.d,a.d*b.d)}return a}
  const result=sum();if(at!==tokens.length)fail('Unvollständiger Rechenweg.')
  return rounded(result,places)
}

function quotedNumberLiterals(quote){
  const text=String(quote)
  // Whitespace can separate table cells or group thousands. Read complete
  // numeric tokens first, then join only valid three-digit grouping blocks.
  const tokens=[...text.matchAll(/(?<![\p{L}\p{N}.,’'+−-])[-−+]?\d(?:[\d.,’']*\d)?(?![\p{L}\p{N}]|[.,’']\d)/gu)]
  const literals=[]
  for(let i=0;i<tokens.length;i++){
    let raw=tokens[i][0],end=tokens[i].index+raw.length
    if(/^[-−+]?\d{1,3}$/.test(raw)){
      while(i+1<tokens.length){
        const next=tokens[i+1]
        if(!/^[ \u00a0\u202f]+$/.test(text.slice(end,next.index))||!/^\d{3}(?:[.,]\d+)?$/.test(next[0]))break
        raw+=next[0];end=next.index+next[0].length;i++
        if(/[.,]/.test(next[0]))break
      }
    }
    literals.push(raw.replace(/^\+/,''))
  }
  return literals
}

// A number must actually occur in its cited passage. Locale grouping is handled
// explicitly; semantic role, unit, period and legal applicability are reviewed.
export function quoteContainsNumber(quote,value){
  const expected=decimal(value)
  // Statutes commonly spell a small factor out ("ein Fünftel", "fünffach").
  // This verifies the value only; its role in the formula still needs review.
  const words={2:['zwei','beide','beiden','beider','beidem','beides','zweifach','halb','hälfte','halftig','hälftig','two','both','half'],3:['drei','dreifach','drittel','three','third'],4:['vier','vierfach','viertel','four','quarter'],5:['fünf','fünffach','fünftel','fünftels','fünffache','fünffachen','five','fifth'],6:['sechs','six'],12:['zwölf','twelve'],100:['hundert','einhundert','hundertstel','hundertstels','einhundertstel','einhundertstels','hundred'],120:['einhundertzwanzig','hundertzwanzig','einhundertzwanzigstel','einhundertzwanzigstels','hundertzwanzigstel','hundertzwanzigstels'],1000:['tausend','eintausend','tausendstel','tausendstels','eintausendstel','eintausendstels'],10000:['zehntausend','zehntausendstel','zehntausendstels']}
  for(const [number,names] of Object.entries(words))if(compare(decimal(number),expected)===0n&&new RegExp(`(?<![\\p{L}\\p{N}])(?:${names.join('|')})(?![\\p{L}\\p{N}])`,'iu').test(String(quote)))return true
  const parts=quotedNumberLiterals(quote)
  return parts.some(part=>{
    const raw=part.replace(/[’'\u00a0\u202f ]/g,'').replace('−','-')
    const formats=[raw]
    if(/^[-]?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(raw))formats.push(raw.replaceAll('.','').replace(',','.'))
    if(/^[-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(raw))formats.push(raw.replaceAll(',',''))
    if(/^[-]?\d+,\d+$/.test(raw))formats.push(raw.replace(',','.'))
    return formats.some(form=>{try{return compare(decimal(form),expected)===0n}catch{return false}})
  })
}
