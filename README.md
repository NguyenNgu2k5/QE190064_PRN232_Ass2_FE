# TaskTrack — PRN232 Assignment 2 Frontend

Next.js App Router, React and TypeScript. Separate Assignment 2 source forked from Assignment 1, with a new navy sidebar and blue/slate dashboard.

## Local setup

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev -- --port 3012
```

The API must be running separately. Set `NEXT_PUBLIC_API_URL` before building; default: `http://localhost:5102/api`. Backend CORS must allow the exact frontend origin.

Public routes: overview, departments/projects/tasks/details, tags and task search.
Authenticated Staff/Admin: `/admin`, `/admin/departments`, `/admin/projects`, `/admin/tasks`, `/admin/tags`.
Admin only: `/admin/accounts`.

Register creates Staff. Login stores the JWT/session in localStorage, as permitted by the assignment. Refresh verifies it via `/api/auth/me`; expired/invalid tokens clear the session and return to login. Logout clears it and returns home. The frontend uses only the backend API.

Create/edit use accessible native dialogs; delete uses confirmation. Tables scroll within their container on narrow screens. Field errors stay visible, labels link to inputs, and reduced motion is supported.

## Verification

```powershell
npm run lint
npm test
npm run build
npm run typecheck
npm run start -- --port 3012
```

Browser tests use the real running API/database. Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STAFF_EMAIL`, `STAFF_PASSWORD`, `API_BASE_URL`, and the same isolated `TEST_DATABASE_URL` used by backend tests. Node 24, psql and Chromium are required.

```powershell
# If Chromium is already installed elsewhere:
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = 'PATH_TO_CHROMIUM_EXECUTABLE'
npm run test:e2e
```

Optional `TEST_FRONTEND_URL` defaults to `http://127.0.0.1:3012`; `PSQL_EXE` overrides psql; `SCREENSHOT_DIR` writes visual QA artifacts. Tests clean only generated fixtures. Run on an isolated local AS2 database, without concurrent writers.

Production dependencies were upgraded to Next.js 16.3.8 and source-map-js 1.2.2. The remaining braces advisory belongs to the ESLint development dependency chain; there is no patched braces release in the checked registry. Do not force-downgrade the Next ESLint configuration to resolve it.

See `design-system/tasktrack/MASTER.md` for the design decisions. Production deployment and submission DOCX are P12.
