# V101 – Anmeldung und Passwort-Wiederherstellung

Stand: 4. September 2026

- Der im Supabase-Protokoll sichtbare Vorgang wurde eingeordnet: Das Konto bestand bereits; anschließend wurde ein nicht passendes Passwort verwendet.
- Eine fehlgeschlagene Anmeldung bleibt beim Wechsel zur Registrierung nicht mehr als irreführende Meldung stehen.
- Supabase-Fehlercodes werden in allen elf aktiven App-Sprachen verständlich ausgegeben; der rohe englische Text `Invalid login credentials` erscheint nicht mehr.
- Bei falschen Zugangsdaten verweist die Meldung ausdrücklich auf die vorhandene Funktion zum Zurücksetzen des Passworts.
- Registrierungs- und Wiederherstellungslinks verwenden einheitlich die produktive Adresse `https://app-gold-workspace.vercel.app`, auch wenn der Vorgang in einer lokalen Testansicht begonnen wird.
- Das bestehende Eigentümerkonto ist bestätigt, aktiv und als `owner` freigegeben. Die Datenbanklogik ergänzt dafür dauerhaft sämtliche Business-Berechtigungen ohne Zeit-, Promo- oder Zahlungslimit.
