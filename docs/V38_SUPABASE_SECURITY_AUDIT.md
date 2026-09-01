# AS Gold V38 – Supabase Sicherheits-Audit

Stand: 01.09.2026

## Ergebnis

Der aktuelle Supabase Security Advisor wurde gegen das produktive Projekt geprüft. Die wesentlichen App-/RLS-Schutzmaßnahmen sind vorhanden. Vor einer echten Marktfreigabe bleiben zwei sicherheitsrelevante Punkte ausdrücklich offen.

## 1. Leaked Password Protection

Status: OFFEN / vor Marktstart zu aktivieren.

Der Supabase Security Advisor meldet `auth_leaked_password_protection`: Die Prüfung neuer Passwörter gegen bekannte kompromittierte Passwörter ist in Supabase Auth derzeit deaktiviert.

AS Gold besitzt zusätzlich eigene Passwortregeln, diese ersetzen die providerseitige Prüfung gegen bekannte kompromittierte Passwörter jedoch nicht. Der Punkt darf deshalb nicht als erledigt markiert werden, bevor die Supabase-Auth-Einstellung tatsächlich aktiviert und erneut geprüft wurde.

## 2. Audit-RPC als SECURITY DEFINER

Status: BEWUSST OFFEN / Architekturprüfung vor Marktstart.

Der Advisor meldet `authenticated_security_definer_function_executable` für `public.record_gold_audit_event(...)`.

Die öffentliche Funktion ist aktuell ein schmaler Wrapper auf `private.record_gold_audit_event_impl(...)`. Die private Implementierung prüft unter anderem:

- vorhandene Authentifizierung (`auth.uid()`),
- aktiven Zugriff,
- eine feste Allowlist zulässiger Audit-Ereignisse,
- eine feste Allowlist zulässiger Entity-Typen,
- Metadaten-Typ, -Länge, Schlüssel und zulässige Werte,
- Eigentümerschaft/Zugriff auf referenzierte Client-/Case-/Document-/Approval-Objekte,
- konsistente Event-/Entity-Kombinationen.

Damit ist die Funktion nicht ungeprüft offen. Trotzdem bleibt die Advisor-Warnung relevant, weil ein SECURITY-DEFINER-RPC aus dem exponierten `public`-Schema für angemeldete Nutzer aufrufbar ist. Vor Marktstart soll entschieden werden, ob die aktuelle streng validierte RPC-Grenze bewusst akzeptiert wird oder ob Audit-Schreibvorgänge auf eine serverseitige Route/Service-Grenze verlagert werden.

## 3. Private Tabellen ohne RLS-Policies

Status: INFO, derzeit kein automatischer Eingriff.

Der Advisor meldet mehrere `rls_enabled_no_policy`-Hinweise für Tabellen im Schema `private` (u. a. `gold_plans`, `gold_plan_terms`, `gold_promo_codes`, `pending_owner_access`, `electronic_withdrawals`). Diese Tabellen liegen bewusst außerhalb des öffentlich exponierten API-Schemas. Keine Policy hinzuzufügen ist für private interne Tabellen nicht automatisch ein Fehler. Änderungen erfolgen nur nach Prüfung der tatsächlichen Zugriffswege.

## 4. Performance Advisor

Der Performance Advisor meldet ausschließlich aktuell ungenutzte Indizes. In der kontrollierten Testphase ist das kein belastbarer Grund, Indizes zu löschen; geringe Nutzung kann schlicht aus dem noch kleinen Testvolumen resultieren. Daher keine automatische Löschung vor realer Lastmessung.

## Freigabegrenze

V38 bleibt technisch stabil und testbar. Für eine Sicherheitsampel GRÜN vor Marktstart müssen mindestens folgende Punkte geklärt sein:

- [ ] Supabase Leaked Password Protection tatsächlich aktiviert und Advisor erneut grün geprüft.
- [ ] SECURITY-DEFINER-Audit-RPC bewusst freigegeben oder durch eine engere Server-Grenze ersetzt.
- [x] RLS-/Private-Schema-Hinweise geprüft und nicht blind verändert.
- [x] Keine ungenutzten Indizes ohne reale Lastdaten automatisch entfernt.

Die Zahlungsfunktion bleibt unabhängig davon deaktiviert, bis sie separat ausdrücklich freigegeben wird.
