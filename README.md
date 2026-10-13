# TaskTrack — PRN232 Assignment 2 Frontend

Next.js App Router, React and TypeScript. Assignment 2 extends the original Assignment 1 frontend: public pages and the green theme are retained; authentication and protected management are added.

## Local setup

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev -- --port 3012
```

The API must be running separately. Set `NEXT_PUBLIC_API_URL` before building; default: `http://localhost:5102/api`. Backend CORS must allow the exact frontend origin.

Public routes: overview, departments/projects/tasks/details, tags and workspace search.
The public directories and global stylesheet retain the AS1 baseline. Public pages use only the header Manage link to reach `/admin`; directory and detail headers have no duplicate Manage buttons. The public home uses GuestOverview: three compact totals, an in-progress project spotlight, a project portfolio and department discovery. Its links open public pages without requiring a session.
Tasks contains the existing title/status/priority/project/tag filters. Tags has a name search. `/search` searches names and descriptions across all four public record types and groups the results; tag results open `/tasks?tagId=...`. Global search filters existing full-list GET responses in the browser; it does not use account data or introduce a new backend endpoint.
Departments, Projects, Tasks and Tags paginate six records per public page and ten rows per management page. Search/filter changes return to page one; deleting the last row on the last page shows the last remaining page. Pagination uses the existing full-list API responses; form dropdowns and dashboard totals still use all records. Move pagination to the API when list sizes require limiting data transfer.
The AS1 stylesheet is kept in `app/globals.css`; AS2 account navigation, auth forms, dashboard cards and dialogs use `app/as2.css`. One layout guard keeps the existing public project table scrolling inside its panel on narrow screens.
Authenticated Staff/Admin: `/admin`, `/admin/departments`, `/admin/projects`, `/admin/tasks`, `/admin/tags`.
Admin only: `/admin/accounts`.
Accounts locks your own Role selector and omits role from your own name update. The last Admin's Role/Delete controls are disabled with an explanation. The API enforces both rules independently, including concurrent role changes and deletions; other account names and permitted role changes remain editable.

Management and profile pages use a vertical sidebar for Dashboard, Departments, Projects, Tasks and Tags; Accounts appears only for Admin. At 900px and below, **Workspace menu** expands the vertical links and closes after selection. The header keeps Profile, Logout and **View public site**. Use **Manage** on public pages to return to management. The page actions contain Create/Edit/Delete rather than another dashboard link.

The protected `/admin` dashboard shows the four required totals, task status, work by department, project completion and open task deadlines. Completion excludes cancelled tasks; overdue dates use the viewer's calendar date. These analytics remain on the management dashboard; the public home focuses on discovery.

Register creates Staff. Login stores the JWT/session in localStorage, as permitted by the assignment. Access tokens last 15 minutes; refresh tokens rotate and expire seven days after login. The shared API helper refreshes and retries a 401 once; Web Locks coordinate tabs. Invalid refresh tokens clear the session and return to login. Logout revokes the server session, clears local storage and returns home. The frontend uses only the backend API.

`/profile` lets Staff/Admin update their own name and change password with current-password verification. Password changes revoke old tokens and require signing in again. The backend supports one active refresh session per account, so a new login replaces a previous refresh session.
Profile uses two aligned cards on wide screens and one column on smaller screens, with readable labels, 48px inputs and consistent action footers. Email remains read-only and role appears as a badge; password fields retain independent eye buttons and password-manager autocomplete.

Create/edit use accessible native dialogs; delete uses confirmation. Tables scroll within their container on narrow screens. Field errors stay visible, labels link to inputs, and reduced motion is supported.
Management forms share readable labels, 48px controls, full-width names/descriptions and paired selectors/dates. On phones they become one column. Header/actions remain visible while scrolling, except on screens 500px high or less, where normal scrolling leaves room for input. Accounts uses the same edit dialog; account creation remains registration.

## Verification

```powershell
npm run lint
npm test
npm run build
npm run typecheck
npm run start -- --port 3012
```

Browser tests use the real running API/database. Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STAFF_EMAIL`, `STAFF_PASSWORD`, `API_BASE_URL`, and the same isolated `TEST_DATABASE_URL` used by backend tests. Node 24, psql and Chromium are required.

For public UI, navigation, form and account-protection checks, run `npm run test:e2e -- directories.spec.ts overview.spec.ts admin-dashboard.spec.ts navigation.spec.ts management-forms.spec.ts password-visibility.spec.ts pagination.spec.ts profile.spec.ts account-protection.spec.ts` against the running frontend. These tests mock the API and do not require database credentials. When using the current dev server, set `TEST_FRONTEND_URL=http://localhost:3012` to match its hostname.

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

Live frontend: [TaskTrack AS2](https://qe190064-prn232-ass2-fe.vercel.app), verified on 13 October 2026. AS1 public pages, profile/password changes, refresh across two tabs and server logout are deployed. Live acceptance passed 76 API checks covering 34 endpoint patterns and 23 UI checks; generated fixtures were cleaned and existing business record counts were preserved. The existing Vercel project is connected to this GitHub repository with `main` as the production branch. Grading credentials and live URLs are in the private `QE190064_SE19B_Ass2.docx` submission document.

See `design-system/tasktrack/MASTER.md` for the current design decisions and `design-system/tasktrack/REVIEW_2026-10-13.md` for AS1 restoration and AS2 verification.
