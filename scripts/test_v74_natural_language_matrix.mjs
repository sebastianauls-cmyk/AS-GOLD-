import assert from 'node:assert/strict'
import { recommendProblem } from '../app/modules/public/problemRecommendation.mjs'
import { getProblemLanguageProfile } from '../app/modules/public/problemLanguageCatalog.mjs'

const profile=getProblemLanguageProfile('de')
const cases=[
  ['R1','Auf der Stromrechnung steht ein Zahlendreher. Gefordert werden 286,40 EUR. Rechnung und Foto des Zählerstands sind vorhanden. Bitte kurz prüfen und eine Antwort vorbereiten.','start','contract'],
  ['R2','Aus der Rechnung über 1.147,92 EUR wurden Mahnung und Inkasso. Es läuft eine Frist für meinen Widerspruch.','klar','contract'],
  ['R3','Der Energieversorger hat eine Bonitätsmeldung veranlasst. Die Bank hat deshalb meine Kreditlinie gekürzt. Zusätzlich gibt es eine Sperrandrohung und widersprüchliche Unterlagen.','analyse','contract'],
  ['R4','Der Strom ist seit 56 Stunden gesperrt. Kühlware ist verdorben und es gibt Betriebsausfall. Die Versicherung lehnt den Schaden ab; auch der Vermieter fordert Ersatz.','komplett','insurance'],
  ['R5','Der Gesamtkomplex beträgt 104.310,02 EUR und betrifft sieben Parteien. Ein Team braucht Rollen und Rechte, Admin-Zugang, Audit-Protokoll, mehrere Fälle und einen Gesamtexport.','business','business'],
  ['S1','Eine Hotelrechnung enthält eine doppelte Frühstücksposition über 24 Euro. Ich habe nur die Rechnung und möchte eine kurze Antwort formulieren.','start','contract'],
  ['S2','Auf meiner Lohnabrechnung steht mein Vorname falsch. Betrag und Arbeitszeit stimmen. Ich möchte die Abrechnung geordnet ablegen und um Korrektur bitten.','start','work'],
  ['S3','Ich möchte zwei Schreiben zu meiner gebuchten Reise und der Gepäckbestätigung übersichtlich zusammenfassen. Es gibt keinen Streit und keine Frist.','start','private'],
  ['S4','Die Behörde bittet nur um eine Kopie meines bereits vorhandenen Nachweises. Ich möchte das Schreiben und den Nachweis ordentlich zuordnen.','start','authority'],
  ['S5','Mein Vermieter hat mir eine neue Bankverbindung mitgeteilt. Ich möchte das Schreiben prüfen, ablegen und kurz bestätigen, sonst ist nichts passiert.','start','property'],
  ['K1','Zu einer Rechnung kam jetzt eine Mahnung mit Antwortfrist in sieben Tagen. Der Liefernachweis fehlt und ich möchte wissen, welche Unterlage noch gebraucht wird und was zuerst zu tun ist.','klar','contract'],
  ['K2','Die Krankengeldabrechnung nennt einen anderen Zeitraum als die Lohnabrechnung. Eine Arbeitgeberbescheinigung fehlt und die Kasse erwartet bis Freitag eine Antwort.','klar','work'],
  ['K3','Ein Bescheid fordert eine ergänzende Erklärung bis zum 18. September. Das genannte Formular ist nicht beigefügt. Ich brauche eine Liste der fehlenden Unterlagen und den nächsten Schritt.','klar','authority'],
  ['K4','In der Betriebskostenabrechnung ist eine einzelne Hausmeisterposition unklar. Die Belege fehlen und die Einwendungsfrist läuft. Ich möchte die Lücke und Priorität sehen.','klar','property'],
  ['K5','Nach einem kleinen Wasserschaden fehlt der Versicherung noch die Reparaturrechnung. Sie hat eine kurze Antwortfrist gesetzt. Ich möchte erkennen, was fehlt und was ich jetzt einreichen muss.','klar','insurance'],
  ['A1','Drei Lohnabrechnungen, Stundenzettel und Krankmeldungen widersprechen sich bei Zeitraum, Zuschlägen und Fehlzeiten. Ich muss Risiken, Beweislage und Handlungsoptionen priorisieren.','analyse','work'],
  ['A2','Versorger, Inkasso und Bank nennen unterschiedliche Rechnungs- und Zahlungsdaten. Eine Bonitätsmeldung ist angedroht. Ich brauche eine vertiefte Prüfung der Widersprüche, Nachweise und Risiken.','analyse','contract'],
  ['A3','Behörde, Arbeitgeber und Krankenkasse machen widersprüchliche Angaben zur Anmeldung. Mehrere Schreiben und Nachweise passen zeitlich nicht zusammen. Bitte Beweiskette, Risiken und Optionen bewerten.','analyse','authority'],
  ['A4','Mietvertrag, Übergabeprotokoll, Fotos und Handwerkerbericht widersprechen sich zu einem Schaden. Ich brauche eine vertiefte Zuordnung der Beweise, offenen Fragen und Handlungsrisiken.','analyse','property'],
  ['A5','Versicherer, Gutachter und Werkstatt bewerten Ursache und Höhe unterschiedlich. Es liegen mehrere widersprüchliche Unterlagen vor. Ich möchte Deckungsrisiko, Beweiswert und nächste Optionen prüfen.','analyse','insurance'],
  ['C1','Nach einem Betriebsschaden streiten Versicherer, Gutachter, Vermieter und Lieferant über Ursache, Ausfall und Ersatz. Es gibt viele Unterlagen, mehrere Fristen und Schäden. Ich brauche eine vollständige Fallakte mit Chronologie, Analyse, Maßnahmen und vorbereiteten Schreiben an alle Beteiligten.','komplett','insurance'],
  ['C2','Bei einer beendeten Pacht bestehen Rückstände, Gebäudeschäden, verweigerte Übergabe und mehrere Zeugen. Vertrag, Fotos, Rechnungen und Nachrichten müssen vollständig geordnet, bewertet und in mehrere Schreiben sowie eine Übergabeakte überführt werden.','komplett','property'],
  ['C3','Kündigung, offener Lohn, Krankengeld und Arbeitszeiten betreffen Arbeitgeber, Kasse und Behörde. Es gibt zahlreiche widersprüchliche Belege und Fristen. Ich brauche die komplette Bearbeitung mit Chronologie, Prüfung und allen Antwortentwürfen.','komplett','work'],
  ['C4','Ein Dienstleister hat mangelhaft geleistet, trotzdem mahnt ein Inkasso; die Bank hält Geld zurück und ein Kunde fordert Ersatz. Vier Parteien, mehrere Schäden und viele Belege sollen als vollständiger Fall mit Maßnahmen und mehreren Schreiben bearbeitet werden.','komplett','contract'],
  ['C5','Nach einer Reise mit medizinischem Abbruch streiten Veranstalter, Versicherung, Airline und Kreditkartenanbieter über Kosten und Erstattung. Ich brauche eine vollständige Chronologie, Belegprüfung, Fristenübersicht und vorbereitete Schreiben an alle Stellen.','komplett','private'],
  ['B1','Unser Betrieb steuert gleichzeitig vierzig Kundenfälle. Fünf Mitarbeitende brauchen unterschiedliche Rollen, Freigaben, Wiedervorlagen, ein gemeinsames Auditprotokoll und regelmäßige Gesamtexporte.','business','business'],
  ['B2','Eine Beratungsfirma mit acht Beschäftigten verwaltet 120 Mandantenakten und wiederkehrende Vorgänge. Benötigt werden Adminrechte, Teamzuweisungen, Freigabeketten, Standards und zentrale Auswertungen.','business','business'],
  ['B3','Unsere Immobiliengesellschaft verwaltet sechzig Mietverhältnisse parallel. Mehrere Sachbearbeiter sollen Fälle, Dokumente, Rollen, Freigaben und wiederkehrende Prozesse zentral kontrollieren und exportieren.','business','business'],
  ['B4','Ein Abrechnungsbüro bearbeitet fortlaufend die Unterlagen vieler Firmenkunden. Teams benötigen getrennte Rechte, Adminübersicht, Freigaben, Statuskontrolle und ein nachvollziehbares Protokoll über alle Kundenfälle.','business','business'],
  ['B5','Ein Versicherungsmaklerbüro organisiert gleichzeitig viele Kunden, Schäden und Verträge. Sechs Nutzer brauchen Rollen, gemeinsame Bearbeitung, Freigabe vor Versand, Auditverlauf und regelmäßige Berichte.','business','business']
]

const languageCases=[
  ['L-EN','Our team manages multiple clients and recurring cases with user roles, approvals and an audit log.','business','business'],
  ['L-FR','Notre équipe gère plusieurs clients et plusieurs dossiers avec administration, validations et journal d’audit.','business','business'],
  ['L-TR','Ekibimiz birden fazla müşteri ve birden fazla dosya için roller, yönetim ve denetim kaydı kullanıyor.','business','business'],
  ['L-PL','Zespół obsługuje wielu klientów i wiele spraw z rolami, administracją i dziennikiem audytu.','business','business'],
  ['L-RU','Команда ведет несколько клиентов и несколько дел с ролями, администрированием и журналом аудита.','business','business'],
  ['L-AR','يدير فريقنا عدة عملاء وعدة قضايا مع الأدوار والإدارة وسجل تدقيق.','business','business'],
  ['L-FA','تیم ما چند مشتری و چند پرونده را با نقش‌ها، مدیریت و گزارش ممیزی اداره می‌کند.','business','business'],
  ['L-RO','Echipa gestionează mai mulți clienți și mai multe cazuri cu roluri, administrare și jurnal de audit.','business','business'],
  ['L-BG','Екипът управлява няколко клиента и няколко случая с роли, администриране и одитен дневник.','business','business'],
  ['L-VI','Đội nhóm quản lý nhiều khách hàng và nhiều hồ sơ với vai trò, quản trị và nhật ký kiểm toán.','business','business']
]

for(const [label,text,planKey,caseKey] of [...cases,...languageCases]){
  const actual=recommendProblem(text,profile)
  assert.equal(actual.planKey,planKey,`${label}: Tarif ${actual.planKey} statt ${planKey}`)
  assert.equal(actual.caseKey,caseKey,`${label}: Fallart ${actual.caseKey} statt ${caseKey}`)
}

const total=cases.length+languageCases.length
console.log(`V80 natural-language matrix passed through version-neutral recommendation modules: ${total}/${total} tariffs and case types correct.`)
