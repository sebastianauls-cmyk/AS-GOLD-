'use client'

import { useEffect } from 'react'

const copy={
  de:{start:'Fall starten',login:'Bereits registriert? Anmelden',headline:'Was ist passiert?',sub:'Wählen Sie Ihr Thema. AS Gold führt Sie danach Schritt für Schritt weiter.',more:'Weitere Themen',why:'Vom Dokument zum klaren Fall',whyLead:'AS Gold ordnet Ihre Unterlagen, erkennt Zusammenhänge und führt den Vorgang nachvollziehbar weiter.',benefits:['Dokumente zusammenführen und zuordnen','Fristen, Risiken und offene Punkte sichtbar machen','Einen priorisierten nächsten Schritt anzeigen','Fallakte, Schreiben und Übergabe für Berater vorbereiten'],cats:[['Arbeit & Kündigung','Kündigung, Arbeitszeugnis, Lohn, Aufhebungsvertrag'],['Behörden & Leistungen','Bescheid, Bürgergeld, Wohngeld, Widerspruch'],['Verkehr & Bußgeld','Bußgeld, Fahrverbot, Unfall, MPU'],['Verträge & Forderungen','Vertrag, Rechnung, Mahnung, Inkasso'],['Versicherung & Schäden','Schaden, Ablehnung, Regulierung'],['Wohnen & Miete','Mietvertrag, Kündigung, Nebenkosten'],['Familie & Erbe','Trennung, Unterhalt, Nachlass, Erbe'],['Sonstiger Vorgang','Wenn Ihr Thema nicht eindeutig passt']]},
  en:{start:'Start case',login:'Already registered? Sign in',headline:'What happened?',sub:'Choose your topic. AS Gold then guides you step by step.',more:'More topics',why:'From document to a clear case',whyLead:'AS Gold organizes your documents, connects the facts and guides the matter forward in a traceable way.',benefits:['Connect and assign documents','Surface deadlines, risks and missing information','Show one prioritized next step','Prepare a case file, letters and professional handoff'],cats:[['Work & termination','Termination, reference, pay, settlement'],['Authorities & benefits','Decision, benefits, objection'],['Traffic & fines','Fine, driving ban, accident'],['Contracts & claims','Contract, invoice, reminder, debt collection'],['Insurance & damage','Damage, denial, settlement'],['Housing & rent','Lease, termination, service charges'],['Family & inheritance','Separation, support, estate'],['Other matter','If your topic does not fit clearly']]},
  fr:{start:'Commencer le dossier',login:'Déjà inscrit ? Se connecter',headline:'Que s’est-il passé ?',sub:'Choisissez votre sujet. AS Gold vous guide ensuite étape par étape.',more:'Autres sujets',why:'Du document au dossier clair',whyLead:'AS Gold organise vos documents, relie les informations et fait avancer le dossier de manière traçable.',benefits:['Relier et classer les documents','Afficher délais, risques et informations manquantes','Montrer une prochaine étape prioritaire','Préparer dossier, courriers et transmission professionnelle'],cats:[['Travail & licenciement','Licenciement, salaire, certificat'],['Administrations & prestations','Décision, prestation, recours'],['Circulation & amendes','Amende, interdiction, accident'],['Contrats & créances','Contrat, facture, relance'],['Assurance & dommages','Sinistre, refus, règlement'],['Logement & loyer','Bail, résiliation, charges'],['Famille & succession','Séparation, pension, héritage'],['Autre situation','Si votre sujet ne correspond pas clairement']]},
}

function lang(){const value=(document.documentElement.lang||'de').toLowerCase().slice(0,2);return copy[value]?value:'de'}
function clickExisting(pattern){
  const target=[...document.querySelectorAll('button,a')].find(el=>!el.closest('#asgold-v47-simple-start')&&pattern.test((el.textContent||'').trim()))
  if(target){target.click();return true}
  return false
}
function topicPattern(name){return new RegExp(name.split('&')[0].trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i')}

export function V47SimplifiedPublicStart(){
  useEffect(()=>{
    if(location.pathname!=='/')return
    const simplify=()=>{
      const stack=document.getElementById('asgold-language-order-stack')
      if(!stack||!stack.querySelector('[data-v44-interface]')||!stack.querySelector('[data-v44-output]'))return
      document.body.classList.add('asgold-v47-simple')
      let panel=document.getElementById('asgold-v47-simple-start')
      if(!panel){
        panel=document.createElement('section')
        panel.id='asgold-v47-simple-start'
        panel.dataset.v47SimpleStart='true'
        panel.innerHTML='<div data-v47-problem><h2></h2><p></p><div data-v47-topics></div><button type="button" data-v47-more></button></div><div data-v47-value><strong></strong><p></p><ul></ul></div><button type="button" data-v47-start></button><button type="button" data-v47-login></button>'
        stack.insertAdjacentElement('afterend',panel)
      }
      const t=copy[lang()]||copy.de
      const problem=panel.querySelector('[data-v47-problem]')
      problem.querySelector('h2').textContent=t.headline
      problem.querySelector('p').textContent=t.sub
      const topics=problem.querySelector('[data-v47-topics]')
      const expanded=topics.dataset.expanded==='true'
      topics.innerHTML=''
      t.cats.forEach(([name,desc],i)=>{
        const b=document.createElement('button')
        b.type='button';b.dataset.v47Topic=String(i);b.hidden=!expanded&&i>3
        b.innerHTML=`<b>${name}</b><span>${desc}</span>`
        b.onclick=()=>{
          const target=[...document.querySelectorAll('#fallarten button,#fallarten a,[data-problem-navigator] button,.problemNavigator button')].find(el=>topicPattern(name).test(el.textContent||''))
          if(target){target.click();return}
          const section=document.getElementById('fallarten')||document.querySelector('[data-problem-navigator],#asgold-problem-slot,.problemNavigator')
          section?.scrollIntoView({behavior:'smooth',block:'start'})
        }
        topics.appendChild(b)
      })
      const more=problem.querySelector('[data-v47-more]')
      more.textContent=t.more
      more.hidden=expanded
      more.onclick=()=>{topics.dataset.expanded='true';simplify()}

      const value=panel.querySelector('[data-v47-value]')
      value.querySelector('strong').textContent=t.why
      value.querySelector('p').textContent=t.whyLead
      value.querySelector('ul').innerHTML=t.benefits.map(x=>`<li>${x}</li>`).join('')

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
    }
    const style=document.createElement('style')
    style.id='asgold-v47-simple-style'
    style.textContent=`
      #asgold-v47-simple-start{display:grid;gap:12px;width:100%;max-width:760px;margin:0 0 18px}
      #asgold-v47-simple-start [data-v47-problem]{padding:16px;border:1px solid #e1d3a8;border-radius:16px;background:#fffdf8}
      #asgold-v47-simple-start [data-v47-problem] h2{margin:0 0 5px;font-size:1.3rem;color:#262b33}
      #asgold-v47-simple-start [data-v47-problem]>p{margin:0 0 12px;color:#5b6470}
      #asgold-v47-simple-start [data-v47-topics]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      #asgold-v47-simple-start [data-v47-topic]{min-height:74px;text-align:left;padding:11px 12px;border:1px solid #d7c58f;border-radius:12px;background:#fff;color:#292d33}
      #asgold-v47-simple-start [data-v47-topic] b,#asgold-v47-simple-start [data-v47-topic] span{display:block}
      #asgold-v47-simple-start [data-v47-topic] b{font-size:.98rem;margin-bottom:3px}#asgold-v47-simple-start [data-v47-topic] span{font-size:.82rem;color:#68717c;line-height:1.35}
      #asgold-v47-simple-start [data-v47-more]{margin-top:9px;border:0;background:transparent;text-decoration:underline;color:#555;font-weight:800}
      #asgold-v47-simple-start [data-v47-value]{padding:14px 16px;border-radius:15px;background:#f2f5f7;border:1px solid #dfe4e8}
      #asgold-v47-simple-start [data-v47-value]>strong{font-size:1.04rem;color:#20262c}#asgold-v47-simple-start [data-v47-value]>p{margin:5px 0 8px;color:#59636e;line-height:1.45}
      #asgold-v47-simple-start [data-v47-value] ul{margin:0;padding-left:19px;display:grid;gap:4px;color:#3f4952;font-size:.9rem}
      #asgold-v47-simple-start [data-v47-start]{min-height:54px;border:0;border-radius:14px;padding:13px 18px;background:#9b792b;color:#fff;font-weight:900;font-size:1.08rem;box-shadow:0 8px 24px rgba(82,64,22,.18)}
      #asgold-v47-simple-start [data-v47-login]{min-height:42px;border:0;background:transparent;color:#394150;font-weight:750;font-size:.94rem;text-decoration:underline;text-underline-offset:3px}
      body.asgold-v47-simple .publicTop .nav>nav{display:none!important}
      body.asgold-v47-simple #asgold-v43-visible-controls{display:none!important}
      @media(max-width:560px){#asgold-language-order-stack{margin-bottom:8px!important}#asgold-v47-simple-start{margin-bottom:12px;gap:10px}#asgold-v47-simple-start [data-v47-topics]{grid-template-columns:1fr}#asgold-v47-simple-start [data-v47-start]{min-height:56px;font-size:1.12rem}}
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
