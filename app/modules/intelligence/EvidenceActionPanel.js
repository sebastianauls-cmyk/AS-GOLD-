'use client'

import { appText } from '../workspace/workspaceText'

export const EVIDENCE_PANEL_COPY={
  de:{title:'Geprüfte Grundlage & nächste Handlung',verified:'Geprüft',review:'Prüfung erforderlich',source:'Quellenbasis',confidence:'Vertrauensstufe',meaning:'Bedeutet für Sie',next:'Nächster Schritt',gaps:'Offene Punkte',noSources:'Noch keine verifizierte Quellenbasis vorhanden.',noAction:'Noch keine konkrete Handlung hinterlegt.',noGaps:'Keine offenen Prüflücken erkannt.',high:'hoch',medium:'mittel',low:'niedrig'},
  en:{title:'Verified basis & next action',verified:'Verified',review:'Review required',source:'Source basis',confidence:'Confidence',meaning:'What this means for you',next:'Next step',gaps:'Open points',noSources:'No verified source basis is available yet.',noAction:'No concrete next action is stored yet.',noGaps:'No open review gaps detected.',high:'high',medium:'medium',low:'low'},
  fr:{title:'Base vérifiée et prochaine action',verified:'Vérifié',review:'Vérification requise',source:'Base des sources',confidence:'Niveau de confiance',meaning:'Ce que cela signifie pour vous',next:'Prochaine étape',gaps:'Points ouverts',noSources:'Aucune base de sources vérifiée n’est encore disponible.',noAction:'Aucune action concrète n’est encore enregistrée.',noGaps:'Aucune lacune de vérification ouverte détectée.',high:'élevé',medium:'moyen',low:'faible'},
  tr:{title:'Doğrulanmış temel ve sonraki işlem',verified:'Doğrulandı',review:'İnceleme gerekli',source:'Kaynak temeli',confidence:'Güven düzeyi',meaning:'Bu sizin için ne anlama geliyor',next:'Sonraki adım',gaps:'Açık noktalar',noSources:'Henüz doğrulanmış bir kaynak temeli yok.',noAction:'Henüz somut bir sonraki işlem kaydedilmedi.',noGaps:'Açık inceleme eksiği tespit edilmedi.',high:'yüksek',medium:'orta',low:'düşük'},
  pl:{title:'Zweryfikowana podstawa i następne działanie',verified:'Zweryfikowano',review:'Wymaga weryfikacji',source:'Podstawa źródłowa',confidence:'Poziom pewności',meaning:'Co to oznacza dla Ciebie',next:'Następny krok',gaps:'Otwarte kwestie',noSources:'Brak jeszcze zweryfikowanej podstawy źródłowej.',noAction:'Nie zapisano jeszcze konkretnego następnego działania.',noGaps:'Nie wykryto otwartych luk weryfikacyjnych.',high:'wysoki',medium:'średni',low:'niski'},
  ru:{title:'Проверенная основа и следующее действие',verified:'Проверено',review:'Требуется проверка',source:'Источники',confidence:'Уровень уверенности',meaning:'Что это означает для вас',next:'Следующий шаг',gaps:'Открытые вопросы',noSources:'Проверенная источниковая база пока отсутствует.',noAction:'Конкретное следующее действие пока не указано.',noGaps:'Открытых пробелов проверки не обнаружено.',high:'высокий',medium:'средний',low:'низкий'},
  ar:{title:'الأساس الموثق والخطوة التالية',verified:'موثق',review:'يتطلب مراجعة',source:'مصادر الاستناد',confidence:'درجة الثقة',meaning:'ماذا يعني ذلك لك',next:'الخطوة التالية',gaps:'نقاط مفتوحة',noSources:'لا توجد بعد قاعدة مصادر موثقة.',noAction:'لم يتم تسجيل إجراء تالٍ محدد بعد.',noGaps:'لم يتم اكتشاف فجوات مراجعة مفتوحة.',high:'مرتفعة',medium:'متوسطة',low:'منخفضة'},
  fa:{title:'مبنای تأییدشده و اقدام بعدی',verified:'تأییدشده',review:'نیازمند بررسی',source:'مبنای منابع',confidence:'سطح اطمینان',meaning:'این برای شما چه معنایی دارد',next:'گام بعدی',gaps:'موارد باز',noSources:'هنوز مبنای منابع تأییدشده‌ای وجود ندارد.',noAction:'هنوز اقدام بعدی مشخصی ثبت نشده است.',noGaps:'شکاف باز در بررسی شناسایی نشد.',high:'بالا',medium:'متوسط',low:'پایین'},
  ro:{title:'Bază verificată și următoarea acțiune',verified:'Verificat',review:'Necesită verificare',source:'Baza surselor',confidence:'Nivel de încredere',meaning:'Ce înseamnă pentru dvs.',next:'Pasul următor',gaps:'Puncte deschise',noSources:'Nu există încă o bază de surse verificată.',noAction:'Nu este încă înregistrată o acțiune concretă.',noGaps:'Nu au fost identificate lacune deschise de verificare.',high:'ridicat',medium:'mediu',low:'scăzut'},
  bg:{title:'Проверена основа и следващо действие',verified:'Проверено',review:'Необходима е проверка',source:'Източници',confidence:'Ниво на увереност',meaning:'Какво означава това за Вас',next:'Следваща стъпка',gaps:'Отворени въпроси',noSources:'Все още няма проверена източникова основа.',noAction:'Все още няма записано конкретно следващо действие.',noGaps:'Не са открити отворени пропуски за проверка.',high:'високо',medium:'средно',low:'ниско'},
  vi:{title:'Cơ sở đã xác minh & hành động tiếp theo',verified:'Đã xác minh',review:'Cần kiểm tra',source:'Cơ sở nguồn',confidence:'Mức độ tin cậy',meaning:'Điều này có ý nghĩa gì với bạn',next:'Bước tiếp theo',gaps:'Điểm còn mở',noSources:'Chưa có cơ sở nguồn đã được xác minh.',noAction:'Chưa có hành động tiếp theo cụ thể được ghi nhận.',noGaps:'Không phát hiện khoảng trống kiểm tra còn mở.',high:'cao',medium:'trung bình',low:'thấp'}
}

function languageFromAppCopy(a){
  return Object.entries(appText).find(([,value])=>value===a)?.[0]||'de'
}

export function EvidenceActionPanel({a,data}){
  const language=languageFromAppCopy(a)
  const c=EVIDENCE_PANEL_COPY[language]||EVIDENCE_PANEL_COPY.de
  const assessments=Array.isArray(data?.assessments)?data.assessments:[]
  const sourceStatus=Array.isArray(data?.sourceStatus)?data.sourceStatus:[]
  const latest=assessments[0]||null
  const sources=sourceStatus.filter(Boolean)
  const traffic=latest?.traffic_light||latest?.trafficLight||latest?.status||'white'
  const dot=traffic==='green'?'🟢':traffic==='yellow'?'🟡':traffic==='red'?'🔴':'⚪'
  const verified=sources.length>0 && traffic!=='red'
  const confidence=verified?(traffic==='green'?'high':'medium'):'low'
  const action=latest?.next_step||latest?.next_action||latest?.nextAction||''
  const reasoning=latest?.reasoning||latest?.summary||''
  const gapCount=verified?0:1

  return <section className="recommendationBox evidenceActionPanel" dir={language==='ar'||language==='fa'?'rtl':'ltr'}>
    <div><span className="modeBadge">{dot} {verified?c.verified:c.review}</span><h3>{c.title}</h3></div>
    <div className="recommendationResult"><div><b>{c.confidence}: {c[confidence]}</b><p>{c.meaning}: {reasoning||c.noSources}</p></div></div>
    <p><b>{c.source}:</b> {sources.length?sources.length:c.noSources}</p>
    <p><b>{c.next}:</b> {action||c.noAction}</p>
    <p><b>{c.gaps}:</b> {gapCount?c.noSources:c.noGaps}</p>
  </section>
}
