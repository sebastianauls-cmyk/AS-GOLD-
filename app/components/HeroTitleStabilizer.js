'use client'

import { useEffect } from 'react'
import { whatIsAsGoldCopy } from '../lib/asGoldIntroCopy.mjs'

const copy={
  de:{title:'Was ist AS Gold?',lead:'AS Gold ist eine digitale Anwendung, die Dokumente, E-Mails und Ihre eigene Schilderung zu einem verständlichen Fall zusammenführt. Sie erkennt wichtige Informationen, Fristen und Risiken und zeigt den nächsten sinnvollen Schritt.'},
  en:{title:'What is AS Gold?',lead:'AS Gold is a digital application that brings documents, emails and your own description together in one understandable case. It identifies important information, deadlines and risks and shows the next sensible step.'},
  fr:{title:'Qu’est-ce qu’AS Gold ?',lead:'AS Gold est une application numérique qui réunit documents, e-mails et votre propre description dans un dossier compréhensible. Elle repère les informations importantes, les délais et les risques et indique la prochaine étape utile.'},
  tr:{title:'AS Gold nedir?',lead:'AS Gold; belgeleri, e-postaları ve kendi anlatımınızı anlaşılır bir dosyada birleştiren dijital bir uygulamadır. Önemli bilgileri, süreleri ve riskleri belirler ve sonraki mantıklı adımı gösterir.'},
  pl:{title:'Czym jest AS Gold?',lead:'AS Gold to aplikacja cyfrowa, która łączy dokumenty, e-maile i własny opis w jedną zrozumiałą sprawę. Rozpoznaje ważne informacje, terminy i ryzyka oraz wskazuje kolejny rozsądny krok.'},
  ru:{title:'Что такое AS Gold?',lead:'AS Gold — это цифровое приложение, которое объединяет документы, электронные письма и ваше описание в одно понятное дело. Оно выявляет важную информацию, сроки и риски и показывает следующий разумный шаг.'},
  ar:{title:'ما هو AS Gold؟',lead:'AS Gold تطبيق رقمي يجمع المستندات والبريد الإلكتروني ووصفك الشخصي في حالة واحدة واضحة. يحدد المعلومات المهمة والمواعيد والمخاطر ويعرض الخطوة المنطقية التالية.'},
  fa:{title:'AS Gold چیست؟',lead:'AS Gold یک برنامه دیجیتال است که اسناد، ایمیل‌ها و توضیحات شما را در یک پرونده روشن کنار هم قرار می‌دهد. اطلاعات مهم، مهلت‌ها و ریسک‌ها را شناسایی می‌کند و گام منطقی بعدی را نشان می‌دهد.'},
  ro:{title:'Ce este AS Gold?',lead:'AS Gold este o aplicație digitală ce reunește documentele, e-mailurile și descrierea dvs. într-un caz ușor de înțeles. Identifică informațiile importante, termenele și riscurile și arată următorul pas potrivit.'},
  bg:{title:'Какво е AS Gold?',lead:'AS Gold е цифрово приложение, което обединява документи, имейли и вашето описание в един разбираем случай. То открива важната информация, сроковете и рисковете и показва следващата разумна стъпка.'},
  vi:{title:'AS Gold là gì?',lead:'AS Gold là ứng dụng số kết hợp tài liệu, email và mô tả của bạn thành một hồ sơ dễ hiểu. Ứng dụng nhận diện thông tin quan trọng, thời hạn và rủi ro, rồi chỉ ra bước hợp lý tiếp theo.'}
}

export function HeroTitleStabilizer(){
  useEffect(()=>{
    if(location.pathname!=='/') return
    let scheduled=false
    const apply=()=>{
      scheduled=false
      const language=(document.documentElement.lang||'de').split('-')[0]
      const c=whatIsAsGoldCopy[language]||whatIsAsGoldCopy.de
      const title=document.querySelector('.hero h1')
      const lead=document.querySelector('.hero .lead')
      if(title&&title.textContent!==c.title) title.textContent=c.title
      if(lead&&lead.textContent!==c.lead) lead.textContent=c.lead
    }
    const schedule=()=>{
      if(scheduled) return
      scheduled=true
      requestAnimationFrame(apply)
    }
    apply()
    const observer=new MutationObserver(schedule)
    observer.observe(document.body,{subtree:true,childList:true})
    const langObserver=new MutationObserver(schedule)
    langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']})
    const timer=setTimeout(apply,250)
    return()=>{observer.disconnect();langObserver.disconnect();clearTimeout(timer)}
  },[])
  return null
}
