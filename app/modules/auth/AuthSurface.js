import { ProductBrand } from '../brand/ProductBrand'
import { LanguageSwitcher } from '../language/LanguageSwitcher'
import { LegalFooter } from '../compliance/LegalFooter'
import { RegistrationLegalFields } from '../compliance/PrivacyControls'
import { PasswordPolicyChecklist } from './PasswordPolicy'
import { PasswordField } from './PasswordField'

const v131AuthCopy={
  de:{badge:'Stand v131',headline:'Mehr als nur anmelden – Ihr digitaler Arbeitsbereich',lead:'Fälle verstehen, Dokumente auswerten, Länder vergleichen und Ergebnisse verständlich ausgeben.',features:[['📄','Dokumente & Fotos','Hochladen, erkennen, strukturieren und fallbezogen auswerten.'],['🌍','Sprachen & Länder','Mehrsprachige Eingabe und Ausgabe sowie Rechtsraumvergleich nach Zielland.'],['🚦','Analyse mit Ampel','Ergebnisse, Risiken, fehlende Unterlagen und nächste Schritte sofort erkennen.'],['✉️','Zweisprachige Schreiben','Kunden- und Empfängerschreiben auf Wunsch in zwei Sprachen ausgeben.'],['🎙️','Eingabe per Sprache','Sachverhalte auch per Mikrofon erfassen und weiterverarbeiten.'],['📤','Ausgabe & Freigabe','PDF/Word-Workflows, Vorschau und Freigabe vor der Weitergabe.']],hint:'Noch keinen Zugang? Kostenlos registrieren oder zuerst die Erklärung und den Testbereich ansehen.',explain:'Erklärung & Testbereich'},
  en:{badge:'Version v131',headline:'More than a sign-in – your digital workspace',lead:'Understand cases, analyse documents, compare countries and produce clear results.',features:[['📄','Documents & photos','Upload, recognise, structure and analyse them in case context.'],['🌍','Languages & countries','Multilingual input/output and legal-space comparison by target country.'],['🚦','Traffic-light analysis','See results, risks, missing items and next steps at a glance.'],['✉️','Bilingual letters','Create customer and recipient letters in two languages when needed.'],['🎙️','Voice input','Capture case facts by microphone and continue processing them.'],['📤','Output & approval','PDF/Word workflows, preview and approval before sharing.']],hint:'No account yet? Register free or view the explanation and test area first.',explain:'Explanation & test area'},
  pl:{badge:'Wersja v131',headline:'Więcej niż logowanie – cyfrowe miejsce pracy',lead:'Zrozum sprawę, analizuj dokumenty, porównuj kraje i twórz czytelne wyniki.',features:[['📄','Dokumenty i zdjęcia','Przesyłanie, rozpoznawanie, porządkowanie i analiza w kontekście sprawy.'],['🌍','Języki i kraje','Wielojęzyczne dane oraz porównanie przestrzeni prawnej według kraju docelowego.'],['🚦','Analiza sygnalizacyjna','Wyniki, ryzyka, braki i kolejne kroki od razu widoczne.'],['✉️','Pisma dwujęzyczne','Pisma dla klientów i odbiorców w dwóch językach.'],['🎙️','Wprowadzanie głosem','Opis sprawy można podać również przez mikrofon.'],['📤','Eksport i akceptacja','PDF/Word, podgląd i zatwierdzenie przed przekazaniem.']],hint:'Nie masz jeszcze dostępu? Zarejestruj się bezpłatnie albo najpierw zobacz wyjaśnienie i obszar testowy.',explain:'Wyjaśnienie i test'},
  tr:{badge:'Sürüm v131',headline:'Sadece giriş değil – dijital çalışma alanınız',lead:'Vakaları anlayın, belgeleri analiz edin, ülkeleri karşılaştırın ve anlaşılır sonuçlar üretin.',features:[['📄','Belgeler ve fotoğraflar','Yükleyin, tanıyın, düzenleyin ve vaka bağlamında analiz edin.'],['🌍','Diller ve ülkeler','Çok dilli giriş/çıkış ve hedef ülkeye göre hukuk alanı karşılaştırması.'],['🚦','Trafik ışığı analizi','Sonuçları, riskleri, eksikleri ve sonraki adımları hemen görün.'],['✉️','İki dilli yazılar','Gerektiğinde iki dilde müşteri ve alıcı yazıları oluşturun.'],['🎙️','Sesli giriş','Olayları mikrofonla anlatın ve işlemeye devam edin.'],['📤','Çıktı ve onay','PDF/Word iş akışları, önizleme ve paylaşmadan önce onay.']],hint:'Henüz erişiminiz yok mu? Ücretsiz kaydolun veya önce açıklama ve test alanını görün.',explain:'Açıklama ve test alanı'},
  ru:{badge:'Версия v131',headline:'Больше, чем вход — ваше цифровое рабочее пространство',lead:'Разбирайте дела, анализируйте документы, сравнивайте страны и получайте понятные результаты.',features:[['📄','Документы и фото','Загрузка, распознавание, структурирование и анализ по делу.'],['🌍','Языки и страны','Многоязычный ввод/вывод и сравнение правовых пространств по стране.'],['🚦','Светофорный анализ','Результаты, риски, недостающие данные и следующие шаги сразу видны.'],['✉️','Двуязычные письма','Письма клиентам и адресатам на двух языках.'],['🎙️','Голосовой ввод','Описание ситуации через микрофон с дальнейшей обработкой.'],['📤','Вывод и согласование','PDF/Word, предварительный просмотр и подтверждение перед передачей.']],hint:'Нет доступа? Зарегистрируйтесь бесплатно или сначала откройте объяснение и тестовую область.',explain:'Объяснение и тест'},
  fr:{badge:'Version v131',headline:'Plus qu’une connexion – votre espace de travail numérique',lead:'Comprendre les dossiers, analyser les documents, comparer les pays et produire des résultats clairs.',features:[['📄','Documents et photos','Importer, reconnaître, structurer et analyser dans le contexte du dossier.'],['🌍','Langues et pays','Entrée/sortie multilingue et comparaison des cadres juridiques selon le pays cible.'],['🚦','Analyse par feu tricolore','Résultats, risques, éléments manquants et prochaines étapes visibles immédiatement.'],['✉️','Courriers bilingues','Créer des courriers en deux langues selon le besoin.'],['🎙️','Saisie vocale','Décrire les faits au microphone puis poursuivre le traitement.'],['📤','Sortie et validation','PDF/Word, aperçu et validation avant transmission.']],hint:'Pas encore de compte ? Inscrivez-vous gratuitement ou consultez d’abord l’explication et l’espace de test.',explain:'Explication et test'},
  vi:{badge:'Phiên bản v131',headline:'Không chỉ đăng nhập – không gian làm việc số của bạn',lead:'Hiểu vụ việc, phân tích tài liệu, so sánh quốc gia và tạo kết quả dễ hiểu.',features:[['📄','Tài liệu & hình ảnh','Tải lên, nhận dạng, sắp xếp và phân tích theo từng vụ việc.'],['🌍','Ngôn ngữ & quốc gia','Nhập/xuất đa ngôn ngữ và so sánh không gian pháp lý theo quốc gia đích.'],['🚦','Phân tích đèn tín hiệu','Nhìn ngay kết quả, rủi ro, phần còn thiếu và bước tiếp theo.'],['✉️','Văn bản song ngữ','Tạo thư cho khách hàng/người nhận bằng hai ngôn ngữ khi cần.'],['🎙️','Nhập bằng giọng nói','Mô tả sự việc bằng micro và tiếp tục xử lý.'],['📤','Xuất & phê duyệt','PDF/Word, xem trước và phê duyệt trước khi gửi.']],hint:'Chưa có tài khoản? Đăng ký miễn phí hoặc xem phần giải thích và khu vực thử nghiệm trước.',explain:'Giải thích & thử nghiệm'},
  ar:{badge:'الإصدار v131',headline:'أكثر من مجرد تسجيل دخول – مساحة عملك الرقمية',lead:'افهم الحالات، وحلّل المستندات، وقارن بين الدول، وقدّم نتائج واضحة.',features:[['📄','المستندات والصور','رفعها والتعرّف عليها وتنظيمها وتحليلها ضمن سياق الحالة.'],['🌍','اللغات والدول','إدخال وإخراج متعدد اللغات مع مقارنة الإطار القانوني حسب الدولة المستهدفة.'],['🚦','تحليل بإشارة المرور','رؤية النتائج والمخاطر والنواقص والخطوات التالية فوراً.'],['✉️','خطابات ثنائية اللغة','إنشاء خطابات للعملاء والمستلمين بلغتين عند الحاجة.'],['🎙️','إدخال صوتي','تسجيل وقائع الحالة عبر الميكروفون ومتابعة معالجتها.'],['📤','الإخراج والموافقة','مسارات PDF/Word مع المعاينة والموافقة قبل المشاركة.']],hint:'ليس لديك حساب بعد؟ سجّل مجاناً أو اطلع أولاً على الشرح ومنطقة الاختبار.',explain:'الشرح ومنطقة الاختبار'},
  fa:{badge:'نسخه v131',headline:'بیش از یک ورود ساده – فضای کاری دیجیتال شما',lead:'پرونده‌ها را درک کنید، اسناد را تحلیل کنید، کشورها را مقایسه کنید و نتیجه‌ای روشن ارائه دهید.',features:[['📄','اسناد و تصاویر','بارگذاری، شناسایی، ساختاربندی و تحلیل در ارتباط با پرونده.'],['🌍','زبان‌ها و کشورها','ورودی و خروجی چندزبانه و مقایسه فضای حقوقی بر اساس کشور مقصد.'],['🚦','تحلیل چراغ راهنما','نتایج، ریسک‌ها، موارد ناقص و گام‌های بعدی را فوراً ببینید.'],['✉️','نامه‌های دوزبانه','در صورت نیاز نامه‌های مشتری و گیرنده را به دو زبان ایجاد کنید.'],['🎙️','ورودی صوتی','شرح موضوع با میکروفون و ادامه پردازش آن.'],['📤','خروجی و تأیید','فرآیندهای PDF/Word با پیش‌نمایش و تأیید پیش از ارسال.']],hint:'هنوز حساب ندارید؟ رایگان ثبت‌نام کنید یا ابتدا توضیحات و بخش آزمایشی را ببینید.',explain:'توضیحات و بخش آزمایشی'},
  ro:{badge:'Versiunea v131',headline:'Mai mult decât autentificare – spațiul tău digital de lucru',lead:'Înțelege cazurile, analizează documente, compară țări și obține rezultate clare.',features:[['📄','Documente și fotografii','Încarcă, recunoaște, structurează și analizează în contextul cazului.'],['🌍','Limbi și țări','Introducere/ieșire multilingvă și comparație a cadrului juridic după țara vizată.'],['🚦','Analiză tip semafor','Vezi imediat rezultatele, riscurile, lipsurile și pașii următori.'],['✉️','Scrisori bilingve','Creează scrisori pentru clienți și destinatari în două limbi, când este necesar.'],['🎙️','Introducere vocală','Descrie situația prin microfon și continuă procesarea.'],['📤','Export și aprobare','Fluxuri PDF/Word, previzualizare și aprobare înainte de transmitere.']],hint:'Nu ai încă acces? Înregistrează-te gratuit sau vezi mai întâi explicația și zona de test.',explain:'Explicație și zonă de test'},
  bg:{badge:'Версия v131',headline:'Повече от вход – вашето дигитално работно пространство',lead:'Разбирайте случаи, анализирайте документи, сравнявайте държави и получавайте ясни резултати.',features:[['📄','Документи и снимки','Качване, разпознаване, структуриране и анализ в контекста на случая.'],['🌍','Езици и държави','Многоезично въвеждане/извеждане и сравнение на правната среда според целевата държава.'],['🚦','Светофарен анализ','Вижте веднага резултатите, рисковете, липсите и следващите стъпки.'],['✉️','Двуезични писма','Създаване на писма за клиенти и получатели на два езика при нужда.'],['🎙️','Гласово въвеждане','Опишете случая чрез микрофон и продължете обработката.'],['📤','Изход и одобрение','PDF/Word процеси, преглед и одобрение преди изпращане.']],hint:'Още нямате достъп? Регистрирайте се безплатно или първо разгледайте обяснението и тестовата зона.',explain:'Обяснение и тестова зона'}
}

const v131CurrentHighlights=[
  ['🌐','11 Sprachen / 11 languages'],
  ['⏱️','Fristen & Verlauf / deadlines & timeline'],
  ['📊','PDF · Word · Excel · PowerPoint'],
  ['🧭','Rechtsraumvergleich / legal-space comparison'],
  ['🎟️','Persönlicher Testzugang / personal tester access']
]

export function AuthSurface({screen,t,a,language,setLanguage,tt,displayName,setDisplayName,email,setEmail,password,setPassword,password2,setPassword2,showPassword,setShowPassword,showPassword2,setShowPassword2,pui,recoveryCopy,v28,acceptedLegal,setAcceptedLegal,confirmedTestData,setConfirmedTestData,registerReady,recoveryReady,register,signIn,resetPassword,completePasswordRecovery,message,lt,setScreen}){
  const resetSensitiveFields=()=>{
    setShowPassword(false)
    setShowPassword2(false)
    setPassword('')
    setPassword2('')
    setAcceptedLegal(false)
    setConfirmedTestData(false)
  }

  const openResetRequest=()=>{
    resetSensitiveFields()
    setScreen('request-reset')
  }

  const submitResetRequest=event=>{
    event.preventDefault()
    resetPassword()
  }

  let authForm
  if(screen==='register'){
    authForm=<form onSubmit={register}>
      <label>{a.name}<input value={displayName} onChange={event=>setDisplayName(event.target.value)} autoComplete="name" required/></label>
      <label>{a.email}<input type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email" required/></label>
      <PasswordField id="register-password" label={a.password} value={password} onChange={event=>setPassword(event.target.value)} visible={showPassword} onToggle={()=>setShowPassword(value=>!value)} labels={pui} autoComplete="new-password" describedBy="v29-password-policy"/>
      <PasswordField id="register-password-repeat" label={a.passwordAgain} value={password2} onChange={event=>setPassword2(event.target.value)} visible={showPassword2} onToggle={()=>setShowPassword2(value=>!value)} labels={pui} autoComplete="new-password" describedBy="v29-password-policy"/>
      <PasswordPolicyChecklist language={language} password={password} passwordRepeat={password2} email={email} displayName={displayName}/>
      <RegistrationLegalFields copy={v28} accepted={acceptedLegal} onAccepted={setAcceptedLegal} testOnly={confirmedTestData} onTestOnly={setConfirmedTestData}/>
      <button className="primary full" disabled={!registerReady}>{a.registerFree}</button>
    </form>
  }else if(screen==='recovery'){
    authForm=<form onSubmit={completePasswordRecovery}>
      <p className="muted">{recoveryCopy.lead}</p>
      <PasswordField id="recovery-password" label={a.password} value={password} onChange={event=>setPassword(event.target.value)} visible={showPassword} onToggle={()=>setShowPassword(value=>!value)} labels={pui} autoComplete="new-password" describedBy="v29-password-policy"/>
      <PasswordField id="recovery-password-repeat" label={a.passwordAgain} value={password2} onChange={event=>setPassword2(event.target.value)} visible={showPassword2} onToggle={()=>setShowPassword2(value=>!value)} labels={pui} autoComplete="new-password" describedBy="v29-password-policy"/>
      <PasswordPolicyChecklist language={language} password={password} passwordRepeat={password2} email={email} displayName={displayName}/>
      <button className="primary full" disabled={!recoveryReady}>{recoveryCopy.submit}</button>
    </form>
  }else if(screen==='request-reset'){
    authForm=<form onSubmit={submitResetRequest}>
      <label>{a.email}<input type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email" required autoFocus/></label>
      <button className="primary full">{lt.passwordReset}</button>
      <small className="authHelp">{lt.passwordResetHelp}</small>
    </form>
  }else{
    authForm=<form onSubmit={signIn}>
      <label>{a.email}<input type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="username" required/></label>
      <PasswordField id="login-password" label={a.password} value={password} onChange={event=>setPassword(event.target.value)} visible={showPassword} onToggle={()=>setShowPassword(value=>!value)} labels={pui} autoComplete="current-password"/>
      <button className="primary full">{t.login}</button>
      <button type="button" className="linkBtn full" onClick={openResetRequest}>{lt.passwordReset}</button>
      <small className="authHelp">{lt.passwordResetHelp}</small>
    </form>
  }

  const title=screen==='register'?a.registerTitle:screen==='recovery'?recoveryCopy.title:screen==='request-reset'?lt.passwordReset:a.protected
  const returnToLogin=screen==='register'||screen==='recovery'||screen==='request-reset'
  const c=v131AuthCopy[language]||v131AuthCopy.de
  const showOverview=screen==='login'||screen==='register'

  return <>
    <main className="center">
      <section className="card authCard">
        <ProductBrand showDescriptor language={language}/>
        <div className="languageSwitch"><span>{t.language}</span><LanguageSwitcher value={language} onChange={setLanguage} label={t.language}/></div>
        {showOverview&&<div style={{margin:'12px 0 18px',padding:'14px',border:'1px solid var(--line, #d9dee8)',borderRadius:'14px',background:'var(--soft, #f7f9fc)'}}>
          <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap',marginBottom:'6px'}}><strong>{c.headline}</strong><span style={{fontSize:'12px',padding:'3px 8px',borderRadius:'999px',border:'1px solid currentColor'}}>{c.badge}</span></div>
          <p className="muted" style={{marginTop:0}}>{c.lead}</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:'8px'}}>
            {c.features.map(([icon,label,text])=><div key={label} style={{padding:'9px 10px',borderRadius:'10px',background:'var(--card, #fff)',border:'1px solid var(--line, #e3e7ee)'}}><div style={{fontWeight:700}}>{icon} {label}</div><small className="muted">{text}</small></div>)}
          </div>
          <div aria-label="V131 current capabilities" style={{display:'flex',gap:'7px',flexWrap:'wrap',marginTop:'12px'}}>
            {v131CurrentHighlights.map(([icon,label])=><span key={label} style={{fontSize:'12px',padding:'5px 8px',borderRadius:'999px',background:'var(--card, #fff)',border:'1px solid var(--line, #e3e7ee)'}}>{icon} {label}</span>)}
          </div>
          <p className="muted" style={{marginBottom:'8px',fontSize:'13px'}}>{c.hint}</p>
          <div style={{display:'grid',gap:'8px'}}>
            <button type="button" className="linkBtn full" onClick={()=>{resetSensitiveFields();setScreen('public')}}>{c.explain}</button>
            <a className="secondary btn full" href="/testen">🎟️ Persönlichen Testzugang anfragen / Request tester access</a>
            <a className="secondary btn full" href="/tester-freischalten">🔑 Tester-Code einlösen / Redeem tester code</a>
          </div>
        </div>}
        <p className="muted">{title}</p>
        {screen==='register'&&<div className="registerTransparency"><b>{tt.registerTitle}</b><p>{tt.registerNote}</p><span>✓ {a.noSubscription}</span></div>}
        {authForm}
        {message&&<div className="note" role="status">{message}</div>}
        <button className="linkBtn full" onClick={()=>{resetSensitiveFields();setScreen(returnToLogin?'login':'register')}}>{returnToLogin?recoveryCopy.back:a.newHere}</button>
        <button className="backBtn full authBackBtn" data-persistent-back type="button" onClick={()=>{resetSensitiveFields();setScreen('public')}}>{a.backExplanation}</button>
      </section>
    </main>
    <LegalFooter language={language}/>
  </>
}