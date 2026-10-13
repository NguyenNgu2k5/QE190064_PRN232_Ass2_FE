# Guest workspace overview

The latest 13 October 2026 feedback asks for a guest overview distinct from the management dashboard. This page overrides the original home layout in MASTER.md.

- Retain the green theme, Geist type, top navigation and shared UI components.
- Use GuestOverview: a light introductory heading, three compact totals and a dark project spotlight. Prefer the first in-progress project; fall back to the first available project.
- Use the existing public GET APIs. Never invent historical trends or percentage changes.
- Show up to five project rows with descriptions, status and task counts, alongside up to five departments and their project counts. Full directory links expose the remaining records.
- Keep analytical charts, completion rates, workload and deadline alerts on the management dashboard.
- Use scoped styles in app/as2.css, existing dependencies, keyboard-accessible links and layouts for desktop and mobile.
- Guest links open public directories and details. The protected management dashboard keeps its existing analytics, management links and permissions.
