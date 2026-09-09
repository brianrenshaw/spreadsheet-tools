# Spreadsheet website maintenance

Public browser tools: https://brianrenshaw.app/spreadsheet-tools/
Public contact: contact@brianrenshaw.app

The browser tool source remains in `spreadsheet-webapp` (GitHub: brianrenshaw/spreadsheet-tools). The downloadable Python scripts remain in `spreadsheet-scripts`. The portfolio hosts the generated browser build in `brianrenshaw-app-site/site/spreadsheet-tools/`. No files are uploaded for processing.

For website updates, edit `spreadsheet-webapp/frontend`, run `npm ci` and `npm run lint` there, then run `python3 scripts/sync-website.py` from spreadsheet-webapp. This rebuilds and replaces only the generated spreadsheet-tools directory in the sibling portfolio checkout. Never hand-edit generated JavaScript. Commit source changes in spreadsheet-webapp and generated files in brianrenshaw-app-site; push both. The portfolio Actions deployment publishes the browser app. Verify the new URL and its assets after deployment. Keep the old spreadsheet-tools Pages deployment enabled for its redirect.

Design follows Folio: warm cream, orange, system typography, and rounded surfaces. Utilities stay at the bottom of the portfolio. Preserve actual spreadsheet operations, keyboard support, privacy copy, and query/fragment-preserving redirects. No DNS changes are needed for this subpath.

September 9, 2026: canonical deployment passed HTTPS and generated asset checks. Seven operation smoke checks passed, including generated XLSX read-back. Legacy Pages now publishes a browser redirect preserving query strings and fragments, with a visible no-JavaScript fallback link. No connected browser was available for rendered visual or interactive download QA.
