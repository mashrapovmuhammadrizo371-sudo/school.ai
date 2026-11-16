# SCHOOL.AI Cloudflare API status

## Current deployment

- Worker: `school-ai`
- Public endpoint: `https://school-ai.mashrapovmuhammadrizo371.workers.dev`
- D1 database: `school-ai-db`
- D1 binding: `DB`
- API source: `workers/school-ai/src/index.js`
- Database schema: `workers/school-ai/schema.sql`

The Worker has been deployed with D1 access and the legacy Express API routes have been ported to D1. The STEM School record is seeded. No legacy MongoDB records have been imported.

## Required Worker secrets

Before protected endpoints can work, add these as **Worker Secrets** for `school-ai` in Cloudflare Dashboard:

- `JWT_SECRET` — long, random signing secret (at least 32 random bytes).
- `ADMIN_USERNAME` — the chosen BIG ADMIN username.
- `ADMIN_PASSWORD` — a strong, unique BIG ADMIN password.

Do not put secret values in GitHub, source files, frontend code, or public chat. After adding secrets, deploy the latest Worker version.

## API smoke checks

- `GET /api/health` — checks Worker and D1 connectivity.
- `POST /api/admin/login` — BIG ADMIN login; requires the three secrets above.
- `GET /api/admin/dashboard` — requires a BIG ADMIN bearer token.
- `POST /api/students/register` — submits a student application.
- `GET /api/students/application/:id` — checks application status.
- `POST /api/students/login` — student ID login.
- `GET /api/student/me` — student profile.
- `POST /api/staff/login` and `GET /api/staff/me` — staff login/profile.

Student content endpoints:
`/api/student/announcements`, `/api/student/books`, `/api/student/subjects`,
`/api/student/schedule`, `/api/student/reading`, `/api/student/support`.

BIG ADMIN endpoints include dashboard, applications, students, schools, staff, announcements,
books, subjects, schedule, reading, tests, results, media, Telegram settings, support, and security contacts.

## Important migration boundary

The existing Render service remains the rollback backend. The frontend has **not** been switched from Render to this Worker, and no MongoDB data has been copied to D1. Do not shut down Render or announce a full migration until frontend integration, secret configuration, authenticated endpoint tests, and a data migration plan are complete.

## Compatibility and security notes

- API request and response keys are normalized for the legacy camelCase frontend contract.
- New staff passwords use PBKDF2 through Web Crypto. Old MongoDB scrypt password hashes are not imported or compatible; staff accounts must be recreated or reset after migration.
- The API requires a configured JWT secret. Protected endpoints intentionally fail closed without it.
- This first API deployment does not yet implement rate limiting, audit history, file storage migration, or full role-specific staff permissions.
