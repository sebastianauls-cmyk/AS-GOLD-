import fs from 'node:fs'

const path='scripts/test_v38_synthetic_full_flow.mjs'
let source=fs.readFileSync(path,'utf8')
const old=`const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')\nfor(const component of ['V38DeadlineCardEnhancer','V38AssessmentExplainability','V38PrimaryNextStep']) assert.match(layout,new RegExp(component))`
const next=`const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')\nconst directCases=fs.readFileSync(new URL('../app/modules/cases/V24Workspace.js',import.meta.url),'utf8')\nassert.doesNotMatch(layout,/V38DeadlineCardEnhancer/)\nassert.match(directCases,/DeadlineWarningCard/)\nfor(const component of ['V38AssessmentExplainability','V38PrimaryNextStep']) assert.match(layout,new RegExp(component))`
if(source.includes(old)) source=source.replace(old,next)
else if(!source.includes('assert.doesNotMatch(layout,/V38DeadlineCardEnhancer/)')) throw new Error('synthetic V38 layout assertion anchor missing')
source=source.replace("console.log('✓ V38 UI layers mounted and PDF/DOCX/XLSX/PPTX export code paths present')","console.log('✓ V38 deadline UI is directly composed, remaining V38 UI layers are mounted, and PDF/DOCX/XLSX/PPTX export code paths are present')")
fs.writeFileSync(path,source)
console.log('V38 synthetic guard aligned with direct deadline composition')
