const COPY=Object.freeze({
  de:{pending:'Anmeldung wird geprüft …',slow:'Die Anmeldung dauert länger als erwartet. Eine Bestätigung liegt noch nicht vor. Sie können die Seite neu laden und es erneut versuchen.',loading:'Arbeitsbereich wird geladen …',reload:'Seite neu laden'},
  en:{pending:'Checking sign-in …',slow:'Sign-in is taking longer than expected. It has not been confirmed yet. You can reload the page and try again.',loading:'Loading workspace …',reload:'Reload page'},
  fr:{pending:'Vérification de la connexion …',slow:'La connexion prend plus de temps que prévu. Elle n’est pas encore confirmée. Vous pouvez recharger la page et réessayer.',loading:'Chargement de l’espace de travail …',reload:'Recharger la page'},
  tr:{pending:'Giriş kontrol ediliyor …',slow:'Giriş beklenenden uzun sürüyor. Henüz onaylanmadı. Sayfayı yenileyip tekrar deneyebilirsiniz.',loading:'Çalışma alanı yükleniyor …',reload:'Sayfayı yenile'},
  pl:{pending:'Sprawdzanie logowania …',slow:'Logowanie trwa dłużej niż oczekiwano. Nie zostało jeszcze potwierdzone. Możesz odświeżyć stronę i spróbować ponownie.',loading:'Ładowanie obszaru roboczego …',reload:'Odśwież stronę'},
  ru:{pending:'Проверка входа …',slow:'Вход занимает больше времени, чем ожидалось. Он ещё не подтверждён. Можно обновить страницу и повторить попытку.',loading:'Загрузка рабочего пространства …',reload:'Обновить страницу'},
  ar:{pending:'جارٍ التحقق من تسجيل الدخول …',slow:'يستغرق تسجيل الدخول وقتاً أطول من المتوقع. لم يتم تأكيده بعد. يمكنك إعادة تحميل الصفحة والمحاولة مرة أخرى.',loading:'جارٍ تحميل مساحة العمل …',reload:'إعادة تحميل الصفحة'},
  fa:{pending:'در حال بررسی ورود …',slow:'ورود بیش از حد انتظار طول کشیده است. هنوز تأیید نشده است. می‌توانید صفحه را دوباره بارگذاری کنید و مجدداً تلاش کنید.',loading:'در حال بارگذاری فضای کاری …',reload:'بارگذاری مجدد صفحه'},
  ro:{pending:'Se verifică autentificarea …',slow:'Autentificarea durează mai mult decât era de așteptat. Nu a fost încă confirmată. Puteți reîncărca pagina și încerca din nou.',loading:'Se încarcă spațiul de lucru …',reload:'Reîncarcă pagina'},
  bg:{pending:'Проверка на входа …',slow:'Входът отнема повече време от очакваното. Все още не е потвърден. Можете да презаредите страницата и да опитате отново.',loading:'Зареждане на работното пространство …',reload:'Презареди страницата'},
  vi:{pending:'Đang kiểm tra đăng nhập …',slow:'Đăng nhập mất nhiều thời gian hơn dự kiến. Chưa có xác nhận đăng nhập. Bạn có thể tải lại trang và thử lại.',loading:'Đang tải không gian làm việc …',reload:'Tải lại trang'}
})

export function getSignInProgressCopy(language='de'){
  return COPY[language]||COPY.de
}
