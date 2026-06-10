# TestAP — Intelligent Testing Platform

A full-stack web application for test creation, assignment, and analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| State Management | Redux Toolkit |
| Styling | TailwindCSS |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL (via Supabase) |
| Auth | JWT (access + refresh tokens) |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |
| i18n | react-i18next (uk/en) |

## Quick Start

### 1. Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the connection string (Settings → Database → Connection string → URI)
3. Use the `postgresql+asyncpg://...` format

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env — see "Environment variables" below

# Run migrations
alembic upgrade head

# Create the first admin (admin signup is intentionally NOT public)
python -m app.scripts.create_admin --email admin@testap.app --name "Admin" --password "ChangeMe!"

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

#### Environment variables

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Supabase / Postgres async DSN |
| `JWT_SECRET` | HS256 signing secret |
| `GOOGLE_CLIENT_ID` | OAuth Web client_id from Google Cloud Console. Empty = Google button hidden |
| `RESEND_API_KEY` / `EMAIL_FROM` | Outgoing email (verification, reminders). Optional |
| `REQUIRE_EMAIL_VERIFICATION` | `true` blocks login until email is verified |
| `FRONTEND_URL` | Allowed CORS origin (Vercel URL in production) |
| `CORS_ORIGINS` | Optional comma-separated extra origins (preview URLs) |
| `LOGIN_RATE_LIMIT_PER_MINUTE` | slowapi limit per IP for `/auth/login` |
| `SESSION_IDLE_TIMEOUT_MINUTES` | Auto-finalize in-progress sessions after this much idleness |

### 3. Frontend

```bash
cd frontend

# Install Node.js from https://nodejs.org first (LTS version)

npm install
npm run dev
```

App available at: http://localhost:5173

## Production Deployment

Deploy to **Supabase** (database) + **Render** (backend) + **Vercel** (frontend).

See **[DEPLOY.md](./DEPLOY.md)** for a full Ukrainian step-by-step guide.

Quick reference:

| Service | Env vars |
|---------|----------|
| Render (backend) | `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` |
| Vercel (frontend) | `VITE_API_BASE_URL=https://your-api.onrender.com/api/v1` |

Files: `render.yaml`, `backend/Dockerfile`, `frontend/vercel.json`.

## Features

### Roles
- **Student** — take tests, view results, create personal training tests
- **Teacher** — create/manage tests, manage groups, view analytics
- **Admin** — manage all users, groups, platform statistics

### Question Types
1. Single choice (radio buttons)
2. Multiple choice (checkboxes)
3. True/False
4. Open answer (text + keyword auto-check)
5. Fill in the blank
6. Matching (drag & drop two columns)
7. Ordering (drag & drop list)

### Test Settings
- Time limit (whole test or per question)
- Attempt count
- Shuffle questions/answers
- Show correct answers after submission
- Passing score threshold
- Open/close dates
- Copy protection
- Tab-switch violation detection

### Server-Side Timer
- `started_at` stored in database on session start
- Browser polls `/sessions/{id}/remaining` every 30s
- Auto-submit runs server-side every 60s via APScheduler
- Page refresh recovers all answers and timer state

### Import/Export
- Import: `.docx`, `.xlsx`, `.json`
- Export test as `.pdf`
- Export results as `.xlsx`

### Analytics
- Score distribution chart (Recharts)
- Per-question accuracy ranking
- Pass rate, average score
- Student ranking table

### Gamification
- Day streaks tracked per user
- Badges: first test, perfect score, 10/50 tests, 7/30 day streaks
- Progress bar in test navigation

## Project Structure

```
tst-ap/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   ├── core/         # Config, security, DB, deps
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic (grading, sessions, badges)
│   ├── alembic/          # DB migrations
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/          # Axios API clients
    │   ├── app/          # Redux store + slices
    │   ├── components/   # Shared UI + layout + test components
    │   ├── pages/        # Route pages (public/student/teacher/admin)
    │   └── i18n/         # Ukrainian and English translations
    ├── tailwind.config.js
    └── package.json
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/tests` | List tests |
| POST | `/api/v1/tests` | Create test |
| POST | `/api/v1/sessions/start` | Start test session |
| PATCH | `/api/v1/sessions/{id}/answers` | Save answer |
| GET | `/api/v1/sessions/{id}/remaining` | Get time remaining |
| POST | `/api/v1/sessions/{id}/submit` | Submit test |
| GET | `/api/v1/results/test/{id}/analytics` | Test analytics |
| GET | `/api/v1/stats/teacher` | Teacher stats |

Full interactive docs: http://localhost:8000/docs
