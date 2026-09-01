'use client'

import { useEffect, useMemo, useState } from 'react'
import { componentTranslations } from '../lib/v30ComponentTranslations.mjs'

const copy = {
  de:{title:'Freigaben',lead:'Entwürfe werden erst nach einer sichtbaren Vorschau ausdrücklich freigegeben. AS Gold versendet dabei noch nichts automatisch.',newApproval:'Neue Freigabe vorbereiten',cancel:'Abbrechen',case:'Fall',chooseCase:'Fall auswählen',document:'Bezugsdokument',noDocument:'Ohne einzelnes Bezugsdokument',type:'Verwendung',types:{send:'Versand',binding_use:'Verbindliche Verwendung',export_delivery:'Export / Übergabe'},recipient:'Empfänger',subject:'Betreff / Bezeichnung',body:'Freizugebender Inhalt',create:'Vorschau anlegen',none:'Noch keine Freigabe vorbereitet.',pending:'Prüfung offen',approved:'Freigegeben',rejected:'Abgelehnt',revision:'Vorschau-Revision',back:'← Zurück',preview:'Verbindliche Vorschau',previewHelp:'Nur der hier sichtbare Inhalt wird freigegeben. Änderungen erzeugen eine neue Revision und heben eine bestehende Freigabe auf.',attachments:'Anlagen',noAttachments:'Keine Anlagen hinterlegt',edit:'Entwurf bearbeiten',save:'Änderungen speichern',confirm:'Ich habe Empfänger, Inhalt und Anlagen dieser Revision vollständig geprüft.',approve:'Diese Revision ausdrücklich freigeben',reject:'Ablehnen',approvedAt:'Freigegeben am',approvedRevision:'Freigegebene Revision',invalidated:'Eine frühere Freigabe wurde durch eine Inhaltsänderung ungültig.',stale:'Die Vorschau wurde zwischenzeitlich geändert. Bitte neu laden und erneut prüfen.',saved:'Freigabe aktualisiert.',created:'Freigabevorschau angelegt.',approvedMessage:'Revision ausdrücklich freigegeben.',rejectedMessage:'Freigabe abgelehnt.',prepareFromDocument:'Zur Freigabe vorbereiten',caseRequired:'Bitte zuerst einen Fall auswählen.',contentRequired:'Bitte Betreff und freizugebenden Inhalt ausfüllen.',documentMismatch:'Das gewählte Dokument gehört nicht zum ausgewählten Fall.',recipientRequired:'Für einen Versand ist ein Empfänger erforderlich.'},
  en:{title:'Approvals',lead:'Drafts are approved explicitly only after a visible preview. AS Gold does not send anything automatically yet.',newApproval:'Prepare new approval',cancel:'Cancel',case:'Case',chooseCase:'Choose case',document:'Reference document',noDocument:'Without a single reference document',type:'Intended use',types:{send:'Sending',binding_use:'Binding use',export_delivery:'Export / handover'},recipient:'Recipient',subject:'Subject / title',body:'Content to approve',create:'Create preview',none:'No approval has been prepared yet.',pending:'Review pending',approved:'Approved',rejected:'Rejected',revision:'Preview revision',back:'← Back',preview:'Binding preview',previewHelp:'Only the content shown here is approved. Changes create a new revision and invalidate an existing approval.',attachments:'Attachments',noAttachments:'No attachments recorded',edit:'Edit draft',save:'Save changes',confirm:'I have fully checked the recipient, content and attachments of this revision.',approve:'Explicitly approve this revision',reject:'Reject',approvedAt:'Approved at',approvedRevision:'Approved revision',invalidated:'A previous approval was invalidated by a content change.',stale:'The preview changed in the meantime. Reload it and review it again.',saved:'Approval updated.',created:'Approval preview created.',approvedMessage:'Revision explicitly approved.',rejectedMessage:'Approval rejected.',prepareFromDocument:'Prepare for approval',caseRequired:'Choose a case first.',contentRequired:'Enter a subject and the content to approve.',documentMismatch:'The selected document does not belong to the selected case.',recipientRequired:'A recipient is required for sending.'},
  tr:{title:'Onaylar',lead:'Taslaklar yalnızca görünür bir önizlemeden sonra açıkça onaylanır. AS Gold henüz hiçbir şeyi otomatik göndermez.',newApproval:'Yeni onay hazırla',cancel:'İptal',case:'Dosya',chooseCase:'Dosya seç',document:'İlgili belge',noDocument:'Tek bir belge olmadan',type:'Kullanım',types:{send:'Gönderim',binding_use:'Bağlayıcı kullanım',export_delivery:'Dışa aktarma / teslim'},recipient:'Alıcı',subject:'Konu / başlık',body:'Onaylanacak içerik',create:'Önizleme oluştur',none:'Henüz onay hazırlanmamış.',pending:'İnceleme bekliyor',approved:'Onaylandı',rejected:'Reddedildi',revision:'Önizleme revizyonu',back:'← Geri',preview:'Bağlayıcı önizleme',previewHelp:'Yalnızca burada görülen içerik onaylanır. Değişiklikler yeni bir revizyon oluşturur ve mevcut onayı geçersiz kılar.',attachments:'Ekler',noAttachments:'Ek yok',edit:'Taslağı düzenle',save:'Değişiklikleri kaydet',confirm:'Bu revizyonun alıcısını, içeriğini ve eklerini tamamen kontrol ettim.',approve:'Bu revizyonu açıkça onayla',reject:'Reddet',approvedAt:'Onay tarihi',approvedRevision:'Onaylanan revizyon',invalidated:'Önceki onay içerik değişikliğiyle geçersiz oldu.',stale:'Önizleme bu sırada değişti. Yeniden yükleyip tekrar kontrol edin.',saved:'Onay güncellendi.',created:'Onay önizlemesi oluşturuldu.',approvedMessage:'Revizyon açıkça onaylandı.',rejectedMessage:'Onay reddedildi.',prepareFromDocument:'Onaya hazırla',caseRequired:'Önce bir dosya seçin.',contentRequired:'Konu ve onaylanacak içeriği girin.',documentMismatch:'Seçilen belge seçilen dosyaya ait değil.',recipientRequired:'Gönderim için alıcı gereklidir.'},
  pl:{title:'Zatwierdzenia',lead:'Projekt jest zatwierdzany wyraźnie dopiero po wyświetleniu podglądu. AS Gold nie wysyła jeszcze nic automatycznie.',newApproval:'Przygotuj zatwierdzenie',cancel:'Anuluj',case:'Sprawa',chooseCase:'Wybierz sprawę',document:'Dokument odniesienia',noDocument:'Bez pojedynczego dokumentu',type:'Zastosowanie',types:{send:'Wysyłka',binding_use:'Wiążące użycie',export_delivery:'Eksport / przekazanie'},recipient:'Odbiorca',subject:'Temat / nazwa',body:'Treść do zatwierdzenia',create:'Utwórz podgląd',none:'Nie przygotowano jeszcze zatwierdzenia.',pending:'Oczekuje na kontrolę',approved:'Zatwierdzone',rejected:'Odrzucone',revision:'Rewizja podglądu',back:'← Wstecz',preview:'Wiążący podgląd',previewHelp:'Zatwierdzana jest wyłącznie widoczna tutaj treść. Zmiany tworzą nową rewizję i unieważniają wcześniejszą zgodę.',attachments:'Załączniki',noAttachments:'Brak załączników',edit:'Edytuj projekt',save:'Zapisz zmiany',confirm:'Dokładnie sprawdzono odbiorcę, treść i załączniki tej rewizji.',approve:'Wyraźnie zatwierdź tę rewizję',reject:'Odrzuć',approvedAt:'Data zatwierdzenia',approvedRevision:'Zatwierdzona rewizja',invalidated:'Poprzednie zatwierdzenie unieważniono przez zmianę treści.',stale:'Podgląd został w międzyczasie zmieniony. Wczytaj go ponownie i sprawdź.',saved:'Zatwierdzenie zaktualizowano.',created:'Utworzono podgląd zatwierdzenia.',approvedMessage:'Rewizję wyraźnie zatwierdzono.',rejectedMessage:'Zatwierdzenie odrzucono.',prepareFromDocument:'Przygotuj do zatwierdzenia',caseRequired:'Najpierw wybierz sprawę.',contentRequired:'Wpisz temat i treść do zatwierdzenia.',documentMismatch:'Wybrany dokument nie należy do wybranej sprawy.',recipientRequired:'Wysyłka wymaga odbiorcy.'},
  ru:{title:'Согласования',lead:'Черновики подтверждаются явно только после видимого предпросмотра. AS Gold пока ничего не отправляет автоматически.',newApproval:'Подготовить согласование',cancel:'Отмена',case:'Дело',chooseCase:'Выберите дело',document:'Связанный документ',noDocument:'Без отдельного документа',type:'Использование',types:{send:'Отправка',binding_use:'Обязательное использование',export_delivery:'Экспорт / передача'},recipient:'Получатель',subject:'Тема / название',body:'Содержимое для согласования',create:'Создать предпросмотр',none:'Согласований пока нет.',pending:'Ожидает проверки',approved:'Согласовано',rejected:'Отклонено',revision:'Ревизия предпросмотра',back:'← Назад',preview:'Обязательный предпросмотр',previewHelp:'Согласуется только показанное здесь содержимое. Изменения создают новую ревизию и отменяют прежнее согласование.',attachments:'Вложения',noAttachments:'Вложений нет',edit:'Изменить черновик',save:'Сохранить изменения',confirm:'Я полностью проверил получателя, содержимое и вложения этой ревизии.',approve:'Явно согласовать эту ревизию',reject:'Отклонить',approvedAt:'Дата согласования',approvedRevision:'Согласованная ревизия',invalidated:'Прежнее согласование отменено из-за изменения содержимого.',stale:'Предпросмотр тем временем изменился. Обновите и проверьте снова.',saved:'Согласование обновлено.',created:'Предпросмотр согласования создан.',approvedMessage:'Ревизия явно согласована.',rejectedMessage:'Согласование отклонено.',prepareFromDocument:'Подготовить к согласованию',caseRequired:'Сначала выберите дело.',contentRequired:'Введите тему и содержимое для согласования.',documentMismatch:'Выбранный документ не относится к выбранному делу.',recipientRequired:'Для отправки нужен получатель.'},
  ar:{title:'الموافقات',lead:'لا تتم الموافقة على المسودات إلا صراحةً بعد معاينة واضحة. ولا يرسل AS Gold أي شيء تلقائيًا حتى الآن.',newApproval:'إعداد موافقة جديدة',cancel:'إلغاء',case:'الحالة',chooseCase:'اختر الحالة',document:'المستند المرتبط',noDocument:'من دون مستند منفرد',type:'الاستخدام',types:{send:'الإرسال',binding_use:'الاستخدام الملزم',export_delivery:'التصدير / التسليم'},recipient:'المستلم',subject:'الموضوع / العنوان',body:'المحتوى المطلوب اعتماده',create:'إنشاء المعاينة',none:'لم تُعَد أي موافقة بعد.',pending:'بانتظار المراجعة',approved:'تمت الموافقة',rejected:'مرفوض',revision:'نسخة المعاينة',back:'← رجوع',preview:'المعاينة الملزمة',previewHelp:'تتم الموافقة فقط على المحتوى الظاهر هنا. تنشئ التغييرات نسخة جديدة وتبطل الموافقة السابقة.',attachments:'المرفقات',noAttachments:'لا توجد مرفقات',edit:'تعديل المسودة',save:'حفظ التغييرات',confirm:'راجعت بالكامل المستلم والمحتوى والمرفقات في هذه النسخة.',approve:'الموافقة صراحةً على هذه النسخة',reject:'رفض',approvedAt:'تاريخ الموافقة',approvedRevision:'النسخة الموافق عليها',invalidated:'أُبطلت موافقة سابقة بسبب تغيير المحتوى.',stale:'تغيرت المعاينة في هذه الأثناء. أعد تحميلها وراجعها مجددًا.',saved:'تم تحديث الموافقة.',created:'تم إنشاء معاينة الموافقة.',approvedMessage:'تمت الموافقة صراحةً على النسخة.',rejectedMessage:'رُفضت الموافقة.',prepareFromDocument:'الإعداد للموافقة',caseRequired:'اختر حالة أولًا.',contentRequired:'أدخل الموضوع والمحتوى المطلوب اعتماده.',documentMismatch:'المستند المحدد لا ينتمي إلى الحالة المختارة.',recipientRequired:'يلزم مستلم للإرسال.'}
}

Object.assign(copy, componentTranslations.approvalCopy)

export function getV25ApprovalCopy(language){ return copy[language] || copy.de }

function statusText(on,status){ return on[status] || status }
function typeText(on,type){ return on.types[type] || type }

export function ApprovalSection({copy:on,cases,documents,approvals,defaults,onCreate,onSelect}){
  const [showForm,setShowForm]=useState(Boolean(defaults?.caseId||defaults?.documentId))
  const [draft,setDraft]=useState({case_id:defaults?.caseId||'',document_id:defaults?.documentId||'',approval_type:'send',recipient:'',subject:'',body:''})
  const matchingDocuments=useMemo(()=>documents.filter(item=>item.case_id===draft.case_id),[documents,draft.case_id])

  useEffect(()=>{
    if(!defaults?.caseId&&!defaults?.documentId) return
    setDraft(previous=>({...previous,case_id:defaults.caseId||'',document_id:defaults.documentId||''}))
    setShowForm(true)
  },[defaults?.caseId,defaults?.documentId])

  async function submit(event){
    event.preventDefault()
    const created=await onCreate(draft)
    if(created){
      setDraft({case_id:'',document_id:'',approval_type:'send',recipient:'',subject:'',body:''})
      setShowForm(false)
    }
  }

  return <>
    <section className="approvalIntro"><div><span className="modeBadge">V26</span><h3>{on.title}</h3><p>{on.lead}</p></div><button type="button" className="primary" onClick={()=>setShowForm(value=>!value)}>{showForm?on.cancel:`＋ ${on.newApproval}`}</button></section>
    {showForm&&<form className="actionCard approvalForm" onSubmit={submit}>
      <label>{on.case}<select value={draft.case_id} onChange={event=>setDraft({...draft,case_id:event.target.value,document_id:''})} required><option value="">{on.chooseCase}</option>{cases.map(item=><option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
      <label>{on.document}<select value={draft.document_id} onChange={event=>setDraft({...draft,document_id:event.target.value})}><option value="">{on.noDocument}</option>{matchingDocuments.map(item=><option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
      <label>{on.type}<select value={draft.approval_type} onChange={event=>setDraft({...draft,approval_type:event.target.value})}>{Object.entries(on.types).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
      <label>{on.recipient}<input value={draft.recipient} onChange={event=>setDraft({...draft,recipient:event.target.value})} required={draft.approval_type==='send'}/></label>
      <label className="approvalWide">{on.subject}<input value={draft.subject} onChange={event=>setDraft({...draft,subject:event.target.value})} required/></label>
      <label className="approvalWide">{on.body}<textarea value={draft.body} onChange={event=>setDraft({...draft,body:event.target.value})} rows="9" required/></label>
      <button className="primary full approvalWide">{on.create}</button>
    </form>}
    {approvals.length?<div className="itemList approvalList">{approvals.map(item=>{const linkedCase=cases.find(entry=>entry.id===item.case_id);return <button className="itemRow buttonRow" type="button" onClick={()=>onSelect(item)} key={item.id}><div><b>{item.subject||typeText(on,item.approval_type)}</b><p>{linkedCase?.title||on.case} · {typeText(on,item.approval_type)}</p><div className="pills"><span className={`pill approval-${item.status}`}>{statusText(on,item.status)}</span><span className="pill">{on.revision} {item.preview_revision}</span></div></div><span className="chev">›</span></button>})}</div>:<div className="emptyState">{on.none}</div>}
  </>
}

export function ApprovalDetail({copy:on,item,cases,documents,onBack,onSave,onApprove,onReject}){
  const [editing,setEditing]=useState(false)
  const [confirmed,setConfirmed]=useState(false)
  const [busy,setBusy]=useState(false)
  const [draft,setDraft]=useState({recipient:item.recipient||'',subject:item.subject||'',body:item.body||''})
  const linkedCase=cases.find(entry=>entry.id===item.case_id)
  const linkedDocument=documents.find(entry=>entry.id===item.document_id)
  const attachments=item.attachment_names?.length?item.attachment_names:(linkedDocument?[linkedDocument.title]:[])

  async function save(event){
    event.preventDefault();setBusy(true)
    const saved=await onSave(item.id,draft)
    setBusy(false)
    if(saved){setEditing(false);setConfirmed(false)}
  }

  async function decide(action){
    setBusy(true)
    const changed=action==='approve'?await onApprove(item):await onReject(item)
    setBusy(false)
    if(changed)setConfirmed(false)
  }

  return <>
    <button className="backBtn" type="button" onClick={onBack}>{on.back}</button>
    <section className="approvalDetailHead"><div><span className="modeBadge">V26</span><h2>{item.subject||on.preview}</h2><p>{linkedCase?.title||on.case} · {typeText(on,item.approval_type)}</p></div><span className={`approvalState approval-${item.status}`}>{statusText(on,item.status)}</span></section>
    {item.invalidated_at&&<div className="note approvalWarning">{on.invalidated}</div>}
    <section className="approvalPreview">
      <div className="approvalPreviewHead"><div><h3>{on.preview}</h3><p>{on.previewHelp}</p></div><b>{on.revision} {item.preview_revision}</b></div>
      <dl><div><dt>{on.recipient}</dt><dd>{item.recipient||'—'}</dd></div><div><dt>{on.subject}</dt><dd>{item.subject||'—'}</dd></div><div className="approvalBody"><dt>{on.body}</dt><dd>{item.body||'—'}</dd></div><div><dt>{on.attachments}</dt><dd>{attachments.length?attachments.join(', '):on.noAttachments}</dd></div></dl>
    </section>
    {item.status==='approved'&&<section className="approvalDecision approvedDecision"><b>✓ {on.approved}</b><span>{on.approvedRevision} {item.approved_revision} · {on.approvedAt} {item.approved_at?new Date(item.approved_at).toLocaleString():'—'}</span></section>}
    {editing?<form className="actionCard approvalEdit" onSubmit={save}><label>{on.recipient}<input value={draft.recipient} onChange={event=>setDraft({...draft,recipient:event.target.value})} required={item.approval_type==='send'}/></label><label>{on.subject}<input value={draft.subject} onChange={event=>setDraft({...draft,subject:event.target.value})} required/></label><label>{on.body}<textarea value={draft.body} onChange={event=>setDraft({...draft,body:event.target.value})} rows="9" required/></label><button className="primary" disabled={busy}>{on.save}</button><button type="button" className="secondary" onClick={()=>setEditing(false)}>{on.cancel}</button></form>:<button type="button" className="secondary approvalEditButton" onClick={()=>setEditing(true)}>{on.edit}</button>}
    {item.status==='pending'&&<section className="approvalDecision"><label className="approvalConfirm"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/><span>{on.confirm}</span></label><div><button type="button" className="primary" disabled={!confirmed||busy} onClick={()=>decide('approve')}>{on.approve}</button><button type="button" className="secondary dangerSoft" disabled={busy} onClick={()=>decide('reject')}>{on.reject}</button></div></section>}
  </>
}
