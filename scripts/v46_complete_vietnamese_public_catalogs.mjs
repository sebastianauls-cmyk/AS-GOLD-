import fs from 'node:fs'
import {execFileSync} from 'node:child_process'

const showMain=p=>execFileSync('git',['show',`origin/main:${p}`],{encoding:'utf8',maxBuffer:10*1024*1024})
fs.writeFileSync('app/modules/public/asGoldIntroCopy.mjs',showMain('app/lib/asGoldIntroCopy.mjs'))

const testPath='scripts/test_v72_vietnamese_modular_coverage.mjs'
let test=fs.readFileSync(testPath,'utf8')
if(!test.includes("howAsGoldWorksCopy"))test=test.replace(
  "import {promoTranslations} from '../app/modules/pricing/v31PromoTranslations.mjs'",
  "import {promoTranslations} from '../app/modules/pricing/v31PromoTranslations.mjs'\nimport {howAsGoldWorksCopy} from '../app/modules/public/asGoldIntroCopy.mjs'"
)
test=test.replace(
  "assert.equal(problemLanguageProfiles.vi?.locale,'vi-VN');assert.equal(Object.keys(problemLanguageProfiles.vi?.cases||{}).length,8);assert.ok(promoTranslations.vi?.apply)",
  "assert.equal(problemLanguageProfiles.vi?.locale,'vi-VN');assert.equal(Object.keys(problemLanguageProfiles.vi?.cases||{}).length,8);assert.ok(promoTranslations.vi?.apply);assert.ok(howAsGoldWorksCopy.vi?.title);assert.equal(howAsGoldWorksCopy.vi?.items?.length,4)"
)
test=test.replace("'app/modules/public/ProblemNavigator.js','app/modules/public/ProductIntroCompact.js','app/modules/public/PublicLanguageModules.js','app/modules/public/V37FirstAction.js'","'app/modules/public/ProblemNavigator.js','app/modules/public/V37FirstAction.js'")
fs.writeFileSync(testPath,test)
console.log('V46 Vietnamese public intro catalog synchronized; indirect presentation modules are verified through their owning catalogs instead of duplicated inline keys.')
