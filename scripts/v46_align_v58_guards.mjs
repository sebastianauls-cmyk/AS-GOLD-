import fs from 'node:fs'

const path='scripts/test_v46_modular_boundaries.mjs'
let text=fs.readFileSync(path,'utf8')
const from=`assert.match(publicLanding,/id="preise"/)\nassert.match(publicLanding,/\\.\\.\\/language\\/LanguageSwitcher/)\nassert.match(publicLanding,/\\.\\.\\/compliance\\/LegalFooter/)\nconst publicStart=publicLanding.indexOf('return <>')\nconst interfaceControl=publicLanding.indexOf('<LanguageSwitcher value={language} onChange={setLanguage} label={t.language} publicPicker',publicStart)\nconst outputControl=publicLanding.indexOf('<LanguageSwitcher value={outputLanguage} onChange={setOutputLanguage} label={t.outputLanguage}/>',publicStart)\nassert.ok(publicStart>=0,'public landing must render a React fragment')\nassert.ok(interfaceControl>publicStart,'interface language control must exist on public landing')\nassert.ok(outputControl>interfaceControl,'output language must follow interface language in natural source order')`
const to=`assert.match(publicLanding,/id="preise"/)\nassert.match(publicLanding,/PublicLanguageModules/)\nassert.match(publicLanding,/\\.\\.\\/compliance\\/LegalFooter/)\nconst publicLanguageModules=read('app/modules/public/PublicLanguageModules.js')\nconst publicStart=publicLanding.indexOf('return <>')\nconst interfaceControl=publicLanguageModules.indexOf('<LanguageSwitcher value={language} onChange={onLanguageChange}')\nconst outputControl=publicLanguageModules.indexOf('<LanguageSwitcher value={outputLanguage} onChange={onOutputLanguageChange}')\nassert.ok(publicStart>=0,'public landing must render a React fragment')\nassert.ok(interfaceControl>=0,'interface language control must exist in the owning public language module')\nassert.ok(outputControl>interfaceControl,'output language must follow interface language in natural source order')\nassert.match(publicLanguageModules,/customerModuleSlot/)\nassert.match(publicLanguageModules,/\\{customerModule\\}/)\nassert.doesNotMatch(publicLanguageModules,/createPortal|MutationObserver|document\\.createElement/)`
if(text.includes(from)) text=text.replace(from,to)
else if(!text.includes("const publicLanguageModules=read('app/modules/public/PublicLanguageModules.js')")) throw new Error('V58 guard alignment target not found')

const v50Replacement=`// V58 current-behavior guard\nassert.match(publicLanding,/PublicLanguageModules/)\nassert.match(publicLanding,/data-output-language-status/)\nassert.match(publicLanguageModules,/publicBackButton/)\nassert.match(publicLanguageModules,/returnToStart/)\nassert.match(publicLanguageModules,/outputLanguageStatus/)\nassert.match(publicLanguageModules,/customerModuleSlot/)\nassert.match(switcher,/publicPicker=false/)\nassert.match(switcher,/active\\.label/)\nassert.match(switcher,/flagLanguageMenuBack/)\nconst currentCss=read('app/globals.css')\nassert.match(currentCss,/\\.publicLanguageModules/)\nassert.match(currentCss,/\\.customerModuleSlot/)\nassert.match(currentCss,/\\.flagLanguageMenu \\.flagLanguageMenuBack/)\nconst currentMicrophone=`
if(text.includes('// V50 current-behavior guard')){
  text=text.replace(/\/\/ V50 current-behavior guard[\s\S]*?const currentMicrophone=/,v50Replacement)
}else if(!text.includes('// V58 current-behavior guard')){
  throw new Error('V58 current-behavior guard target not found')
}

fs.writeFileSync(path,text)
console.log('V58 modular-boundary language and current-behavior guards aligned')
