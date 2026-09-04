# V106 – Passwort direkt in einer aktiven Sitzung ändern

## Ergebnis

- Neue Route `/passwort-aendern` für bereits angemeldete Nutzer.
- Die aktive Identität wird vor Anzeige des Formulars mit `supabase.auth.getUser()` geprüft.
- Das Passwort wird ausschließlich für den aktuell angemeldeten Nutzer über `supabase.auth.updateUser({password})` geändert.
- Die bestehende V29-Passwortrichtlinie und die doppelte Eingabe bleiben verpflichtend.
- Kein Admin-Endpunkt, kein Service-Role-Schlüssel und keine Übertragung an einen eigenen Server.
