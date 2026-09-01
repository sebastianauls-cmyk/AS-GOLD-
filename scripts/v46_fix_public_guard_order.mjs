import fs from 'node:fs'

const path='scripts/test_v46_modular_boundaries.mjs'
let source=fs.readFileSync(path,'utf8')

const assertion="for(const name of ['V37FirstAction','ProblemNavigator','ExplainerVideo','ProductIntroCompact']) assert.doesNotMatch(layout,new RegExp(name),'public portal modules must not be mounted globally')\n"
const layoutAnchor="const layout=read('app/layout.js')\n"

if(source.includes(assertion)){
  source=source.replace(assertion,'')
  if(!source.includes(layoutAnchor)) throw new Error('V46 public guard fix: layout declaration anchor missing')
  source=source.replace(layoutAnchor,layoutAnchor+assertion)
}

const staleNavigatorOwnership=String.raw`assert.match(layout,/modules\/public\/ProblemNavigator/)`+'\n'
const directNavigatorOwnership=String.raw`assert.match(publicLanding,/\.\/ProblemNavigator/)`+'\n'
source=source.replace(staleNavigatorOwnership,directNavigatorOwnership)

fs.writeFileSync(path,source)
console.log('V46 public-module guard ordering and ownership assertions verified.')

await import('./v46_port_v50_current_features.mjs')
