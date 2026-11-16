# SCHOOL.AI — Cloudflare migration

## Current state

- Existing production backend: Render + Express + MongoDB.
- Existing frontend: static HTML/CSS/JavaScript.
- New Cloudflare Worker: `school-ai`.
- New Cloudflare D1 database: `school-ai-db`.
- The Worker is a bootstrap only. It currently exposes health checks and does not yet replace the legacy API.

## Safety rules

1. Keep the Render service and MongoDB intact until migration and verification are complete.
2. Do not point the production frontend at the new Worker until the API compatibility checklist passes.
3. Never commit API tokens, JWT secrets, admin passwords, database exports, or student personal data.
4. Use per-school `school_id` scoping for every school-owned query.
5. Before moving student data, create an encrypted export and verify row counts and sample records in the target database.

## Migration sequence

1. D1 schema and Worker bootstrap.
2. Authentication: student, staff, and platform admin roles; secure token signing and expiry.
3. Student registration, application review, student login and profile.
4. Staff login and profile.
5. Student content: announcements, books, subjects, schedule, reading and support.
6. Admin CRUD: schools, staff, content, tests, results, media, Telegram and security settings.
7. Export/import MongoDB data into D1 with a reconciliation report.
8. API contract tests against the old and new backends.
9. Switch the frontend API base URL only after successful tests.
10. Keep Render as rollback target until the new production period is stable.

## API compatibility

The current frontend uses `window.API` in `js/core.js` and calls the legacy Express API. Do not change it until the Worker implements the same routes and response shapes.

## Local development

From this directory:

```sh
npx wrangler d1 execute school-ai-db --remote --file=./schema.sql
npx wrangler dev
```

Deploy only after reviewing the Worker source and D1 migrations.
