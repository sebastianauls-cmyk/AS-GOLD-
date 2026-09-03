import assert from 'node:assert/strict'
import fs from 'node:fs'
const component=fs.readFileSync(new URL('../app/modules/cases/CaseCompletionPanels.js',import.meta.url),'utf8')
const caseDetail=fs.readFileSync(new URL('../app/modules/cases/CaseWorkspace.js',import.meta.url),'utf8')
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg']) assert.match(component,new RegExp(`\\b${language}:\\{`))
assert.match(component,/Jetzt erledigen/);assert.match(component,/data-v42-task/);assert.match(component,/ActionableGapsPanel/);assert.match(component,/Fall bearbeiten/);assert.match(component,/Dokument hinzufügen/);assert.match(component,/Dokument prüfen/);assert.match(component,/Bewertung ergänzen/);assert.match(component,/Abweichung prüfen/);assert.match(caseDetail,/CaseCompletionPanels/)
console.log('V80 actionable gaps guard passed against the version-neutral CaseWorkspace module.')
