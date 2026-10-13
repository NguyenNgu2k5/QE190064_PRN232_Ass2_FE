# TaskTrack — AS1 frontend extended for AS2

Direction confirmed on 13 October 2026: reuse the original Assignment 1 frontend and add the required Assignment 2 functionality.

- Public pages keep the original AS1 green theme, Geist typography, hero, lists, cards and filters. The nine public pages match AS1 with management links updated for AS2.
- app/globals.css retains the AS1 baseline. app/as2.css adds account navigation, admin pages, authentication/profile forms, feedback, dialogs and the narrow detail-panel guard.
- The existing AS1 top navigation stays in place. Its Manage link points to /admin; AS2 adds Login/Register or the user's name and Logout.
- Public management links change from /{section}/manage to /admin/{section}, as required by AS2. Public read routes and backend GET APIs remain available to guests.
- The public home retains the AS1 hero, three totals for departments/projects/tasks and Projects in motion. The protected /admin dashboard has four separate summary cards for departments, projects, tasks and tags.
- Management navigation links to Dashboard, Departments, Projects, Tasks and Tags; Accounts is shown only to Admin.
- Keep the tested AS2 JWT/session client, auth validation, protected layout and Admin-only accounts. Refresh expired access once, coordinate tabs with Web Locks and return to login when refresh fails. Profile changes the account name/password; logout revokes the server session.
- Create/Edit use native dialogs; deletion requires confirmation; tasks are soft-deleted and tags use multi-select. Retain modal Escape/focus restoration, linked field labels and persistent errors.
- Keep nonvisual accessibility attributes added to the project task table and empty states.
- Reuse the existing dependencies. Do not copy AS1 secrets, database settings or generated files, or downgrade the installed Next.js version.
- The earlier blue/sidebar redesign is historical and no longer the implementation target.
- Older page-specific redesign notes are historical; the original AS1 pages are the public UI reference.
