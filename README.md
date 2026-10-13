# TaskTrack — PRN232 Assignment 2 Frontend

Next.js App Router, React and TypeScript. Assignment 2 extends the original Assignment 1 frontend: public pages and the green theme are retained; authentication and protected management are added.

## Local setup

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev -- --port 3012
```

The API must be running separately. Set `NEXT_PUBLIC_API_URL` before building; default: `http://localhost:5102/api`. Backend CORS must allow the exact frontend origin.

Public routes: overview, departments/projects/tasks/details, tags and task search.
The nine public page implementations and global stylesheet match AS1, with management links redirected to `/admin/*`. The original home hero, three totals and projects are retained.
Public management links now lead to `/admin/*`. The AS1 stylesheet is kept in `app/globals.css`; AS2 account navigation, auth forms, dashboard cards and dialogs use `app/as2.css`. One layout guard keeps the existing public project table scrolling inside its panel on narrow screens.
Authenticated Staff/Admin: `/admin`, `/admin/departments`, `/admin/projects`, `/admin/tasks`, `/admin/tags`.
Admin only: `/admin/accounts`.

Register creates Staff. Login stores the JWT/session in localStorage, as permitted by the assignment. Access tokens last 15 minutes; refresh tokens rotate and expire seven days after login. The shared API helper refreshes and retries a 401 once; Web Locks coordinate tabs. Invalid refresh tokens clear the session and return to login. Logout revokes the server session, clears local storage and returns home. The frontend uses only the backend API.

`/profile` lets Staff/Admin update their own name and change password with current-password verification. Password changes revoke old tokens and require signing in again. The backend supports one active refresh session per account, so a new login replaces a previous refresh session.

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

For public UI checks, run `npm run test:e2e -- directories.spec.ts overview.spec.ts` against the running frontend. These tests mock the API and do not require database credentials.

```powershell
# If Chromium is already installed elsewhere:
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = 'PATH_TO_CHROMIUM_EXECUTABLE'
npm run test:e2e
```

Optional `TEST_FRONTEND_URL` defaults to `http://127.0.0.1:3012`; `PSQL_EXE` overrides psql; `SCREENSHOT_DIR` writes visual QA artifacts. Tests clean only generated fixtures. Run on an isolated local AS2 database, without concurrent writers.

Production dependencies were upgraded to Next.js 16.3.8 and source-map-js 1.2.2. The remaining braces advisory belongs to the ESLint development dependency chain; there is no patched braces release in the checked registry. Do not force-downgrade the Next ESLint configuration to resolve it.

## Vercel deployment

Import the public AS2 frontend repository, choose Next.js, use the repository root and Node.js 24.x. Install with `npm ci`, build with `npm run build`, and retain the framework's default output settings.

Before building, set `NEXT_PUBLIC_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api` for Production. Use the real Render URL; this public value is compiled into the browser bundle. Changes require a new deployment. Configure the backend's `CORS_ORIGINS` with the exact stable HTTPS Vercel origin, without a trailing slash. The frontend receives no database URL, JWT signing secret or account passwords.

Check `/login`, `/register`, Staff CRUD, Admin accounts and logout on the stable live URL. See [DEPLOYMENT.md](DEPLOYMENT.md) for the deployment checklist.

Live frontend: [TaskTrack AS2](https://qe190064-prn232-ass2-fe.vercel.app), verified on 13 October 2026. This deployment uses committed source uploaded through the Vercel API; the project still needs a GitHub Login Connection for automatic deployments from future pushes. Grading credentials and live URLs are in the private `QE190064_SE19B_Ass2.docx` submission document.

See `design-system/tasktrack/MASTER.md` for the current design decisions and `design-system/tasktrack/REVIEW_2026-10-13.md` for AS1 restoration and AS2 verification.
