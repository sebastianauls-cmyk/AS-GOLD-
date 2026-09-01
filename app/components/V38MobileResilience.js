export function V38MobileResilience(){
  return <style>{`
    .v38DeadlineWarningCard,.v38PrimaryNextStep,.v38AssessmentWhy{max-width:100%;min-width:0;overflow-wrap:anywhere;word-break:break-word}
    .v38DeadlineWarningCard .detailCardHead,.v38PrimaryNextStep .detailCardHead{min-width:0;gap:12px;flex-wrap:wrap}
    .v38DeadlineWarningCard p,.v38PrimaryNextStep p,.v38AssessmentWhy p{max-width:100%;white-space:normal}
    @media(max-width:560px){
      .v38DeadlineWarningCard,.v38PrimaryNextStep{padding:16px;margin:12px 0;border-radius:14px}
      .v38DeadlineWarningCard .detailCardHead,.v38PrimaryNextStep .detailCardHead{align-items:flex-start}
      .v38DeadlineWarningCard .detailCardHead strong,.v38PrimaryNextStep .detailCardHead strong{max-width:100%;white-space:normal;text-align:left}
      .v38PrimaryNextStep p[style]{font-size:1.05rem!important}
      .v38AssessmentWhy>div{padding:9px!important}
      .flagLanguagePublicPicker{width:100%!important;align-items:stretch!important}
      .flagLanguagePublicPicker>button{max-width:100%!important}
      .flagLanguagePublicPicker [role="listbox"]{width:min(100%,320px)!important;max-width:calc(100vw - 24px)!important}
    }
  `}</style>
}
