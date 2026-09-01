import assert from 'node:assert/strict'
import fs from 'node:fs'
import { caseFrequencyWeight, caseOrder, orderCasesByResearch, researchedCaseVolumes } from '../app/lib/casePriorityV56.mjs'

assert.deepEqual(caseOrder,['work','contract','authority','property','insurance','business','dispute','private'])
assert.equal(caseOrder.indexOf('insurance'),4,'insurance must not be case 1')
assert.ok(researchedCaseVolumes.work>researchedCaseVolumes.insurance)
assert.ok(researchedCaseVolumes.contract>researchedCaseVolumes.insurance)
assert.ok(researchedCaseVolumes.authority>researchedCaseVolumes.insurance)
assert.ok(researchedCaseVolumes.property>researchedCaseVolumes.insurance)
assert.ok(caseFrequencyWeight.work>caseFrequencyWeight.insurance)

const shuffled=caseOrder.map(key=>({key})).reverse()
assert.deepEqual(orderCasesByResearch(shuffled).map(item=>item.key),caseOrder)

const page=fs.readFileSync(new URL('../app/page.js',import.meta.url),'utf8')
const navigator=fs.readFileSync(new URL('../app/components/ProblemNavigator.js',import.meta.url),'utf8')
assert.match(page,/orderCasesByResearch\(cd\.cases\)/)
assert.match(page,/useState\('work'\)/)
assert.match(navigator,/count\*1000/)
assert.match(navigator,/caseFrequencyWeight/)

console.log('V56 evidence-based case priority checks passed')
