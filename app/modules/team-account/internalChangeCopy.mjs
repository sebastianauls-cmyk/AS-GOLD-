export const changeAreas=[
  'Gesamtes AS Workspace · alle Bereiche',
  'Öffentliche Startseite & Nutzerführung',
  'Installation & Weitergabe',
  'Anmeldung & Registrierung',
  'Interner Arbeitsbereich',
  'Fälle, Kunden & Fristen',
  'Dokumente, Auswertungen & Exporte',
  'Schreiben, Vorschauen & Freigaben',
  'Produktbeschreibung & Erklärungen',
  'Preise, Tarife & Zahlungen',
  'Sprachen & Länder',
  'Design, Navigation & Bedienung',
  'Rechtliche Seiten & Datenschutz',
  'Konten, Rechte & Einstellungen',
  'Alle Funktionen, Module & Programmierung',
  'Sonstige Änderung an AS Workspace'
]

const copy={
  de:{
    badge:'GESCHÜTZTE ÄNDERUNGSZENTRALE',title:'Vollzugriff auf das gesamte AS Workspace',
    lead:'Passwort 1 gibt jeder autorisierten internen Person Zugriff auf alles: öffentliche und interne Bereiche, Inhalte, Funktionen, Module, Einstellungen und Programmierungsänderungen. Alle dürfen Änderungen vollständig vorbereiten. Erst Ihre Freigabe mit Passwort 2 erlaubt, eine geänderte Version live zu veröffentlichen.',
    passwordRule:'Zwei Passwörter, klar getrennte Aufgaben',accessPassword:'Passwort 1 · Vollzugriff auf alles',accessHelp:'Damit kann jede autorisierte Person das gesamte AS Workspace öffnen, in allen Bereichen arbeiten und Änderungen an jedem Inhalt, jeder Funktion und jedem Modul vorbereiten.',masterPassword:'Passwort 2 · Freigabe der Live-Version',masterHelp:'Nur Sebastian kennt es. Es wird genau einmal eingegeben, nachdem die vollständige Änderung sichtbar geprüft wurde und bevor die geänderte Version live veröffentlicht werden darf.',
    newRequest:'Änderung an AS Workspace vorbereiten',requester:'Vorbereitet von',area:'Betroffener Bereich',requestTitle:'Kurzer Titel',change:'Was soll in AS Workspace geändert werden?',reason:'Warum soll es geändert werden?',notes:'Gewünschte Darstellung, Funktion oder technische Umsetzung (optional)',priority:'Priorität',submit:'Änderungsentwurf speichern',required:'Bitte alle Pflichtfelder vollständig ausfüllen.',submitted:'Der Änderungsentwurf wurde gespeichert. Die bisherige Live-Version wurde nicht verändert.',
    queue:'Entwürfe und Live-Freigaben',empty:'Noch keine Änderungsentwürfe vorhanden.',loading:'Änderungsentwürfe werden geladen …',reload:'Neu laden',loadError:'Die Änderungszentrale konnte nicht geladen werden.',saveError:'Der Änderungsentwurf konnte nicht gespeichert werden.',decisionError:'Die Entscheidung konnte nicht gespeichert werden.',
    status:{requested:'Änderung vorbereitet',released:'Für die Live-Version freigegeben',rejected:'Abgelehnt',published:'Live veröffentlicht'},
    priorities:{low:'Niedrig',normal:'Normal',high:'Hoch',urgent:'Dringend'},
    releaseState:'Stand der Änderung',releaseStep:'Passwort 2 · Geänderte Version freigeben',releaseHelp:'Prüfen Sie zuerst den oben sichtbaren vollständigen Entwurf. Mit Passwort 2 erlauben Sie, genau diese Änderung als neue Live-Version von AS Workspace zu veröffentlichen.',confirmCheck:'Ich habe den vollständigen Entwurf geprüft und gebe genau diese Änderung als neue Live-Version frei.',release:'Änderung zur Veröffentlichung freigeben',releaseButtonHelp:'Der große Button gilt ausschließlich für den oben angezeigten, vollständig geprüften Entwurf.',
    reject:'Entwurf ablehnen',masterPlaceholder:'Passwort 2 von Sebastian',wrongMaster:'Passwort 2 ist nicht richtig.',locked:'Zu viele Fehlversuche. Die Live-Freigabe ist vorübergehend gesperrt.',notConfigured:'Der Baustein ist vorbereitet, aber die beiden Passwörter sind noch nicht sicher eingerichtet.',releasedNote:'Passwort 2 wurde bestätigt. Genau diese Änderung darf jetzt als neue Live-Version veröffentlicht werden.',publishedNote:'Diese freigegebene Änderung wurde als Live-Version veröffentlicht.',noEffect:'Interne Fall- und Kundenarbeit kann mit Passwort 1 sofort gespeichert werden. Änderungen an AS Workspace selbst bleiben bis Passwort 2 Entwurf; die Live-Version bleibt unverändert.',back:'Zurück zur Übersicht'
  },
  en:{
    badge:'PROTECTED CHANGE CENTRE',title:'Full access to all of AS Workspace',lead:'Password 1 gives every authorised person access to everything in AS Workspace: public and internal areas, content, functions, modules, settings and programming changes. Everyone may prepare changes; Password 2 alone releases a changed version for live publication.',passwordRule:'Two passwords, two purposes',accessPassword:'Password 1 · Full access to everything',accessHelp:'Every authorised person can open the entire AS Workspace, work in all areas and prepare changes to any content, function or module.',masterPassword:'Password 2 · Live-version release',masterHelp:'Only Sebastian knows it. It is entered once after the complete change is visible and before the changed version may be published live.',newRequest:'Prepare an AS Workspace change',requester:'Prepared by',area:'Affected area',requestTitle:'Short title',change:'What should change in AS Workspace?',reason:'Why should it change?',notes:'Desired presentation, function or technical implementation (optional)',priority:'Priority',submit:'Save change draft',required:'Please complete all required fields.',submitted:'The draft was saved. The current live version has not changed.',queue:'Drafts and live releases',empty:'No change drafts yet.',loading:'Loading change drafts …',reload:'Reload',loadError:'Change control could not be loaded.',saveError:'The change draft could not be saved.',decisionError:'The decision could not be saved.',status:{requested:'Change prepared',released:'Released for live version',rejected:'Rejected',published:'Published live'},priorities:{low:'Low',normal:'Normal',high:'High',urgent:'Urgent'},releaseState:'Change status',releaseStep:'Password 2 · Release changed version',releaseHelp:'Review the complete draft above. Password 2 permits exactly this change to be published as the new live AS Workspace version.',confirmCheck:'I reviewed the complete draft and release exactly this change as the new live version.',release:'Release change for publication',releaseButtonHelp:'The large button applies only to the complete reviewed draft shown above.',reject:'Reject draft',masterPlaceholder:"Sebastian's Password 2",wrongMaster:'Password 2 is incorrect.',locked:'Too many failed attempts. Live release is temporarily locked.',notConfigured:'The module is prepared, but the two passwords have not yet been securely configured.',releasedNote:'Password 2 was confirmed. Exactly this change may now be published as the new live version.',publishedNote:'This released change was published as the live version.',noEffect:'Internal case and customer work can be saved with Password 1. Changes to AS Workspace itself remain drafts until Password 2; the live version stays unchanged.',back:'Back to overview'
  }
}

export function getInternalChangeCopy(language){
  return copy[language]||copy.de
}
