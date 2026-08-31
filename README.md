# Google Creator OS

Google Creator OS is a Next.js + PostgreSQL automation platform for connecting Google services and turning events into repeatable business/creator workflows.

## Current foundation

- Next.js App Router + TypeScript
- PostgreSQL + Prisma
- Google OAuth 2.0 with CSRF state validation
- Secure database-backed application sessions
- Encrypted Google access/refresh token storage
- Multi-service Google connection flow
- Integration status dashboard
- Automation / run / job / audit-log schema
- Production Prisma migration
- Environment templates and deployment documentation

## Google services designed for

Gmail, Drive, Photos, YouTube, Ads, Calendar, Sheets, Analytics, Search Console, Business Profile, Contacts/People, Tasks, Docs and Forms.

## Quick start

```bash
npm install
cp .env.example .env.local
# fill .env.local
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open `http://localhost:3000` and choose **Continue with Google**.

## Environment files

- `.env.example` — complete variable reference
- `.env.local.example` — local developer template
- `.env.local` — create locally; never commit it

See `docs/SETUP.md` for every setup step and `docs/GOOGLE_CLOUD_SETUP.md` for Google Cloud/OAuth configuration.

## Google OAuth

Local callback:

```text
http://localhost:3000/api/auth/google/callback
```

Production callback:

```text
https://YOUR_DOMAIN/api/auth/google/callback
```

The server exchanges the authorization code, stores encrypted tokens, creates a database session, and redirects to `/dashboard`.

## Google Ads

Google Ads API needs OAuth plus a developer token. Manager-account access may additionally require `GOOGLE_ADS_LOGIN_CUSTOMER_ID`. Keep paid actions behind approval gates until the workflow has been tested.

## Security

Never commit `.env.local`, client secret JSON files, service-account keys, refresh tokens, encryption keys, or other credentials. Use a production secret manager/environment store.

Google's OAuth documentation notes that applications using sensitive/restricted scopes may require verification before public production use. Plan verification before opening the full Google service set to general users.

## Project roadmap

1. Authentication and integration center — foundation implemented.
2. Google service adapters — Gmail/Drive/YouTube/Calendar/Sheets first.
3. Automation builder and job runner.
4. Content pipeline and analytics.
5. Google Ads reporting and approval-based campaign actions.
6. Webhooks/scheduled jobs, retries, idempotency and monitoring.
7. Vercel production deployment and CI.
