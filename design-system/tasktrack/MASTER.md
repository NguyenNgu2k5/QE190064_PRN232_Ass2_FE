# TaskTrack — AS1 frontend extended for AS2

Direction confirmed on 13 October 2026: reuse the original Assignment 1 frontend and add the required Assignment 2 functionality.

- Public pages keep the green theme and Geist typography. Overview uses a dashboard; Departments, Projects, Tasks, Tags and Search share its typography, white surfaces, spacing and rounded cards.
- app/globals.css retains the AS1 baseline. app/as2.css adds the shared public workspace style, account navigation, admin pages, authentication forms, feedback, dialogs and the narrow detail-panel guard.
- The existing AS1 top navigation stays in place. Its Manage link points to /admin; AS2 adds Login/Register or the user's name and Logout.
- Public management links change from /{section}/manage to /admin/{section}, as required by AS2. Public read routes and backend GET APIs remain available to guests.
- The public home shows total tasks, total projects, task completion and overdue tasks. The protected /admin dashboard has four separate summary cards for departments, projects, tasks and tags.
- Management navigation links to Dashboard, Departments, Projects, Tasks and Tags; Accounts is shown only to Admin.
- Keep the tested AS2 JWT/session client, auth validation, protected layout, Admin-only accounts and automatic redirect on expiry/API 401.
- Create/Edit use native dialogs; deletion requires confirmation; tasks are soft-deleted and tags use multi-select. Retain modal Escape/focus restoration, linked field labels and persistent errors.
- Keep nonvisual accessibility attributes added to the project task table and empty states.
- Reuse the existing dependencies. Do not copy AS1 secrets, database settings or generated files, or downgrade the installed Next.js version.
- The earlier blue/sidebar redesign is historical and no longer the implementation target.
- Page-specific rules are in pages/overview.md and pages/directories.md. Tasks and Search reuse TaskCard; directory cards align their content without truncation.
