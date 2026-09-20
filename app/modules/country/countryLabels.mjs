const labels={de:'Land / Rechtsraum',en:'Country / jurisdiction',fr:'Pays / juridiction',tr:'Ülke / hukuk alanı',pl:'Kraj / jurysdykcja',ru:'Страна / юрисдикция',ar:'الدولة / الاختصاص القانوني',fa:'کشور / حوزه قضایی',ro:'Țară / jurisdicție',bg:'Държава / юрисдикция',vi:'Quốc gia / phạm vi pháp lý'}
export function countrySwitcherLabel(language='de') {return labels[language]||labels.de}
