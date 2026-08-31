# Google Creator OS — Complete Setup

## 1. Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+ (or a hosted PostgreSQL provider such as Supabase)
- A Google account
- A Google Cloud project
- Google Ads Manager account only if Ads API is required

## 2. Install

```bash
npm install
cp .env.example .env.local
```

Generate the token encryption secret:

```bash
openssl rand -base64 32
```

Put the output in `TOKEN_ENCRYPTION_KEY`.

## 3. PostgreSQL

Create a database named `google_creator_os`, or use a hosted PostgreSQL database. Put the full connection string in `DATABASE_URL`.

Then run:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

For production:

```bash
npx prisma migrate deploy
```

## 4. Google Cloud project

Open Google Cloud Console and create/select a project. Enable every API used by the features you want. Google requires APIs to be enabled before your application can call them.

Recommended initial APIs:

- Gmail API
- Google Drive API
- Google Photos Library API
- YouTube Data API v3
- Google Calendar API
- Google Sheets API
- Google Analytics Admin/Data APIs as needed
- Search Console API
- Google Ads API
- Business Profile APIs as needed
- People API
- Google Tasks API
- Google Docs API
- Google Forms API

## 5. OAuth consent screen

Configure the OAuth consent screen in Google Cloud. Add the application name, support/developer contact information, authorized domains for production, and only the scopes actually needed.

Google marks some scopes as sensitive/restricted and public applications may need verification before production use. Do not request every scope by default.

## 6. OAuth client

Create an OAuth 2.0 Client ID with application type **Web application**.

Local redirect URI:

```text
http://localhost:3000/api/auth/google/callback
```

Production redirect URI:

```text
https://YOUR_DOMAIN/api/auth/google/callback
```

Copy the client ID and client secret into `.env.local`.

Never commit a Google client secret or downloaded client_secret.json file.

## 7. Start locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Use the Google connection flow. The application creates its own database-backed session after Google authorization.

## 8. Connect services

The connection endpoint accepts a comma-separated service list. Example:

```text
/api/auth/google?services=gmail,drive,youtube,calendar,sheets
```

Supported service identifiers:

```text
gmail
drive
photos
youtube
ads
calendar
sheets
analytics
search_console
business_profile
contacts
tasks
docs
forms
```

Only request services that the user actually intends to connect.

## 9. Google Ads

Google Ads is an additional setup. OAuth alone is not enough. Google Ads API calls require OAuth credentials plus a developer token. If accessing accounts through a manager account, use the manager customer ID as `GOOGLE_ADS_LOGIN_CUSTOMER_ID`.

Add:

```text
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
GOOGLE_ADS_CUSTOMER_ID=
```

Keep paid/destructive actions behind an approval step until the account is fully tested.

## 10. Production deployment

Set these environment variables in the hosting platform:

- `NODE_ENV=production`
- `APP_URL=https://YOUR_DOMAIN`
- `DATABASE_URL=...`
- `TOKEN_ENCRYPTION_KEY=...`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `GOOGLE_REDIRECT_URI=https://YOUR_DOMAIN/api/auth/google/callback`
- `CRON_SECRET=...`
- Ads variables if Ads is enabled

Then run the production database migration:

```bash
npx prisma migrate deploy
```

## 11. Security checklist

- Never commit `.env.local`.
- Never put refresh tokens in browser storage.
- Rotate credentials if they are exposed.
- Use HTTPS in production.
- Use the smallest possible OAuth scope set.
- Add Google OAuth verification before broad public distribution when required.
- Add approval gates before spending money, deleting data, publishing content, or changing campaigns.
- Keep audit logs for automated actions.
- Configure database backups.

## 12. Automation operations

The database has Automation, AutomationRun and Job records. The next runtime layer should process jobs with retry/backoff and idempotency keys. Scheduled jobs should authenticate with `CRON_SECRET`.
