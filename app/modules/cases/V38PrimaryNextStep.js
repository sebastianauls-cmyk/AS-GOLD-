'use client'

import { prioritizeNextStep } from '../lib/v38NextStepEngine.mjs'
import { analyzeDeadlines } from '../lib/v38DeadlineIntelligence.mjs'
import { deadlineWarningLabels } from './V38DeadlineCardEnhancer'

export const primaryNextStepLabels={
  de:{title:'Ihr nächster Schritt',why:'Warum jetzt?',when:'Wann?',action:'Jetzt tun'},
  en:{title:'Your next step',why:'Why now?',when:'When?',action:'Do now'},
  fr:{title:'Votre prochaine étape',why:'Pourquoi maintenant ?',when:'Quand ?',action:'À faire maintenant'},
  tr:{title:'Sonraki adımınız',why:'Neden şimdi?',when:'Ne zaman?',action:'Şimdi yapılacak'},
  pl:{title:'Twój następny krok',why:'Dlaczego teraz?',when:'Kiedy?',action:'Co zrobić teraz'},
  ru:{title:'Ваш следующий шаг',why:'Почему сейчас?',when:'Когда?',action:'Что сделать сейчас'},
  ar:{title:'خطوتك التالية',why:'لماذا الآن؟',when:'متى؟',action:'ما يجب فعله الآن'},
  fa:{title:'گام بعدی شما',why:'چرا اکنون؟',when:'چه زمانی؟',action:'اقدام فعلی'},
  ro:{title:'Următorul pas',why:'De ce acum?',when:'Când?',action:'Ce trebuie făcut acum'},
  bg:{title:'Следващата ви стъпка',why:'Защо сега?',when:'Кога?',action:'Какво да направите сега'}
}

export function PrimaryNextStepCard({language='de',item,documents=[],assessments=[]}){
  const t=primaryNextStepLabels[language]||primaryNextStepLabels.de
  const deadlineCopy=deadlineWarningLabels[language]||deadlineWarningLabels.de
  const deadline=analyzeDeadlines({caseDeadline:item?.deadline_at||''})
  const result=prioritizeNextStep({
    language,
    missing:!documents.length,
    deadlineStatus:deadline.status,
    deadlineAction:deadline.primary?deadlineCopy.verify:'',
    assessments:assessments.map(entry=>({traffic:entry.traffic_light||'yellow',next:entry.next_step||''})),
    caseNext:item?.next_action||''
  })
  return <section className="detailCard v38PrimaryNextStep" data-v38-primary-next-step="true" style={{border:'2px solid #b89242',background:'linear-gradient(135deg,#fffaf0,#fff)'}}>
    <div className="detailCardHead"><div><span className="modeBadge">V38</span><h3 style={{margin:'.55rem 0 .2rem'}}>{t.title}</h3></div><strong>1</strong></div>
    <p style={{fontSize:'1.16rem',fontWeight:900,lineHeight:1.45,margin:'.8rem 0'}}>{result.action}</p>
    <p><b>{t.when}</b> {result.when}</p>
    <p><b>{t.why}</b> {result.why}</p>
  </section>
}

export function V38PrimaryNextStep(){ return null }
