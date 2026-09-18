'use client'

import { useState } from 'react'
import { tierRank } from '../pricing/catalog'

const rows={
 de:['Wie möchtest du weitermachen?','Nächste Schritte anzeigen','Leistungsumfang erweitern','Für jetzt reicht das Ergebnis','Danach siehst du die Reihenfolge, wer was erledigt und wann ein Schritt abgeschlossen ist.','Zuerst vergleichst du Leistungen, Laufzeit und den tatsächlich fälligen Gesamtpreis. Erst eine ausdrücklich bestätigte Bestellung kann den Zugang ändern. Deine Fallunterlagen bleiben erhalten.','Dieser Umfang ist bereits in deinem Zugang enthalten.','Produktstufen und Kosten ansehen','/ 30 Tage · Grundpreis','Die nächsten Schritte benötigen einen Zugang mit Fallanalyse. Du kannst zuerst die Leistungen vergleichen.','Testbetrieb: Eine echte kostenpflichtige Bestellung ist derzeit nicht freigeschaltet.','Es ist keine höhere Produktstufe für diesen Zugang verfügbar.','Zur Auswahl'],
 en:['How would you like to continue?','Show next steps','Explore more features','The result is enough for now','Next you will see the order of actions, who does what and when each step is complete.','First compare features, duration and the actual total due. Only an explicitly confirmed order can change access. Your case documents are retained.','This is already included in your access.','View plans and costs','/ 30 days · base price','Next steps require case-analysis access. Compare the features first.','Test mode: real paid orders are currently unavailable.','No higher plan is available for this access.','Back to choices'],
 fr:['Comment souhaitez-vous continuer ?','Voir les prochaines étapes','Voir plus de fonctionnalités','Le résultat suffit pour le moment','Vous verrez l’ordre des actions, leurs responsables et leurs critères de réalisation.','Comparez les fonctions, la durée et le total réel. Seule une commande confirmée peut modifier l’accès. Le dossier est conservé.','Déjà inclus dans votre accès.','Voir les offres et tarifs','/ 30 jours · tarif de base','Les prochaines étapes nécessitent un accès à l’analyse du dossier. Comparez les offres.','Mode test : les commandes payantes réelles ne sont pas disponibles.','Aucune offre supérieure disponible.','Retour au choix'],
 tr:['Nasıl devam etmek istersiniz?','Sonraki adımları göster','Daha fazla özellik','Şimdilik sonuç yeterli','İş sırasını, sorumluları ve tamamlanma koşullarını göreceksiniz.','Önce özellikleri, süreyi ve toplam tutarı karşılaştırın. Yalnızca açıkça onaylanan sipariş erişimi değiştirir. Dosyanız korunur.','Erişiminize zaten dâhil.','Paketleri ve ücretleri gör','/ 30 gün · temel fiyat','Sonraki adımlar dosya analizi erişimi gerektirir. Önce paketleri karşılaştırın.','Test modu: gerçek ücretli siparişler şu anda kullanılamaz.','Daha yüksek paket yok.','Seçeneklere dön'],
 pl:['Jak chcesz kontynuować?','Pokaż kolejne kroki','Rozszerz zakres','Na razie wynik wystarczy','Zobaczysz kolejność działań, osoby odpowiedzialne i warunki zakończenia.','Najpierw porównaj funkcje, okres i faktyczną kwotę. Tylko wyraźnie potwierdzone zamówienie zmienia dostęp. Dokumenty pozostają.','Już zawarte w Twoim dostępie.','Zobacz pakiety i koszty','/ 30 dni · cena podstawowa','Kolejne kroki wymagają dostępu do analizy sprawy. Porównaj zakres usług.','Tryb testowy: rzeczywiste płatne zamówienia są niedostępne.','Brak wyższego pakietu.','Wróć do wyboru'],
 ru:['Как вы хотите продолжить?','Показать следующие шаги','Расширить возможности','Пока результата достаточно','Вы увидите порядок действий, ответственных и условия завершения.','Сначала сравните функции, срок и итоговую цену. Доступ меняется только после явно подтверждённого заказа. Документы сохраняются.','Уже включено в ваш доступ.','Посмотреть тарифы и цены','/ 30 дней · базовая цена','Следующие шаги требуют доступа к анализу дела. Сравните возможности.','Тестовый режим: реальные платные заказы недоступны.','Более высокого тарифа нет.','Вернуться к выбору'],
 ar:['كيف تريد المتابعة؟','عرض الخطوات التالية','توسيع الميزات','النتيجة كافية الآن','سترى ترتيب الإجراءات والمسؤولين وشروط الإنجاز.','قارن الميزات والمدة والإجمالي الفعلي أولاً. لا يتغير الوصول إلا بطلب مؤكد صراحة. تبقى مستنداتك محفوظة.','مشمول بالفعل في وصولك.','عرض الباقات والتكاليف','/ 30 يوماً · السعر الأساسي','الخطوات التالية تتطلب وصولاً لتحليل الملف. قارن الميزات أولاً.','وضع الاختبار: الطلبات المدفوعة الحقيقية غير متاحة حالياً.','لا تتوفر باقة أعلى.','العودة للاختيار'],
 fa:['چگونه ادامه می‌دهید؟','نمایش گام‌های بعدی','گسترش امکانات','فعلاً نتیجه کافی است','ترتیب اقدام‌ها، مسئولان و شرایط پایان را می‌بینید.','ابتدا امکانات، مدت و مبلغ واقعی را مقایسه کنید. فقط سفارش تأییدشده دسترسی را تغییر می‌دهد. اسناد حفظ می‌شوند.','در دسترسی شما موجود است.','نمایش طرح‌ها و هزینه‌ها','/ ۳۰ روز · قیمت پایه','گام‌های بعدی به دسترسی تحلیل پرونده نیاز دارند. ابتدا امکانات را مقایسه کنید.','حالت آزمایشی: سفارش پولی واقعی فعلاً فعال نیست.','طرح بالاتری موجود نیست.','بازگشت به انتخاب'],
 ro:['Cum doriți să continuați?','Arată pașii următori','Extinde funcțiile','Rezultatul este suficient','Veți vedea ordinea acțiunilor, responsabilii și condițiile de finalizare.','Comparați mai întâi funcțiile, durata și totalul real. Numai o comandă confirmată explicit modifică accesul. Documentele se păstrează.','Deja inclus în acces.','Vezi planurile și costurile','/ 30 de zile · preț de bază','Pașii următori necesită acces la analiza dosarului. Comparați funcțiile.','Mod de test: comenzile reale cu plată nu sunt disponibile.','Nu există un plan superior.','Înapoi la opțiuni'],
 bg:['Как искате да продължите?','Покажи следващите стъпки','Разшири функциите','Резултатът засега е достатъчен','Ще видите реда, отговорниците и условията за приключване.','Първо сравнете функциите, срока и реалната крайна сума. Само изрично потвърдена поръчка променя достъпа. Документите остават.','Вече е включено във вашия достъп.','Виж плановете и цените','/ 30 дни · базова цена','Следващите стъпки изискват достъп до анализ на случая. Сравнете функциите.','Тестов режим: реални платени поръчки не са достъпни.','Няма по-висок план.','Назад към избора'],
 vi:['Bạn muốn tiếp tục thế nào?','Xem các bước tiếp theo','Mở rộng tính năng','Kết quả hiện tại là đủ','Bạn sẽ thấy thứ tự, người thực hiện và điều kiện hoàn thành.','Trước tiên so sánh tính năng, thời hạn và tổng tiền thực tế. Chỉ đơn hàng được xác nhận rõ ràng mới thay đổi quyền truy cập. Hồ sơ được giữ nguyên.','Đã có trong quyền truy cập của bạn.','Xem gói và chi phí','/ 30 ngày · giá cơ bản','Các bước tiếp theo cần quyền phân tích hồ sơ. Hãy so sánh tính năng trước.','Chế độ thử: chưa thể đặt đơn trả tiền thật.','Không có gói cao hơn.','Quay lại lựa chọn']
}

export function continuationOptions(options=[],currentTier='free') {
  return options.filter(plan=>(tierRank[plan.plan_key]||0)>(tierRank[currentTier]||1))
    .sort((a,b)=>tierRank[a.plan_key]-tierRank[b.plan_key])
}

export function ResultContinuation({language='de',onContinue,onPlans,canContinue=true,currentTier='business',upgradeOptions=[],liveLocked=true}) {
  const c=rows[language]||rows.de
  const [view,setView]=useState('choice')
  const choices=continuationOptions(upgradeOptions,currentTier)
  if(view==='later') return <button type="button" className="secondary" onClick={()=>setView('choice')}>{c[12]}</button>
  return <section className="roadmapContinuation" aria-label={c[0]}>
    <h4>{c[0]}</h4>
    <div className="roadmapActions">
      <button type="button" className="primary" onClick={()=>{if(canContinue){onContinue?.();setView('next')}else setView('plans')}}>{c[1]}</button>
      {choices.length>0&&<button type="button" className="secondary" onClick={()=>setView('plans')}>{c[2]}</button>}
      <button type="button" className="secondary" onClick={()=>setView('later')}>{c[3]}</button>
    </div>
    {view!=='plans'&&<p>{c[4]} {canContinue?c[6]:c[9]}</p>}
    {view==='plans'&&<div className="roadmapPlanOptions">
      <p>{c[5]}</p>
      {!canContinue&&<p>{c[9]}</p>}
      {choices.length?choices.map(plan=><article key={plan.plan_key}><b>{plan.plan_name||plan.name}</b><p>{plan.checks}</p><p>{plan.result}</p><strong>{new Intl.NumberFormat(language,{style:'currency',currency:'EUR'}).format(Number(plan.price_eur))} {c[8]}</strong></article>):<p>{c[11]}</p>}
      {liveLocked&&<p>{c[10]}</p>}
      {choices.length>0&&onPlans&&<button type="button" className="primary" onClick={onPlans}>{c[7]}</button>}
    </div>}
  </section>
}
