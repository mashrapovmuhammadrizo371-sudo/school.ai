# school.ai

## Big Admin / Student Verification

Render backend Environment Variables:
- `ADMIN_USERNAME` — Big Admin login
- `ADMIN_PASSWORD` — Big Admin password
- `ADMIN_SECRET` — long random secret used for admin sessions
- `OPENAI_API_KEY` — AI assistant key (optional)
- `TELEGRAM_BOT_TOKEN` — Telegram bot token (optional)

Student flow:
1. Student registers with name, surname and class.
2. Application becomes `pending` and appears in Big Admin.
3. Big Admin adds/maintains the official student list.
4. Approval is allowed only when name, surname, class and section match the official list.
5. Approval creates a random `ST-XXXXXX` Student ID.
6. Student can then sign in with Student ID + surname.

The platform layer also adds subject pages with Darslar/Testlar/Natijalar and a Big Admin management interface.
