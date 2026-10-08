# ICT DTR Generator

This folder is the dedicated DTR application within the SDO Romblon OneStop portal. Its public entry point is `index.html`.

## Keep the processor stable

- The DTR generation logic was migrated from the standalone `sdoromblondtrsystem` project. Do not change parsing, punch assignment windows, guards rules, workbook XML manipulation, formulas, sheet relationships, print setup, or output grouping unless the user explicitly asks.
- Attendance files are selected and processed in the browser. Never upload attendance logs, generated workbooks, or exception reports to a server.
- `assets/template-data.js` contains the preloaded official workbook template. Keep it with this app.
- Keep the JSZip library and its license together in `assets/` and `licenses/`.
- The official employee roster is intentionally not bundled here because public static assets can be downloaded without signing in. The app supports uploading the roster workbook and saves the extracted names and office labels in the local browser only.
- Do not add source attendance logs, employee roster workbooks, generated DTRs, or other private personnel data to this folder or Git.

## OneStop integration

- The authenticated ICT dashboard launches this app at `portal/ict/dtr/`.
- The ICT dashboard only reveals the launcher to signed-in ICT staff or administrators. The DTR page does not prompt for a second sign-in; attendance processing happens in the browser.
- Preserve the OneStop look and the navigation back to the ICT workspace.
- Keep this app self-contained in this folder. Shared portal branding assets and Firebase configuration are referenced by absolute/relative paths; do not copy unrelated portal or Firebase files here.

## Changes and verification

- Inspect Git status first and preserve existing user changes.
- Avoid altering the standalone source repository when changing this migrated app.
- Do not stage, commit, or push unless explicitly asked.
- When asked to verify a change, check the hosted path, access guard, and the DTR workflow in a browser without uploading private employee data.
