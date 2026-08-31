# AS Gold – OAuth-Integrationen

Stand: 31.08.2026

## Zweck

AS Gold unterstützt die technische Anbindung von Gmail, Google Drive, Outlook/Microsoft 365 und OneDrive über OAuth 2.0. Passwörter der Nutzer werden nicht in AS Gold gespeichert.

## Google

Vercel-Umgebungsvariablen:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `INTEGRATION_TOKEN_KEY`

Autorisierte Redirect-URI:
- `https://app-gold-workspace.vercel.app/api/integrations/google/callback`

Benötigte Google-APIs / Scopes:
- Gmail API
- Google Drive API
- `openid`
- `email`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/drive.file`

## Microsoft

Vercel-Umgebungsvariablen:
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `INTEGRATION_TOKEN_KEY`

Autorisierte Redirect-URI:
- `https://app-gold-workspace.vercel.app/api/integrations/microsoft/callback`

Benötigte Microsoft Graph-Berechtigungen:
- `openid`
- `email`
- `offline_access`
- `Mail.Read`
- `Mail.Send`
- `Files.ReadWrite`

## Sicherheitsregel

Client Secrets und `INTEGRATION_TOKEN_KEY` gehören ausschließlich in Vercel Environment Variables und niemals in GitHub oder öffentlich sichtbaren Client-Code.

## Aktueller Status

Die OAuth-Routen und die Integrationszentrale sind produktiv implementiert. Solange die Provider-Credentials fehlen, zeigt die Oberfläche dies ausdrücklich an und stellt keine Scheinverbindung her.
