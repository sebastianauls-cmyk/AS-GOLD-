// Each unresolved question has an explicit collection and assessment step.
// These links do not prove relevance, source support or a completed action.
// Independent review still checks the question, recipient and chosen steps.
export const QUESTION_ACTION_RULES='For EVERY open question, select collect_step_id (the existing step that obtains the information from who) and check_step_id (the existing step that records and assesses the answer). A single step may do both. Otherwise the check must follow and depend on collection, directly or transitively. Choose the actual suitable steps; do not link everything to an unrelated generic step. The server renders the complete question verbatim in both assigned action checklists. These generated checklist entries are part of the customer action and its exports; the base action prose must not contradict them or claim that its own list is exhaustive. Keep questions case-specific and material. Independent review checks the mapping and semantic completeness against all originals and findings; links alone do not establish either. Correction must preserve or update both linked actions together with the question, without another correction round.'

export function validateQuestionActionCoverage(candidate){
  const questions=candidate.open_questions
  const steps=candidate.steps||[]
  const indexes=new Map(steps.map((step,index)=>[step.id,index]))
  const issues=[]
  if(!Array.isArray(questions))issues.push({code:'meaning',location:'open_questions',reason:'Die offenen Fragen fehlen.'})
  for(const [index,question] of (Array.isArray(questions)?questions:[]).entries()){
    const location=`open_questions[${index}]`
    const reject=reason=>issues.push({code:'meaning',location,reason})
    if(!question||['question','who','why'].some(key=>typeof question[key]!=='string'||!question[key].trim())){
      reject('Die offene Frage muss Inhalt, Auskunftsperson und Klärungsgrund nennen.');continue
    }
    const collect=indexes.get(question.collect_step_id),check=indexes.get(question.check_step_id)
    if(collect===undefined||check===undefined){reject('Für die offene Frage fehlt ein vorhandener Schritt zum Einholen oder Prüfen der Antwort.');continue}
    if(check<collect){reject('Die Antwort darf nicht vor dem Einholen geprüft werden.');continue}
    if(check===collect)continue
    const ancestors=new Set(),pending=[...(steps[check].depends_on||[])]
    while(pending.length){
      const id=pending.pop()
      if(ancestors.has(id))continue
      ancestors.add(id)
      const parent=steps[indexes.get(id)]
      if(parent)pending.push(...(parent.depends_on||[]))
    }
    if(!ancestors.has(question.collect_step_id))reject('Der Prüfschritt muss von der vorherigen Informationsbeschaffung abhängen.')
  }
  if(issues.length)throw Object.assign(new Error('Die offenen Fragen sind noch nicht vollständig mit ihren Aufgaben verbunden.'),{analysisIssues:issues})
  return candidate
}

const labels={
  de:['Einholen bei','Antwort prüfen'],en:['Obtain from','Review the answer'],fr:['Obtenir auprès de','Vérifier la réponse'],
  tr:['Bilgiyi alın','Yanıtı kontrol edin'],pl:['Uzyskać od','Sprawdzić odpowiedź'],ru:['Получить у','Проверить ответ'],
  ar:['الحصول على المعلومات من','مراجعة الإجابة'],fa:['دریافت اطلاعات از','بررسی پاسخ'],ro:['Obțineți de la','Verificați răspunsul'],
  bg:['Получете от','Проверете отговора'],vi:['Lấy thông tin từ','Kiểm tra câu trả lời']
}

// One presentation function is shared by review, UI and Word/PDF block export.
// It never edits the stored base action or infers links for historical records.
export function questionActionStep(step,questions=[],language='de'){
  const [collectLabel,checkLabel]=labels[language]||labels.de
  const tasks=[]
  for(const question of questions){
    if(question.collect_step_id===step.id)tasks.push(`${collectLabel} ${question.who}: ${question.question}`)
    if(question.check_step_id===step.id)tasks.push(`${checkLabel}: ${question.question}`)
  }
  return tasks.length?{...step,action:[step.action,...tasks].join('\n\n')}:step
}
