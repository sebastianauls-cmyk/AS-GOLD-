export function AccessibilityHardening(){
  return <style>{`
    :where(button,a,input,select,textarea,[tabindex]):focus-visible{outline:3px solid #9b792b;outline-offset:3px}
    :where(button,a,input,select,textarea){scroll-margin-top:92px}
    :where(.detailCard,.actionCard,.assessment,.readinessCard,.itemRow,p,small,strong,b,h1,h2,h3,h4,label){overflow-wrap:anywhere;word-break:normal}
    textarea{resize:vertical;min-height:88px}
    @media(max-width:560px){
      :where(button,.primary,.secondary,.backBtn,.linkBtn,input,select){min-height:44px}
      :where(.v38DeadlineWarningCard,.v38PrimaryNextStep,.v38AssessmentWhy){max-width:100%;overflow:hidden}
    }
    @media(prefers-reduced-motion:reduce){
      *,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
    }
  `}</style>
}
