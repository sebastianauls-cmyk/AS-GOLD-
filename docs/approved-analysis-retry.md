# Einmalig freigegebener Reparaturtest

Status: vorbereitet; keine Freigabe erteilt und kein zusätzlicher Live-Auftrag gestartet.

Das bestehende rollierende Tageslimit zählt auch fehlgeschlagene KI-Aufträge,
weil dabei Kosten anfallen. Es bleibt bei 20 regulären Aufträgen für angemeldete
Konten und vier für anonyme Testkonten. Eine Veröffentlichung dieser Änderung
erteilt keinem Konto automatisch einen Zusatzversuch.

Nach ausdrücklicher Zustimmung zu einem zusätzlichen kostenpflichtigen KI-Lauf
kann ein Datenbankadministrator eine einmalige Reparaturfreigabe erteilen. Die
Freigabe dokumentiert den fehlgeschlagenen Auftrag, den reparierenden Git-Commit,
den Reparaturgrund und einen Verweis auf die tatsächliche Zustimmung. Eine
allgemeine Aufforderung, schneller zu arbeiten, ist kein solcher Nachweis.

Die Freigabe gilt 30 Minuten und ausschließlich für denselben Fall und identische
Quelldaten. Es gibt höchstens eine Freigabe je Konto innerhalb von 24 Stunden
und maximal einen zusätzlichen gezählten Auftrag. Auch ein erneut gescheiterter
Zusatzversuch zählt weiter; abgelaufene, verwendete oder widerrufene Freigaben
werden nicht erneuert. Historische Aufträge werden weder gelöscht noch neu
gestartet oder verlängert.

Die private Funktion `grant_case_analysis_repair_credit` benötigt die Parameter
`p_failed_job_id`, `p_reason`, `p_repair_commit` und `p_approval_reference`.
Sie ist für Datenbankadministratoren reserviert, hat keine öffentliche RPC und
ist auch für die normale Server-Service-Rolle gesperrt. Die Migration enthält
keine auf einen bestimmten Kunden bezogenen Datenänderungen.

Erst danach startet die angemeldete Person den neuen Auftrag über den normalen
App-Ablauf. Der Server prüft weiterhin Fallzugriff, Einwilligung und Berechtigungen.
Die vorhandenen Quellen-, Rechen- und Ergebnisprüfungen sowie die feste Laufzeit
und Wiederholungsgrenzen des neuen Auftrags bleiben verbindlich. Die Freigabe
wird atomar mit dem Anlegen des Auftrags verbraucht; ein zweiter Klick liefert
denselben aktiven Auftrag. Fremde Fälle und veränderte Originale können sie nicht
verwenden. Eine unbenutzte Freigabe kann der Administrator durch Setzen von
`revoked_at` widerrufen, ohne die Dokumentation zu löschen.

Die Freigabe garantiert kein erfolgreiches Ergebnis und keinen bestimmten
Geldbetrag. Sie erlaubt genau einen zusätzlichen Lauf im bestehenden technischen
Umfang. Provider-Kontingente, Sperren und Zugriffsregeln bleiben verbindlich.

Prüfung: `node scripts/test_background_case.mjs` führt die echten Migrationen,
Postgres-Berechtigungen und den Worker mit simulierten Modellantworten aus. Die
Zusatztests prüfen unter anderem Administratorrechte, Tagesgrenzen, Fall- und
Quellenbindung, Entzug der Einwilligung, atomaren Verbrauch, Doppelklick, Ablauf,
Widerruf, erhaltene Fehlerhistorie und die Ablehnung ungeprüfter Ergebnisse.
Diese lokalen Tests ersetzen keine erfolgreiche Live-Fallverarbeitung.
