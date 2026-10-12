# Overview dashboard

The 13 October 2026 request replaces the public home hero and portfolio cards with a dashboard. This page overrides the home layout in MASTER.md.

- Retain the green theme, Geist type, top navigation and shared UI components.
- Show four metrics: total tasks, total projects, completion rate and overdue tasks.
- Use the existing public GET APIs. Never invent historical trends or percentage changes.
- Show a status donut with a text legend, department task counts, project task progress and the earliest open deadlines.
- Completion excludes cancelled tasks. Overdue means an open task's date is before today in the viewer's timezone.
- Use scoped styles in app/as2.css, existing dependencies, keyboard-accessible links and layouts for desktop and mobile.
- Keep the protected management dashboard separate.
