'use client'

import { useEffect } from 'react'

const copy={
  de:{start:'Fall starten',login:'Bereits registriert? Anmelden'},
  en:{start:'Start case',login:'Already registered? Sign in'},
  fr:{start:'Commencer le dossier',login:'Déjà inscrit ? Se connecter'},
  tr:{start:'Dosyayı başlat',login:'Zaten kayıtlı mısınız? Giriş yapın'},
  pl:{start:'Rozpocznij sprawę',login:'Masz już konto? Zaloguj się'},
  ru:{start:'Начать дело',login:'Уже зарегистрированы? Войти'},
  ar:{start:'ابدأ الحالة',login:'مسجل بالفعل؟ تسجيل الدخول'},
  fa:{start:'شروع پرونده',login:'قبلاً ثبت‌نام کرده‌اید؟ ورود'},
  ro:{start:'Începe cazul',login:'Aveți deja cont? Autentificare'},
  bg:{start:'Започнете случая',login:'Вече сте регистрирани? Вход'}
}

function lang(){const value=(document.documentElement.lang||'de').toLowerCase().slice(0,2);return copy[value]?value:'de'}
function clickExisting(pattern){
  const target=[...document.querySelectorAll('button,a')].find(el=>!el.closest('#asgold-v47-simple-start')&&pattern.test((el.textContent||'').trim()))
  if(target){target.click();return true}
  return false
}

export function V47SimplifiedPublicStart(){
  useEffect(()=>{
    if(location.pathname!=='/')return
    let ready=false
    const simplify=()=>{
      const stack=document.getElementById('asgold-language-order-stack')
      if(!stack||!stack.querySelector('[data-v44-interface]')||!stack.querySelector('[data-v44-output]'))return
      const host=stack.parentElement
      if(!host)return
      document.body.classList.add('asgold-v47-simple')
      let panel=document.getElementById('asgold-v47-simple-start')
      if(!panel){
        panel=document.createElement('section')
        panel.id='asgold-v47-simple-start'
        panel.dataset.v47SimpleStart='true'
        panel.innerHTML='<button type="button" data-v47-start></button><button type="button" data-v47-login></button>'
        stack.insertAdjacentElement('afterend',panel)
      }
      const t=copy[lang()]
      const start=panel.querySelector('[data-v47-start]')
      const login=panel.querySelector('[data-v47-login]')
      start.textContent=t.start
      login.textContent=t.login
      start.onclick=()=>{
        const section=document.getElementById('fallarten')||document.querySelector('[data-problem-navigator],#asgold-problem-slot,.problemNavigator')
        if(section){section.scrollIntoView({behavior:'smooth',block:'start'});return}
        clickExisting(/Fallarten|Case types|Types de cas|Vaka türleri|Rodzaje spraw|Типы дел|أنواع الحالات|انواع پرونده|Tipuri de caz|Видове случаи/i)
      }
      login.onclick=()=>{
        if(!clickExisting(/^Anmelden$|^Sign in$|^Se connecter$|^Giriş yap$|^Zaloguj się$|^Войти$|^تسجيل الدخول$|^ورود$|^Autentificare$|^Вход$/i)) location.href='/?start=login'
      }
      ready=true
    }
    const style=document.createElement('style')
    style.id='asgold-v47-simple-style'
    style.textContent=`
      #asgold-v47-simple-start{display:grid;gap:8px;width:100%;max-width:560px;margin:0 0 18px}
      #asgold-v47-simple-start [data-v47-start]{min-height:54px;border:0;border-radius:14px;padding:13px 18px;background:#9b792b;color:#fff;font-weight:900;font-size:1.08rem;box-shadow:0 8px 24px rgba(82,64,22,.18)}
      #asgold-v47-simple-start [data-v47-login]{min-height:42px;border:0;background:transparent;color:#394150;font-weight:750;font-size:.94rem;text-decoration:underline;text-underline-offset:3px}
      body.asgold-v47-simple .publicTop .nav>nav{display:none!important}
      body.asgold-v47-simple #asgold-v43-visible-controls{display:none!important}
      @media(max-width:560px){#asgold-language-order-stack{margin-bottom:8px!important}#asgold-v47-simple-start{margin-bottom:12px}#asgold-v47-simple-start [data-v47-start]{min-height:56px;font-size:1.12rem}}
    `
    document.head.appendChild(style)
    simplify()
    const observer=new MutationObserver(simplify)
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['lang']})
    const timer=setInterval(simplify,700)
    return()=>{observer.disconnect();clearInterval(timer);document.body.classList.remove('asgold-v47-simple');document.getElementById('asgold-v47-simple-start')?.remove();style.remove()}
  },[])
  return null
}
