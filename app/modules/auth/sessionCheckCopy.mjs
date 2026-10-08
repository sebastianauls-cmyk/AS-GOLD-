const copy={
  de:{unavailable:'Ihre Anmeldung konnte nicht geprüft werden. Bitte laden Sie diese Seite erneut.',retry:'Seite neu laden'},
  en:{unavailable:'Your sign-in could not be checked. Please reload this page.',retry:'Reload page'},
  fr:{unavailable:'Votre connexion n’a pas pu être vérifiée. Veuillez recharger cette page.',retry:'Recharger la page'},
  tr:{unavailable:'Oturumunuz kontrol edilemedi. Lütfen bu sayfayı yeniden yükleyin.',retry:'Sayfayı yeniden yükle'},
  pl:{unavailable:'Nie udało się sprawdzić logowania. Załaduj tę stronę ponownie.',retry:'Załaduj stronę ponownie'},
  ru:{unavailable:'Не удалось проверить ваш вход. Пожалуйста, перезагрузите эту страницу.',retry:'Перезагрузить страницу'},
  ar:{unavailable:'تعذّر التحقق من تسجيل دخولك. يرجى إعادة تحميل هذه الصفحة.',retry:'إعادة تحميل الصفحة'},
  fa:{unavailable:'ورود شما بررسی نشد. لطفاً این صفحه را دوباره بارگذاری کنید.',retry:'بارگذاری دوباره صفحه'},
  ro:{unavailable:'Autentificarea nu a putut fi verificată. Reîncărcați această pagină.',retry:'Reîncarcă pagina'},
  bg:{unavailable:'Входът ви не можа да бъде проверен. Моля, презаредете тази страница.',retry:'Презареди страницата'},
  vi:{unavailable:'Không thể kiểm tra trạng thái đăng nhập của bạn. Vui lòng tải lại trang này.',retry:'Tải lại trang'}
}

export function getSessionCheckCopy(language='de'){return copy[language]||copy.de}
