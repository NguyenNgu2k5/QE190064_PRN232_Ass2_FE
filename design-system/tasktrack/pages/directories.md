# Public directory style

The latest 13 October 2026 request keeps one header Manage link, adds task/tag search and makes Search cover the entire public workspace. Preserve the current green directory style.

- Use the existing green palette and Geist font. Headers use the same 36–52px scale and 32px spacing as Overview.
- White surfaces, 18px corners, restrained borders and 20–24px padding form one common card and panel style.
- Search panels use 16px gaps, 20px padding and 16px corners. Labels use 12px sans serif type; inputs, selects and submit buttons share a 48px height and 10px corners, with 16px input text. Buttons stay still on hover and expand to full width on phones. Project filters wrap into two rows on tablets.
- No directory or detail heading repeats Manage; the header link remains the entry to protected management.
- Department cards and detail headings show a mint project-count badge, with a bold number and correct singular/plural label. The count includes displayed projects in all statuses; avoid describing it as ongoing or active projects.
- Project/task card footers separate metadata with a top border. Use explicit Department/Project and Starts/Due labels, dark 14px association names, and 13px dates; wrap long names without clipping.
- Tasks uses TaskDirectory with the existing debounced title, status, priority, project and tag filters. A tagId query parameter preselects a tag.
- Tags retains its label panel and adds a submitted, case-insensitive name search.
- Search has a keyword input and record-type selection. Group matching names/descriptions into Departments, Projects, Tasks and Tags with result counts and public links. Tag results lead to filtered Tasks.
- The workspace search panel uses a two-column grid: a flexible keyword field and a 220–280px result-type field. Both have an 18px label row and a 48px control row; stack the fields on phones.
- Keep the existing APIs, filters and detail links. Use visible focus, stable hover states and 3/2/1 columns for desktop/tablet/mobile.
