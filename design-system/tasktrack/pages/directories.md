# Public directory style

The 13 October 2026 request unifies Departments, Projects, Tasks, Tags and Search with the overview dashboard. This overrides the original public directory styling in MASTER.md.

- Use the existing green palette and Geist font. Headers use the same 36–52px scale and 32px spacing as Overview.
- White surfaces, 18px corners, restrained borders and 20–24px padding form one common card and panel style.
- Filter labels use readable sans serif type. Inputs and buttons share a 46px height, with 16px input text on mobile.
- Directory rows share heading and result counts. Cards align their status, title, description and footer using CSS subgrid without truncating content.
- Tasks and Search reuse TaskCard. Tags use the same white card grid, with tag color confined to its dot.
- Keep the existing APIs, filters and detail links. Use visible focus, stable hover states and 3/2/1 columns for desktop/tablet/mobile.
