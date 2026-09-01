# AS Gold V38 – Supabase Sicherheits-Audit

Stand: 01.09.2026

## Ergebnis

Der produktive Supabase-Sicherheitsstand wurde erneut live geprüft. Die zuvor offene Warnung zum exponierten SECURITY-DEFINER-Audit-RPC ist technisch beseitigt. Als einziger verbleibender WARN-Punkt des Supabase Security Advisors bleibt derzeit die deaktivierte Leaked Password Protection.

## 1. Leaked Password Protection

Status: OFFEN / vor Marktstart zu aktivieren.

Der Supabase Security Advisor meldet weiterhin `auth_leaked_password_protection`: Die providerseitige Prüfung neuer Passwörter gegen bekannte kompromittierte Passwörter ist in Supabase Auth derzeit deaktiviert.

AS Gold besitzt zusätzlich eigene Passwortregeln. Diese ersetzen die providerseitige Kompromittierungsprüfung jedoch nicht. Die aktuell verbundenen Supabase-Werkzeuge stellen keine Aktion zum Ändern dieser Auth-Projekteinstellung bereit; deshalb wurde dieser Punkt nicht nur scheinbar als erledigt markiert. Nach Aktivierung in der Supabase-Auth-Konfiguration muss der Security Advisor erneut geprüft werden.

## 2. Audit-RPC-Sicherheitsgrenze

Status: ERLEDIGT / live verifiziert.

Die öffentliche Funktion `public.record_gold_audit_event(...)` wurde von `SECURITY DEFINER` auf `SECURITY INVOKER` umgestellt. Die streng validierte privilegierte Implementierung bleibt hinter dem nicht exponierten `private`-Schema in `private.record_gold_audit_event_impl(...)`.

Rechte und Grenze:

- `public.record_gold_audit_event(...)` ist `SECURITY INVOKER`.
- `authenticated` darf nur den vorgesehenen Wrapper aufrufen.
- `anon` besitzt kein EXECUTE auf Wrapper oder private Implementierung.
- Die private Implementierung behält Authentifizierung, aktiven Zugriff, Allowlisten, Metadatenvalidierung, Entity-/Ownership-Prüfungen und konsistente Event-/Entity-Regeln.
- Ein Aufruf als `authenticated` ohne gültige Benutzeridentität wird weiterhin mit `Authentication required` verworfen.
- Die privaten Tabellen besitzen für normale angemeldete Nutzer keine direkten SELECT/INSERT/UPDATE/DELETE-Rechte.

Nach der Migration wurde der Supabase Security Advisor erneut live ausgeführt. Die vorherige Warnung `authenticated_security_definer_function_executable` für den Audit-RPC ist verschwunden.

Reproduzierbare Migration: `supabase/migrations/20260901013800_v38_move_audit_definer_behind_private_boundary.sql`.

Zusätzlich schützt `test:v38-supabase-security` die gewünschte Architektur künftig vor jedem Produktionsbuild.

## 3. Private Tabellen ohne RLS-Policies

Status: INFO, derzeit kein automatischer Eingriff.

Der Advisor meldet mehrere `rls_enabled_no_policy`-Hinweise für Tabellen im Schema `private` (u. a. `gold_plans`, `gold_plan_terms`, `gold_promo_codes`, `pending_owner_access`, `electronic_withdrawals`). Diese Tabellen liegen bewusst außerhalb des öffentlich exponierten API-Schemas. Es wurde geprüft, dass `authenticated` auf diese Tabellen keine direkten SELECT-/INSERT-/UPDATE-/DELETE-Rechte besitzt. Keine Policy hinzuzufügen ist für private interne Tabellen deshalb nicht automatisch ein Fehler.

## 4. Performance Advisor

Der Performance Advisor meldet ausschließlich aktuell ungenutzte Indizes. In der kontrollierten Testphase ist das kein belastbarer Grund, Indizes zu löschen; geringe Nutzung kann aus dem noch kleinen Testvolumen resultieren. Daher keine automatische Löschung vor realer Lastmessung.

## 5. Zahlungsgrenze in der Datenbank

Die produktive Upgrade-Logik wurde nach `payment_enabled` geprüft. Die relevante Implementierung setzt ausdrücklich `payment_enabled=false`. Es wurde kein konkurrierender Datenbankpfad gefunden, der diesen Status auf `true` setzt. Die Zahlungsaktivierung bleibt eine getrennte ausdrückliche Freigabe.

## Freigabegrenze

Für die Supabase-Sicherheitsampel vor Marktstart gilt jetzt:

- [ ] Supabase Leaked Password Protection tatsächlich aktivieren und Advisor erneut prüfen.
- [x] Exponierten SECURITY-DEFINER-Audit-RPC beseitigt; öffentlicher Wrapper ist SECURITY INVOKER.
- [x] Anonyme und direkte private Audit-/Tabellenzugriffe geprüft und blockiert.
- [x] RLS-/Private-Schema-Hinweise geprüft und nicht blind verändert.
- [x] Datenbank-Zahlungsgrenze erneut geprüft (`payment_enabled=false`).
- [x] Keine ungenutzten Indizes ohne reale Lastdaten automatisch entfernt.

Die Zahlungsfunktion bleibt unabhängig davon deaktiviert, bis sie separat ausdrücklich freigegeben wird.
