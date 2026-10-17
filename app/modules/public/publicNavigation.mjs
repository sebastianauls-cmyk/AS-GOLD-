const rows={
  de:['Meine Fälle','← Zu meinen Fällen','↑ Nach oben','Zum Seitenanfang'],
  en:['My cases','← Back to my cases','↑ Back to top','Back to the top of the page'],
  fr:['Mes dossiers','← Mes dossiers','↑ Haut de page','Retour en haut de la page'],
  tr:['Dosyalarım','← Dosyalarıma dön','↑ Yukarı','Sayfanın başına dön'],
  pl:['Moje sprawy','← Do moich spraw','↑ Na górę','Wróć na początek strony'],
  ru:['Мои дела','← К моим делам','↑ Наверх','Вернуться в начало страницы'],
  ar:['قضاياي','العودة إلى قضاياي →','↑ أعلى الصفحة','العودة إلى أعلى الصفحة'],
  fa:['پرونده‌های من','بازگشت به پرونده‌های من →','↑ بالای صفحه','بازگشت به بالای صفحه'],
  ro:['Cazurile mele','← La cazurile mele','↑ Sus','Înapoi la începutul paginii'],
  bg:['Моите случаи','← Към моите случаи','↑ Нагоре','Обратно в началото на страницата'],
  vi:['Hồ sơ của tôi','← Về hồ sơ của tôi','↑ Lên đầu trang','Quay lại đầu trang']
}

export function publicNavigationCopy(language='de'){
  const [workspace,returnToWorkspace,top,topDescription]=rows[language]||rows.de
  return {workspace,returnToWorkspace,top,topDescription}
}

// Reload the ordinary entry point so the current session AND server access
// are checked again. A remembered user only changes the link's label.
export function workspaceEntryHref(language='de'){
  return `/?${new URLSearchParams({start:'login',lang:Object.hasOwn(rows,language)?language:'de'})}`
}
