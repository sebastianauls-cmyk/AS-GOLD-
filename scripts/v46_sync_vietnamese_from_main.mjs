import fs from 'node:fs'
import path from 'node:path'
import {execFileSync} from 'node:child_process'

const root=process.cwd()
const read=p=>fs.readFileSync(path.join(root,p),'utf8')
const write=(p,s)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s)}
const showMain=p=>execFileSync('git',['show',`origin/main:${p}`],{encoding:'utf8',maxBuffer:20*1024*1024})

const centralCopies=[
  ['app/lib/v71VietnamesePageTranslations.mjs','app/modules/language/v71VietnamesePageTranslations.mjs'],
  ['app/lib/v71VietnameseComponentTranslations.mjs','app/modules/language/v71VietnameseComponentTranslations.mjs'],
  ['app/lib/v35Languages.mjs','app/modules/language/v35Languages.mjs'],
  ['app/lib/v36Languages.mjs','app/modules/language/v36Languages.mjs'],
  ['app/lib/v35ComponentTranslations.mjs','app/modules/language/v35ComponentTranslations.mjs'],
  ['app/lib/v31PromoTranslations.mjs','app/modules/pricing/v31PromoTranslations.mjs'],
  ['app/lib/problemNavigatorLanguagesV36.mjs','app/modules/public/problemNavigatorLanguagesV36.mjs'],
  ['app/lib/v31LegalTranslations.mjs','app/modules/compliance/v31LegalTranslations.mjs'],
  ['app/lib/v31InteractiveLegalTranslations.mjs','app/modules/compliance/v31InteractiveLegalTranslations.mjs']
]
for(const [from,to] of centralCopies) write(to,showMain(from))

function skipQuoted(source,i){
  const quote=source[i]
  if(quote==='/'&&(source[i+1]==='/'||source[i+1]==='*')){
    if(source[i+1]==='/'){const n=source.indexOf('\n',i+2);return n<0?source.length:n}
    const n=source.indexOf('*/',i+2);return n<0?source.length:n+2
  }
  if(!['\'', '"','`'].includes(quote)) return i
  let j=i+1
  while(j<source.length){
    if(source[j]==='\\'){j+=2;continue}
    if(source[j]===quote) return j+1
    j++
  }
  return source.length
}
function findBalanced(source,openIndex){
  const pairs={'}':'{',']':'[',')':'('}
  const stack=[source[openIndex]]
  for(let i=openIndex+1;i<source.length;i++){
    const ch=source[i]
    if(ch==='\''||ch==='"'||ch==='`'||(ch==='/'&&(source[i+1]==='/'||source[i+1]==='*'))){i=skipQuoted(source,i)-1;continue}
    if(ch==='{'||ch==='['||ch==='(') stack.push(ch)
    else if(ch==='}'||ch===']'||ch===')'){
      if(pairs[ch]!==stack.at(-1)) continue
      stack.pop()
      if(!stack.length)return i
    }
  }
  throw new Error('unbalanced source object')
}
function objectRange(source,name){
  const re=new RegExp(`(?:export\\s+)?const\\s+${name.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')}\\s*=\\s*\\{`)
  const m=re.exec(source);if(!m)return null
  const open=source.indexOf('{',m.index+m[0].lastIndexOf('{'))
  return {open,close:findBalanced(source,open)}
}
function constObjectNames(source){
  const names=[]
  const re=/(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g
  let m
  while((m=re.exec(source)))names.push(m[1])
  return names
}
function topLevelProperty(source,range,key){
  const start=range.open+1,end=range.close
  let depth=0
  for(let i=start;i<end;i++){
    const ch=source[i]
    if(ch==='\''||ch==='"'||ch==='`'||(ch==='/'&&(source[i+1]==='/'||source[i+1]==='*'))){i=skipQuoted(source,i)-1;continue}
    if(ch==='{'||ch==='['||ch==='('){depth++;continue}
    if(ch==='}'||ch===']'||ch===')'){depth--;continue}
    if(depth!==0)continue
    if((i===start||source[i-1]===','||/\s/.test(source[i-1]))&&source.slice(i).match(new RegExp(`^${key}\\s*:`))){
      const colon=source.indexOf(':',i)
      let j=colon+1,nest=0
      for(;j<end;j++){
        const c=source[j]
        if(c==='\''||c==='"'||c==='`'||(c==='/'&&(source[j+1]==='/'||source[j+1]==='*'))){j=skipQuoted(source,j)-1;continue}
        if(c==='{'||c==='['||c==='(')nest++
        else if(c==='}'||c===']'||c===')')nest--
        else if(c===','&&nest===0)break
      }
      return source.slice(i,j).trim()
    }
  }
  return null
}
function syncViObjectMaps(targetSource,mainSource){
  for(const name of constObjectNames(mainSource)){
    const mr=objectRange(mainSource,name),tr=objectRange(targetSource,name)
    if(!mr||!tr)continue
    const vi=topLevelProperty(mainSource,mr,'vi')
    if(!vi||topLevelProperty(targetSource,tr,'vi'))continue
    const before=targetSource.slice(0,tr.close).replace(/\s*$/,'')
    const whitespace=targetSource.slice(before.length,tr.close)
    const needsComma=!before.endsWith(',')
    targetSource=before+(needsComma?',':'')+'\n  '+vi+whitespace+targetSource.slice(tr.close)
  }
  return targetSource
}
function findModuleTarget(baseName){
  const matches=[]
  function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name===baseName)matches.push(path.relative(root,full).replaceAll('\\','/'))}}
  walk(path.join(root,'app/modules'))
  return matches.length===1?matches[0]:matches.find(p=>!p.includes('/lib/'))||null
}

const legacyComponentNames=[
  'LanguageSwitcher.js','ExplainerVideo.js','LegalFooter.js','ProblemNavigator.js','ProductIntroCompact.js','PublicLanguageModules.js','TesterShareButton.js','V37FirstAction.js','V38AssessmentExplainability.js','V38DeadlineCardEnhancer.js','V38PrimaryNextStep.js','V39CaseTimelineAutoAssessment.js','V40ProfessionalHandoff.js','V41CaseConsistency.js','V42ActionableGaps.js','V44LanguageOrder.js','V45OutputLanguageBridge.js'
]
for(const baseName of legacyComponentNames){
  const target=findModuleTarget(baseName)
  if(!target)continue
  const mainPath=`app/components/${baseName}`
  let targetSource=read(target)
  const mainSource=showMain(mainPath)
  targetSource=syncViObjectMaps(targetSource,mainSource)
  write(target,targetSource)
}

// Vietnamese flag in the modular switcher.
{
  const p='app/modules/language/LanguageSwitcher.js';let s=read(p)
  s=s.replace(/import \{ ([^}]+) \} from 'country-flag-icons\/react\/3x2'/,(all,names)=>names.split(',').map(x=>x.trim()).includes('VN')?all:`import { ${names}, VN } from 'country-flag-icons/react/3x2'`)
  s=s.replace(/const flagComponents=\{([^}]+)\}/,(all,names)=>names.split(',').map(x=>x.trim()).includes('VN')?all:`const flagComponents={${names},VN}`)
  write(p,s)
}

// The header-owned lightweight explainer dialog also gets Vietnamese.
{
  const p='app/modules/language/ExplainerVideoDialog.js';let s=read(p)
  if(!/\bvi:/.test(s.split('const videoLanguages=')[0]))s=s.replace("  bg:'/videos/as-gold-v35-bg.mp4'","  bg:'/videos/as-gold-v35-bg.mp4',\n  vi:'https://resource2.heygen.ai/video_translate/c853c1c7508249c9933e9ecf2fa664c1-vi_vi-VN/original.mp4'")
  if(!s.includes("['vi','🇻🇳','Tiếng Việt']"))s=s.replace("['bg','🇧🇬','Български']","['bg','🇧🇬','Български'],['vi','🇻🇳','Tiếng Việt']")
  s=s.replace("bg:'Обяснително видео'}","bg:'Обяснително видео',vi:'Video giải thích'}")
  s=s.replace("bg:'Затвори'}","bg:'Затвори',vi:'Đóng'}")
  write(p,s)
}

// Ensure the active full explainer exposes Vietnamese in the selector, even though its object maps are synced above.
{
  const p='app/modules/public/ExplainerVideo.js';let s=read(p)
  if(!s.includes("['vi','🇻🇳','Tiếng Việt']"))s=s.replace("['ro','🇷🇴','Română'],['bg','🇧🇬','Български']","['ro','🇷🇴','Română'],['bg','🇧🇬','Български'],['vi','🇻🇳','Tiếng Việt']")
  write(p,s)
}

// Main's first-action map already contains Vietnamese; its separate heading did not yet, so preserve Vietnamese end-to-end here.
{
  const p='app/modules/public/V37FirstAction.js';let s=read(p)
  s=s.replace(/const startTitles=\{([^}]*)\}/,(all,body)=>/\bvi:/.test(body)?all:`const startTitles={${body},vi:'Bạn muốn bắt đầu như thế nào?'}`)
  write(p,s)
}

// Add the current main Vietnamese helper files to compatibility paths as thin re-exports, not duplicate implementations.
for(const [compat,target] of [
  ['app/lib/v71VietnamesePageTranslations.mjs','../modules/language/v71VietnamesePageTranslations.mjs'],
  ['app/lib/v71VietnameseComponentTranslations.mjs','../modules/language/v71VietnameseComponentTranslations.mjs']
]) write(compat,`export * from '${target}'\n`)

// Add a modular Vietnamese release guard and wire it into prebuild.
const testPath='scripts/test_v72_vietnamese_modular_coverage.mjs'
write(testPath,`import assert from 'node:assert/strict'\nimport fs from 'node:fs'\nimport {componentTranslations} from '../app/modules/language/v35ComponentTranslations.mjs'\nimport {localeForLanguage,outputLanguageNames,pageTranslations,supportedLanguages} from '../app/modules/language/v36Languages.mjs'\nimport {legalPageIds,legalShellCopy,legalTranslations} from '../app/modules/compliance/v31LegalTranslations.mjs'\nimport {privacyDashboardCopy,withdrawalCopy} from '../app/modules/compliance/v31InteractiveLegalTranslations.mjs'\nimport {problemLanguageProfiles} from '../app/modules/public/problemNavigatorLanguagesV36.mjs'\nimport {promoTranslations} from '../app/modules/pricing/v31PromoTranslations.mjs'\n\nconst expected=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']\nassert.deepEqual(supportedLanguages.map(item=>item.key),expected)\nassert.deepEqual(supportedLanguages.at(-1),{key:'vi',label:'Tiếng Việt',short:'VI',flags:'🇻🇳',countryCodes:['VN']})\nassert.equal(localeForLanguage.vi,'vi-VN')\nfor(const interfaceLanguage of expected){assert.ok(outputLanguageNames[interfaceLanguage]?.vi);assert.ok(outputLanguageNames.vi?.[interfaceLanguage])}\nfor(const [catalog,languages] of Object.entries(pageTranslations)){const value=languages.vi;assert.ok(typeof value==='string'?value.trim():value&&typeof value==='object'&&Object.keys(value).length,\`missing Vietnamese page catalog \${catalog}\`)}\nfor(const catalog of ['workspaceCopy','approvalCopy','analysisCopy','privacyCopy','aiControlCopy','passwordCopy']) assert.ok(Object.keys(componentTranslations[catalog]?.vi||{}).length,\`missing Vietnamese component catalog \${catalog}\`)\nassert.equal(problemLanguageProfiles.vi?.locale,'vi-VN');assert.equal(Object.keys(problemLanguageProfiles.vi?.cases||{}).length,8);assert.ok(promoTranslations.vi?.apply)\nassert.ok(legalShellCopy.vi);assert.ok(withdrawalCopy.vi);assert.ok(privacyDashboardCopy.vi);for(const pageId of legalPageIds)assert.ok(legalTranslations.vi?.[pageId]?.title,\`missing Vietnamese legal page \${pageId}\`)\nconst active=[\n  'app/modules/language/LanguageSwitcher.js','app/modules/language/ExplainerVideoDialog.js','app/modules/public/ExplainerVideo.js','app/modules/public/ProblemNavigator.js','app/modules/public/ProductIntroCompact.js','app/modules/public/PublicLanguageModules.js','app/modules/public/V37FirstAction.js'\n]\nfor(const p of active)assert.match(fs.readFileSync(p,'utf8'),/\\bvi:|\\['vi'|['\"]vi['\"]/,\`active module lacks Vietnamese: \${p}\`)\nconst switcher=fs.readFileSync('app/modules/language/LanguageSwitcher.js','utf8');assert.match(switcher,/\\bVN\\b/)\nconst explainer=fs.readFileSync('app/modules/public/ExplainerVideo.js','utf8');assert.match(explainer,/c853c1c7508249c9933e9ecf2fa664c1-vi_vi-VN/);assert.match(explainer,/d61639497f924841be3bdf8058881470-vi_vi-VN/)\nconst dialog=fs.readFileSync('app/modules/language/ExplainerVideoDialog.js','utf8');assert.match(dialog,/Tiếng Việt/);assert.match(dialog,/c853c1c7508249c9933e9ecf2fa664c1-vi_vi-VN/)\nconsole.log('V72 modular Vietnamese coverage passed: 11 languages, output labels, workspace/page catalogs, legal controls, problem navigation, pricing and both active explainer paths include Vietnamese.')\n`)

const packagePath='package.json'
const pkg=JSON.parse(read(packagePath))
pkg.scripts['test:v72-vietnamese']='node scripts/test_v72_vietnamese_modular_coverage.mjs'
if(!pkg.scripts.prebuild.includes('test:v72-vietnamese'))pkg.scripts.prebuild+=' && npm run test:v72-vietnamese'
write(packagePath,JSON.stringify(pkg,null,2)+'\n')

console.log('V46 synchronized the latest main Vietnamese capability into modular domain ownership without restoring legacy DOM enhancers.')
