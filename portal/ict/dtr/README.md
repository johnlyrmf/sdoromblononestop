# ICT Daily Time Record Generator

Open **Daily Time Record Generator** from the ICT tools card. You sign in to enter the ICT workspace; the DTR page then opens directly without asking you to authenticate again. The standalone DTR page itself is a static page and processes only files selected in your browser.

## What it does

- Reads the regular monthly ZKTime `.xlsx` export and, optionally, a separate guards `.xls` or `.xlsx` log.
- Applies the existing regular-employee and guards punch rules independently.
- Lists exceptions for review and can download the exception list as CSV.
- Builds template-based workbooks by office and downloads them in one ZIP. An uploaded guards log is written to a separate Guards workbook.
- Processes attendance files locally in the browser; it does not upload logs or generated records.

## Employee roster privacy

The employee roster is not included in the OneStop site's public files. ICT can upload the approved roster workbook in the **Official employee names** card. The app saves extracted names and office labels in that browser's local storage. Without a roster, it retains names from the log and uses the log department for office grouping.

Keep attendance logs, roster workbooks, exception exports, and generated DTR workbooks out of Git. The preloaded official DTR template and JSZip dependency are in `assets/`; JSZip's license is in `licenses/`.

## Folder map

- `index.html` — DTR interface and existing browser-side generator.
- `assets/template-data.js` — embedded DTR template.
- `assets/jszip.min.js` — local ZIP library.
- `licenses/` — JSZip license.
