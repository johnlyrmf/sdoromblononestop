# DCP Traces in the ICT workspace

Open `portal/ict/dcp-traces/` from the authenticated ICT dashboard. The map, directory, and workbook import are separate from the OneStop request queue and DTR generator. The page uses the existing OneStop Firebase Authentication session and reads `/users/{uid}` to admit active ICT staff or administrators. Firestore rules independently protect the `dcp_schools` collection.

The import accepts one or several `.xlsx` files based on the school ICT inventory template. It reads the workbook in the browser, shows extracted school summaries and warnings, and saves only confirmed summaries under each School ID. It does not upload or retain original workbooks, personnel rows, or individual equipment records. Re-uploading the same School ID replaces that school's summary. Open map pages receive Firestore updates live.

The collection starts empty. Import the first school workbook through the new page after the Firestore rules are deployed. Compare each preview with its source workbook before using the counts as official inventory. Keep detailed mapping notes outside the public website folder.

`firebase/firestore.rules` must be deployed separately from the static website. A code-only deployment will show the DCP launcher, but Firestore will deny reads and writes until that rule is live. Do not relax the collection rule to public access. No live Firebase deployment or school import was performed as part of the local integration.
