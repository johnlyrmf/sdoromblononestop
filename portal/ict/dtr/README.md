# ICT Daily Time Record Generator

Open **Daily Time Record Generator** from the ICT tools card. You sign in to enter the ICT workspace; the DTR page then opens directly without asking you to authenticate again. The standalone DTR page itself is a static page and processes only files selected in your browser.

## What it does

- Reads the regular monthly ZKTime `.xlsx` export and, optionally, a separate guards `.xls` or `.xlsx` log.
- Applies the existing regular-employee and guards punch rules independently.
- Lists exceptions for review and can download the exception list as CSV.
- Builds template-based workbooks by office and downloads them in one ZIP. An uploaded guards log is written to a separate Guards workbook.
- Processes attendance files locally in the browser; it does not upload logs or generated records.

## Employee roster

The app preloads approved employee display names and office labels from `assets/official-roster-data.js`, like the preloaded DTR template. This static data is public and downloadable with the site, so include only names and office labels approved for public disclosure. The source roster workbook stays local and is excluded from Git. ICT can upload a replacement workbook in the **Official employee names** card; that override is saved in the current browser. Attendance logs and generated DTR workbooks remain local and are never uploaded.

## Folder map

- `index.html` — DTR interface and existing browser-side generator.
- `assets/template-data.js` — embedded DTR template.
- `assets/official-roster-data.js` — preloaded employee names and office labels approved for public availability.
- `assets/jszip.min.js` — local ZIP library.
- `licenses/` — JSZip license.
