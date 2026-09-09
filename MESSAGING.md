# Spreadsheet Tools messaging

## Customer and purpose

Help people get routine spreadsheet tasks done with less effort. Administrative staff handling lists and exports are a useful example, but the audience is anyone who needs these tasks done. Do not restrict the public message to a job title.

The problem is tedious file preparation: combining exports, finding duplicates, comparing versions, and cleaning up data. The promise is a clear way to choose a task, add files, and download the result without installation or an account. Success means a usable file and less manual work.

## Approved copy

Headline: **Make everyday spreadsheet tasks easier.**

Supporting copy: Combine files, remove duplicates, compare spreadsheets, and convert formats. Choose what you need to do, add your files, and download the result.

Reassurance: No installation or account needed. Your files stay in your browser.

Primary prompt: **What do you need to do?**

Plan: Choose a tool. Add your files. Download the result.

## Feature and interaction priorities

Show all seven tools before asking for files. Each card explains its task and file requirements. Keep tool names concrete:

- Combine files
- Convert CSV or Excel
- Remove duplicate rows
- Keep selected columns
- Compare two files
- Clean up spaces and blanks
- Remove empty rows and columns

Selecting a tool opens its workspace. Keep existing files when switching tools and keep the selected tool when adding or removing files. Explain unmet file requirements in the workspace. Clear obsolete results and column choices when files change. Use specific download actions instead of a generic Run button.

Privacy supports confidence. Downloadable scripts and source links are secondary. Do not hide the capabilities behind an accordion or require files before visitors can discover them.

## Verified boundaries

Processing happens in the browser. There is no account or installation requirement. Original files stay unchanged. CSV, XLSX, and XLS inputs are accepted; Excel input uses the first worksheet. Outputs contain data values, without preserving original workbook formatting. Do not market this as a full spreadsheet editor or AI assistant.

Combining needs at least two files. Comparing needs exactly two, with the older file first and newer file second. Keeping columns uses one file. Other tools accept multiple files and produce separate results. Cleaning spaces and blank-like values is distinct from removing entirely empty rows and columns. Do not promise formulas, charts, workbook formatting, all-sheet processing, or offline availability.

## Copy locations and maintenance

- `frontend/src/App.jsx`: introduction, three steps, workspace instructions, privacy and file limitations.
- `frontend/src/lib/tools.js`: task names, card descriptions, actions, and file requirements.
- `frontend/src/components/FileDropZone.jsx`: file selection, empty-file and format errors.
- `frontend/src/components/OperationForm.jsx`: download options and action labels.
- `frontend/src/components/ResultPanel.jsx`: result summaries.
- `frontend/index.html`: page title, search and social descriptions.
- The portfolio repository's `site/index.html`: Spreadsheet Tools utility section.

Edit source, then follow `WEBSITE_MIGRATION.md` to build and publish. Never edit generated assets directly. Preserve processing behavior when changing copy. Keep help short and near the relevant choice. Use plain language, concrete benefits, no em dashes, no developer jargon in marketing, and no exhaustive feature lists in the introduction. The visible tool catalog is the place to explain capabilities.
