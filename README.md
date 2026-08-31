# Google Creator OS

Foundation for a Google-centric creator/business automation platform.

## Stack
- Next.js App Router + TypeScript
- PostgreSQL + Prisma
- Google OAuth 2.0 / googleapis
- Server-side token storage (encrypted at rest in production)
- Designed for Vercel deployment

## Initial integrations
Gmail, Drive, Photos, YouTube, Ads, Calendar, Sheets, Analytics, Search Console.

## Setup
1. Create a Google Cloud project and enable the APIs you need.
2. Create a Web application OAuth client.
3. Add `http://localhost:3000/api/auth/google/callback` as an authorized redirect URI.
4. Copy `.env.example` to `.env.local`.
5. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `DATABASE_URL`.
6. Install dependencies and run Prisma migrations.
7. Start with `npm run dev`.

Do not commit OAuth secrets or refresh tokens.
