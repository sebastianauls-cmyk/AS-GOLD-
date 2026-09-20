const copy={
  de:{openAnalysis:'Zur KI-Analyse',prepareLetter:'Schreiben zur Freigabe vorbereiten',backToDocument:'Zurück zum Dokument'},
  en:{openAnalysis:'Go to AI analysis',prepareLetter:'Prepare letter for approval',backToDocument:'Back to document'},
  pl:{openAnalysis:'Przejdź do analizy AI',prepareLetter:'Przygotuj pismo do zatwierdzenia',backToDocument:'Wróć do dokumentu'},
  tr:{openAnalysis:'Yapay zekâ analizine git',prepareLetter:'Yazıyı onaya hazırla',backToDocument:'Belgeye dön'},
  ru:{openAnalysis:'Перейти к анализу ИИ',prepareLetter:'Подготовить письмо к согласованию',backToDocument:'Вернуться к документу'},
  ar:{openAnalysis:'الانتقال إلى تحليل الذكاء الاصطناعي',prepareLetter:'إعداد الخطاب للموافقة',backToDocument:'العودة إلى المستند'},
  fr:{openAnalysis:'Accéder à l’analyse IA',prepareLetter:'Préparer le courrier pour approbation',backToDocument:'Retour au document'},
  fa:{openAnalysis:'رفتن به تحلیل هوش مصنوعی',prepareLetter:'آماده‌سازی نامه برای تأیید',backToDocument:'بازگشت به سند'},
  ro:{openAnalysis:'Mergi la analiza AI',prepareLetter:'Pregătește scrisoarea pentru aprobare',backToDocument:'Înapoi la document'},
  bg:{openAnalysis:'Към AI анализа',prepareLetter:'Подготви писмото за одобрение',backToDocument:'Назад към документа'},
  vi:{openAnalysis:'Đi đến phân tích AI',prepareLetter:'Chuẩn bị thư để phê duyệt',backToDocument:'Quay lại tài liệu'}
}

export function documentNavigationCopy(language='de'){return copy[language]||copy.de}
