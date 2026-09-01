import fs from 'node:fs'

const write=(p,c)=>fs.writeFileSync(p,c)
const read=p=>fs.readFileSync(p,'utf8')

write('app/modules/tester/TesterShareButton.js',`'use client'

import { useContext, useMemo, useState } from 'react'
import { LegalLanguageContext } from '../language/LegalLanguageContext'

const testerUrl='https://app-gold-workspace.vercel.app/testen'
const copy={
  de:{button:'An Tester weiterleiten',whatsapp:'Per WhatsApp senden',open:'AS Gold öffnen',text:'Hallo, bitte teste AS Gold einmal auf deinem Handy. Prüfe besonders die Verständlichkeit, Sprachwahl, Mikrofonfunktion und Zurück-Buttons. Bitte verwende nur Testdaten.',shared:'Das Teilen-Menü wurde geöffnet.',copied:'Der Tester-Link wurde kopiert und kann jetzt eingefügt werden.',manual:'Bitte kopieren Sie den unten angezeigten Tester-Link.'},
  en:{button:'Share with testers',whatsapp:'Send via WhatsApp',open:'Open AS Gold',text:'Hello, please test AS Gold on your phone. Focus on clarity, language selection, microphone input and back buttons. Please use test data only.',shared:'The sharing menu was opened.',copied:'The tester link was copied and is ready to paste.',manual:'Please copy the tester link shown below.'},
  fr:{button:'Partager avec des testeurs',whatsapp:'Envoyer par WhatsApp',open:'Ouvrir AS Gold',text:'Bonjour, merci de tester AS Gold sur votre téléphone. Vérifiez surtout la clarté, le choix de la langue, le microphone et les boutons de retour. Utilisez uniquement des données de test.',shared:'Le menu de partage a été ouvert.',copied:'Le lien de test a été copié.',manual:'Veuillez copier le lien de test ci-dessous.'},
  tr:{button:'Test kullanıcılarına ilet',whatsapp:'WhatsApp ile gönder',open:'AS Gold’u aç',text:'Merhaba, lütfen AS Gold’u telefonunuzda test edin. Özellikle anlaşılırlığı, dil seçimini, mikrofonu ve geri düğmelerini kontrol edin. Yalnızca test verileri kullanın.',shared:'Paylaşım menüsü açıldı.',copied:'Test bağlantısı kopyalandı.',manual:'Lütfen aşağıdaki test bağlantısını kopyalayın.'},
  pl:{button:'Udostępnij testerom',whatsapp:'Wyślij przez WhatsApp',open:'Otwórz AS Gold',text:'Cześć, proszę przetestuj AS Gold na telefonie. Sprawdź zwłaszcza czytelność, wybór języka, mikrofon i przyciski powrotu. Używaj wyłącznie danych testowych.',shared:'Otwarto menu udostępniania.',copied:'Link testowy został skopiowany.',manual:'Skopiuj poniższy link testowy.'},
  ru:{button:'Отправить тестировщикам',whatsapp:'Отправить через WhatsApp',open:'Открыть AS Gold',text:'Здравствуйте! Пожалуйста, протестируйте AS Gold на телефоне. Обратите внимание на понятность, выбор языка, микрофон и кнопки возврата. Используйте только тестовые данные.',shared:'Меню отправки открыто.',copied:'Ссылка для тестирования скопирована.',manual:'Скопируйте ссылку для тестирования ниже.'},
  ar:{button:'مشاركة الرابط مع المختبرين',whatsapp:'إرسال عبر واتساب',open:'فتح AS Gold',text:'مرحباً، يرجى اختبار AS Gold على هاتفك، وخاصة وضوح الاستخدام واختيار اللغة والميكروفون وأزرار الرجوع. استخدم بيانات اختبار فقط.',shared:'تم فتح قائمة المشاركة.',copied:'تم نسخ رابط الاختبار.',manual:'يرجى نسخ رابط الاختبار أدناه.'},
  fa:{button:'ارسال برای آزمایش‌کنندگان',whatsapp:'ارسال با واتساپ',open:'باز کردن AS Gold',text:'سلام، لطفاً AS Gold را روی تلفن خود آزمایش کنید. به وضوح، انتخاب زبان، میکروفون و دکمه‌های بازگشت توجه کنید. فقط از داده‌های آزمایشی استفاده کنید.',shared:'منوی اشتراک‌گذاری باز شد.',copied:'پیوند آزمایش کپی شد.',manual:'لطفاً پیوند آزمایش زیر را کپی کنید.'},
  ro:{button:'Trimite testerilor',whatsapp:'Trimite prin WhatsApp',open:'Deschide AS Gold',text:'Bună, te rog testează AS Gold pe telefon. Verifică mai ales claritatea, alegerea limbii, microfonul și butoanele de întoarcere. Folosește numai date de test.',shared:'Meniul de partajare a fost deschis.',copied:'Linkul de test a fost copiat.',manual:'Copiați linkul de test de mai jos.'},
  bg:{button:'Изпрати на тестери',whatsapp:'Изпрати чрез WhatsApp',open:'Отвори AS Gold',text:'Здравейте, моля тествайте AS Gold на телефона си. Проверете най-вече яснотата, избора на език, микрофона и бутоните за връщане. Използвайте само тестови данни.',shared:'Менюто за споделяне е отворено.',copied:'Тестовият линк е копиран.',manual:'Моля, копирайте тестовия линк по-долу.'}
}

export function TesterShareButton(){
  const language=useContext(LegalLanguageContext)||'de'
  const c=copy[language]||copy.de
  const [status,setStatus]=useState('')
  const whatsappHref=useMemo(()=>\`https://wa.me/?text=\${encodeURIComponent(\`\${c.text}\\n\\n\${testerUrl}\`)}\`,[c.text])

  async function share(){
    const shareData={title:'AS Gold testen',text:c.text,url:testerUrl}
    try{
      if(navigator.share&&(!navigator.canShare||navigator.canShare(shareData))){
        await navigator.share(shareData)
        setStatus(c.shared)
        return
      }
    }catch(error){if(error?.name==='AbortError')return}
    try{
      await navigator.clipboard.writeText(\`\${c.text}\\n\\n\${testerUrl}\`)
      setStatus(c.copied)
      return
    }catch{}
    const helper=document.createElement('textarea')
    helper.value=\`\${c.text}\\n\\n\${testerUrl}\`
    helper.setAttribute('readonly','')
    helper.style.position='fixed'
    helper.style.opacity='0'
    document.body.appendChild(helper)
    helper.select()
    const copied=document.execCommand('copy')
    helper.remove()
    setStatus(copied?c.copied:c.manual)
  }

  return <div className="testerShareBox">
    <div className="testerShareActions">
      <button type="button" className="primary btn" onClick={share}>📤 {c.button}</button>
      <a className="secondary btn" href={whatsappHref} target="_blank" rel="noreferrer">💬 {c.whatsapp}</a>
      <a className="secondary btn" href="/">↗ {c.open}</a>
    </div>
    <code className="testerShareUrl">{testerUrl}</code>
    {status&&<p className="testerShareStatus" role="status" aria-live="polite">✓ {status}</p>}
  </div>
}
`)

write('app/components/TesterShareButton.js',`export { TesterShareButton } from '../modules/tester/TesterShareButton'\n`)

write('app/modules/tester/TesterGuide.js',`import { LegalDocument, LegalNotice, LegalSection } from '../compliance/LegalDocument'
import { TesterShareButton } from './TesterShareButton'

export function TesterGuide(){
  return <LegalDocument pageId="testen" eyebrow="Testerbetrieb V70" title="AS Gold V70 sicher ausprobieren" intro="Hier können Sie den vollständigen V70-Ablauf prüfen, den Link weiterleiten und ohne echte Kundendaten oder eine Zahlung testen." updated="1. September 2026" localizedExtra={<TesterShareButton/>} localizedExtraAfterSection={0}>
    <LegalSection title="Tester-Link weiterleiten">
      <p>Öffnen Sie mit einem Fingertipp das Teilen-Menü Ihres Handys oder senden Sie die vorbereitete Nachricht direkt per WhatsApp.</p>
      <TesterShareButton/>
    </LegalSection>
    <LegalNotice tone="warning"><b>Nur sichere Testdaten verwenden.</b><p>Bitte ausschließlich synthetische oder wirksam anonymisierte Unterlagen hochladen. Die Bezahlfunktion bleibt deaktiviert.</p></LegalNotice>
    <LegalSection title="Diese Punkte bitte prüfen"><ul>
      <li>Genau ein Sprachmenü und genau ein Zurück-Element im geöffneten Sprachmenü</li>
      <li>Zurück schließt das Sprachmenü zuverlässig, auch auf Mobilgeräten</li>
      <li>Oberflächensprache zuerst und getrennte Ausgabesprache danach</li>
      <li>Erklärvideo mit weiblicher und männlicher Variante</li>
      <li>Klare Navigation ohne offensichtliche Sackgassen</li>
      <li>Fristenwarnung, begründete Ampel, Fall-Timeline und genau ein priorisierter nächster Schritt</li>
      <li>Nachweislücken, dokumentübergreifende Abweichungen und daraus abgeleitete konkrete Aufgaben</li>
      <li>Professionelle Übergabeakte für Anwalt, Versicherung oder Berater</li>
      <li>Darstellung und Bedienung in allen 10 App-Sprachen</li>
    </ul></LegalSection>
    <LegalSection title="Synthetischer Musterfall"><p><a className="secondary btn" href="/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf">Musterdatei herunterladen</a></p><p>Die Musterdatei enthält keine echten personenbezogenen Daten und kann für Upload, Analyse, Ampel und Export verwendet werden.</p></LegalSection>
    <LegalSection title="Testfeedback"><p><a className="primary btn" href="mailto:sebastian.auls@gmail.com?subject=AS%20Gold%20V70%20Testfeedback">Feedback zu V70 senden</a></p><p>V70 ist ein kontrollierter Produkttest. Ergebnisse müssen vor einer verbindlichen Verwendung weiterhin geprüft und ausdrücklich freigegeben werden.</p></LegalSection>
  </LegalDocument>
}
`)

// Keep the public test route closed until the final modular release gate is green.
write('app/testen/page.js',`import { TesterPaused } from '../modules/tester/TesterPaused'\n\nexport const metadata={title:'AS Gold Testerzugang pausiert',description:'Der kontrollierte AS-Gold-Testerzugang bleibt bis zur vollständigen Modularisierungsabnahme geschlossen.'}\n\nexport default function TestingGuide(){return <TesterPaused/>}\n`)

write('scripts/test_v38_tester_guide.mjs',`import fs from 'node:fs'\n\nconst route=fs.readFileSync('app/testen/page.js','utf8')\nconst paused=fs.readFileSync('app/modules/tester/TesterPaused.js','utf8')\nif(!route.includes("../modules/tester/TesterPaused")) throw new Error('Tester route must explicitly import TesterPaused until final release')\nif(route.includes('TesterGuide')||route.includes('TesterShareButton')) throw new Error('Tester route must not expose the active guide/share flow before final release')\nfor(const text of ['Testerzugang vorübergehend geschlossen','Aktuell keine Testerfreigabe.','Bitte noch keinen Test starten und keine Testdaten hochladen.','Navigation vollständig geprüft und abgenommen','Testerzugang gezielt wieder freigegeben']){if(!paused.includes(text)) throw new Error('Paused tester guide missing: '+text)}\nfor(const forbidden of ['?start=register','Kostenlos testen','Musterdatei herunterladen']){if(paused.includes(forbidden)) throw new Error('Paused tester guide must not expose active action: '+forbidden)}\nconsole.log('V46 tester-lock guard passed: route is explicitly paused and exposes no active tester/share CTA before final release.')\n`)

write('scripts/test_v70_tester_sharing.mjs',`import assert from 'node:assert/strict'\nimport fs from 'node:fs'\nconst share=fs.readFileSync('app/modules/tester/TesterShareButton.js','utf8')\nconst adapter=fs.readFileSync('app/components/TesterShareButton.js','utf8')\nconst guide=fs.readFileSync('app/modules/tester/TesterGuide.js','utf8')\nconst page=fs.readFileSync('app/testen/page.js','utf8')\nassert.match(share,/navigator\\.share/)\nassert.match(share,/navigator\\.clipboard\\.writeText/)\nassert.match(share,/https:\\/\\/wa\\.me\\/\\?text=/)\nassert.match(share,/https:\\/\\/app-gold-workspace\\.vercel\\.app\\/testen/)\nassert.equal((share.match(/button:'[^']+'/g)||[]).length,10)\nassert.match(adapter,/modules\\/tester\\/TesterShareButton/)\nassert.match(guide,/AS Gold V70 sicher ausprobieren/)\nassert.match(guide,/<TesterShareButton\\/>/)\nassert.match(page,/TesterPaused/)\nassert.doesNotMatch(page,/TesterGuide|TesterShareButton/)\nconsole.log('V70 tester sharing is fully staged in the tester module while the public tester route remains safely closed.')\n`)

const pkg=JSON.parse(read('package.json'))
pkg.scripts['test:v70-tester-staged']='node scripts/test_v70_tester_sharing.mjs'
if(!pkg.scripts.prebuild.includes('test:v70-tester-staged')) pkg.scripts.prebuild+=' && npm run test:v70-tester-staged'
write('package.json',JSON.stringify(pkg,null,2)+'\n')

let docs=read('docs/APP_GOLD_MODULARISIERUNG_V46.md')
if(!docs.includes('### V70 Tester-Sharing modular vorbereitet')) docs+=`\n\n### V70 Tester-Sharing modular vorbereitet\n\n- Der aktuelle V70-Teilen-Flow ist als app/modules/tester/TesterShareButton.js mit zehn Sprachvarianten modular vorbereitet.\n- Der frühere app/components-Pfad ist nur ein Kompatibilitäts-Re-Export.\n- TesterGuide enthält den V70-Teilen-, WhatsApp-, Musterfall- und Feedback-Flow, ist aber noch nicht öffentlich geroutet.\n- app/testen/page.js rendert bis zum finalen Release-Gate ausdrücklich TesterPaused.\n- Ein eigener V70-Staging-Guard verhindert eine versehentliche vorzeitige Testerfreigabe.\n`
write('docs/APP_GOLD_MODULARISIERUNG_V46.md',docs)

console.log('V70 tester sharing staged modularly; public tester route remains closed.')
