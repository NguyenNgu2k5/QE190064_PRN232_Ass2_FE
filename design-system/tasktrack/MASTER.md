# TaskTrack interface

Product: task and team management web app with public reading and authenticated management.

The ui-ux-pro-max enterprise dashboard search verified the applicable Minimalism/Swiss style and blue/slate palette. Its marketing hero pattern does not fit this app; use the workspace layout below instead. This is product-specific layout guidance.

- Sidebar for Explore and Manage sections; account state and logout in the header.
- Blue #2563EB primary, slate #182438 text, #F5F7FB background, white surfaces; CSS variables are in globals.css.
- Geist typography already used by the project; clear hierarchy and tabular counts.
- Four real API totals, task distribution and recent projects on the overview.
- Native dialogs for CRUD and deletion, linked form labels, visible keyboard focus, field errors and a focused error summary for authentication forms.
- SVG icons with decorative semantics next to text, no icon dependency.
- Desktop/tablet/mobile at 1440/768/375px, internal table scrolling, no page overflow.
- Loading, empty, error and success states; errors persist for correction.
- Minimum 44px primary controls, reduced-motion support, password managers and paste supported.
- Public GET remains available; management pages use authentication, and Accounts require Admin.
