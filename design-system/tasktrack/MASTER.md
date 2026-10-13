# TaskTrack — AS1 frontend extended for AS2

Direction confirmed on 13 October 2026: reuse the original Assignment 1 frontend and add the required Assignment 2 functionality.

- Public pages keep the original AS1 green theme, Geist typography, lists, cards and filters, with the guest overview and search changes described in the page overrides.
- app/globals.css retains the AS1 baseline. app/as2.css adds account navigation, admin pages, authentication/profile forms, feedback, dialogs and the narrow detail-panel guard.
- The existing AS1 top navigation stays in place. Its Manage link points to /admin; AS2 adds Login/Register or the user's name and Logout.
- Public pages keep only the header Manage link to /admin. Remove duplicate Manage actions from directory and detail headings. Public read routes and backend GET APIs remain available to guests.
- Tasks owns task filters; Tags has name search; /search searches all four public record types with grouped results. Tag search results open the task directory filtered by tagId.
- All four directories share Pagination: six records on public pages, ten rows in management, range/total text, numbered pages and Previous/Next. Filters reset to the first page; shrinking data clamps to the last available page. On phones, show the current page with Previous/Next. Keep full data available for form selectors and analytics.
- The public home uses GuestOverview: compact totals, an in-progress project spotlight, portfolio rows and department discovery. The protected /admin dashboard uses Overview for task status, department workload, project completion and deadlines. See pages/overview.md for the public home style.
- Management and profile pages show one vertical sidebar with Dashboard, Departments, Projects, Tasks and Tags; Accounts is shown only to Admin. The header keeps View public site, Profile and Logout. At 900px and below, show a keyboard-accessible Workspace menu button that expands the vertical links and closes after selection. Keep public navigation on public pages.
- Keep the tested AS2 JWT/session client, auth validation, protected layout and Admin-only accounts. Refresh expired access once, coordinate tabs with Web Locks and return to login when refresh fails. Profile changes the account name/password; logout revokes the server session.
- Accounts disables the current Admin's own Role selector and omits role from their name update. Disable demotion/deletion of the last Admin. Keep explanatory text next to Role and a reason on the disabled Delete button; the backend remains authoritative for stale lists and concurrent requests.
- Create/Edit use native dialogs; deletion requires confirmation; tasks are soft-deleted and tags use multi-select. Retain modal Escape/focus restoration, linked field labels and persistent errors.
- Management forms share a 720px dialog, a title with context, 14px sentence-case labels, 48px controls and Cancel before the primary action. Names/titles and descriptions span the form; paired selectors/dates use two columns, collapsing to one on phones. Dialog header/actions remain visible while scrolling, except on short screens (500px high or less), where they scroll normally to leave room for focused fields. Account editing uses the same presentation.
- Keep nonvisual accessibility attributes added to the project task table and empty states.
- Password inputs use independent inline eye buttons in Field, with contextual Show/Hide labels, 44px targets and keyboard activation. Preserve field IDs, validation links and autocomplete; toggling never submits a form.
- Profile uses aligned account/password cards with 14px labels, 48px inputs and action footers. Role is a badge and email is read-only; helper text stays linked to inputs. Switch to one column at 1100px and below. Preserve profile validation, save feedback and sign-out after password changes.
- Reuse the existing dependencies. Do not copy AS1 secrets, database settings or generated files, or downgrade the installed Next.js version.
- The earlier blue/sidebar redesign is historical and no longer the implementation target.
- Older page-specific redesign notes are historical; the original AS1 pages are the public UI reference.
