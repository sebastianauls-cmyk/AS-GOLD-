import fs from 'node:fs'

function patch(path,replacements){
  let s=fs.readFileSync(path,'utf8')
  for(const [from,to] of replacements){
    if(!s.includes(from)) throw new Error(`Missing guard sync anchor in ${path}: ${from.slice(0,90)}`)
    s=s.replace(from,to)
  }
  fs.writeFileSync(path,s)
}

patch('scripts/test_v35_languages.mjs',[
  ["const heroSource=await readFile(new URL('../app/modules/public/HeroTitleStabilizer.js',import.meta.url),'utf8')", "const heroSource=await readFile(new URL('../app/modules/public/HeroTitleStabilizer.js',import.meta.url),'utf8')\nconst introCopySource=await readFile(new URL('../app/modules/public/asGoldIntroCopy.mjs',import.meta.url),'utf8')"],
  ["assert.match(heroSource,/\\bro:\\{title:/);assert.match(heroSource,/\\bbg:\\{title:/);assert.match(heroCompatibility,/modules\\/public\\/HeroTitleStabilizer/)", "assert.match(heroSource,/whatIsAsGoldCopy/);assert.match(introCopySource,/\\bro:\\{title:/);assert.match(introCopySource,/\\bbg:\\{title:/);assert.match(heroCompatibility,/modules\\/public\\/HeroTitleStabilizer/)"],
  ["assert.match(introSource,/\\bro:\\{/);assert.match(introSource,/\\bbg:\\{/);assert.match(introCompatibility,/modules\\/public\\/ProductIntroCompact/)", "assert.match(introSource,/howAsGoldWorksCopy/);assert.match(introCopySource,/\\bro:\\{title:/);assert.match(introCopySource,/\\bbg:\\{title:/);assert.match(introCompatibility,/modules\\/public\\/ProductIntroCompact/)"],
])

patch('scripts/test_v37_first_action.mjs',[
  ["if(!publicLanding.includes('customerModule={customerModule}')||!languageModules.includes('{customerModule}')) throw new Error('V37 guard: customer navigator must be directly nested in the output-language module')", "if(publicLanding.includes('customerModule={customerModule}')||languageModules.includes('{customerModule}')||languageModules.includes('asgold-customer-module-slot')) throw new Error('V37 guard: customer navigator must be owned directly by PublicLanding')"],
  ["const firstActionIndex=publicLanding.indexOf('<V37FirstAction language={language}')\nconst videoIndex=publicLanding.indexOf('<ExplainerVideo key={`${language}-${explainerSignal}`} language={language} openSignal={explainerSignal}/>')\nconst productIndex=publicLanding.indexOf('<ProductIntroCompact language={language}/>')\nif(!(firstActionIndex>=0 && videoIndex>firstActionIndex && productIndex>videoIndex)) throw new Error('V37 guard: hero priority order must be first action -> optional video -> product details, with the customer navigator directly above in the output-language module')", "const productIndex=publicLanding.indexOf('<ProductIntroCompact language={outputLanguage}/>')\nconst firstActionIndex=publicLanding.indexOf('<V37FirstAction language={outputLanguage}')\nconst problemIndex=publicLanding.indexOf('<ProblemNavigator outputLanguage={outputLanguage}')\nconst videoIndex=publicLanding.indexOf('<ExplainerVideo key=')\nif(!(productIndex>=0 && firstActionIndex>productIndex && problemIndex>firstActionIndex && videoIndex>problemIndex)) throw new Error('V37 guard: hero priority order must be explanation -> first action -> problem input -> optional video')"],
])

patch('scripts/test_v37_product_reife.mjs',[
  ["need(publicLanding,'<V37FirstAction language={language} onRegister={()=>setScreen(\\'register\\')}/>','first action registration callback')", "need(publicLanding,'<V37FirstAction language={outputLanguage}','first action customer-language callback')\nneed(publicLanding,'onRegister={()=>setScreen(\\'register\\')}','first action registration callback')\nneed(publicLanding,'onSpeakProblem={()=>setProblemVoiceSignal','direct voice callback')"],
])

patch('scripts/test_v46_modular_boundaries.mjs',[
  ["assert.match(publicLanguageModules,/customerModuleSlot/)\nassert.match(publicLanguageModules,/\\{customerModule\\}/)", "assert.doesNotMatch(publicLanguageModules,/customerModuleSlot|\\{customerModule\\}/)\nassert.match(publicLanding,/<ProblemNavigator outputLanguage=\\{outputLanguage\\}/)"],
  ["assert.match(publicLanguageModules,/returnToStart/)", "assert.match(publicLanguageModules,/returnToGerman/)\nassert.match(publicLanguageModules,/onLanguageChange\\('de'\\)/)\nassert.match(publicLanguageModules,/onOutputLanguageChange\\('de'\\)/)"],
  ["assert.match(publicLanguageModules,/customerModuleSlot/)", "assert.doesNotMatch(publicLanguageModules,/customerModuleSlot/)"],
  ["assert.match(currentCss,/\\.customerModuleSlot\\{/)", "assert.match(currentCss,/\\.publicWelcome\\{/)"]
])

patch('scripts/test_v56_modular_parity.mjs',[
  ["assert.match(languageModules,/id=\"asgold-customer-module-slot\"/)\nassert.match(languageModules,/className=\"customerModuleSlot\"/)\nassert.match(languageModules,/\\{customerModule\\}/)", "assert.doesNotMatch(languageModules,/asgold-customer-module-slot|customerModuleSlot|\\{customerModule\\}/)\nassert.match(languageModules,/returnToGerman/)\nassert.match(languageModules,/Back to German \\/ Zurück zu Deutsch/)"],
  ["assert.match(landing,/customerModule=\\{customerModule\\}/)\nassert.match(landing,/ProblemNavigator outputLanguage=\\{outputLanguage\\}/)\nassert.match(landing,/className=\"secondary heroVoiceShortcut\"/)", "assert.doesNotMatch(landing,/customerModule=\\{customerModule\\}/)\nassert.match(landing,/ProblemNavigator outputLanguage=\\{outputLanguage\\}/)\nassert.match(landing,/onSpeakProblem=\\{\\(\\)=>setProblemVoiceSignal/)"] ,
  ["assert.match(workspace,/orderCasesByResearch\\(cd\\.cases\\)/)", "assert.match(workspace,/orderCasesByResearch\\(publicCd\\.cases\\)/)"],
  ["assert.match(css,/\\.customerModuleSlot\\{/)", "assert.match(css,/\\.publicWelcome\\{/)"]
])

console.log('V46/V69 legacy modular guards synced to direct public ownership.')
