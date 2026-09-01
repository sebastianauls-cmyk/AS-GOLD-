import fs from 'node:fs'

const path='scripts/test_v46_modular_boundaries.mjs'
let source=fs.readFileSync(path,'utf8')

function replaceOnce(oldValue,newValue,label){
  if(source.includes(newValue)) return
  if(!source.includes(oldValue)) throw new Error(`V46 public guard anchor missing: ${label}`)
  source=source.replace(oldValue,newValue)
}

replaceOnce(
  "const publicLanding=read('app/modules/public/PublicLanding.js')\nassert.match(publicLanding,/className=\"publicTop\"/)",
  "const publicLanding=read('app/modules/public/PublicLanding.js')\nconst publicHeader=read('app/modules/public/PublicHeader.js')\nconst publicCaseDiscovery=read('app/modules/public/PublicCaseDiscoverySection.js')\nconst publicPricing=read('app/modules/public/PublicPricingSection.js')\nassert.match(publicHeader,/className=\"publicTop\"/)",
  'public header ownership'
)
replaceOnce(
  "assert.match(publicLanding,/id=\"preise\"/)\nassert.match(publicLanding,/PublicLanguageModules/)",
  "assert.match(publicPricing,/id=\"preise\"/)\nassert.match(publicHeader,/PublicLanguageModules/)",
  'pricing and language ownership'
)
replaceOnce(
  "assert.match(publicLanding,/<ProblemNavigator outputLanguage=\\{outputLanguage\\}/)",
  "assert.match(publicLanding,/<ProblemNavigator[^>]*outputLanguage=\\{outputLanguage\\}/)",
  'problem navigator direct rendering'
)
replaceOnce(
  "assert.match(publicLanding,/id=\\\"asgold-user-audience\\\"/,'audience content must be direct React markup')\nassert.match(publicLanding,/jumpToPublicCaseResult\\(\\)/,'case selection must trigger direct React-owned navigation')",
  "assert.match(publicCaseDiscovery,/id=\\\"asgold-user-audience\\\"/,'audience content must be direct React markup in its owning section')\nassert.match(publicCaseDiscovery,/jumpToPublicCaseResult\\(\\)/,'case selection must trigger direct React-owned navigation in its owning section')",
  'case discovery ownership'
)

for(const [name,text] of Object.entries({PublicHeader:publicHeaderMarker(),PublicCaseDiscoverySection:publicCaseMarker(),PublicPricingSection:publicPricingMarker()})){
  if(!source.includes(text)) throw new Error(`V46 modular guard missing explicit ${name} ownership assertion`)
}

fs.writeFileSync(path,source)
console.log('V46 aligned public modular guard with direct component ownership.')

function publicHeaderMarker(){return "assert.match(publicHeader,/className=\\\"publicTop\\\"/)"}
function publicCaseMarker(){return "assert.match(publicCaseDiscovery,/id=\\\\\\\"asgold-user-audience\\\\\\\"/,'audience content must be direct React markup in its owning section')"}
function publicPricingMarker(){return "assert.match(publicPricing,/id=\\\"preise\\\"/)"}
