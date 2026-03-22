# Spreadsheet Tools

A web-based version of [Spreadsheet Scripts](https://github.com/brianrenshaw/spreadsheet-scripts) — quick access to common spreadsheet operations without installing Python or running scripts. Just open the page, drop your files, and go.

**Live at:** https://brianrenshaw.github.io/spreadsheet-webapp

## What's Included

| Tool | What It Does |
|------|-------------|
| **Merge Spreadsheets** | Combine multiple files into one, keeping a single header row |
| **Convert Format** | Convert between CSV and XLSX formats |
| **Deduplicate Rows** | Remove duplicate rows by all columns or chosen key columns |
| **Filter Columns** | Extract only the columns you need from a file |
| **Compare Spreadsheets** | Diff two files with color-coded added/removed/changed rows |
| **Trim & Clean** | Strip whitespace and normalize empty cells |
| **Remove Empty Rows/Columns** | Drop rows and columns that are entirely blank |

## How It Works

1. Drop your spreadsheet files onto the page (CSV or XLSX)
2. Pick an operation
3. Configure any options (output format, columns, etc.)
4. Download the result

All processing happens in your browser. Your files never leave your machine.

## Built With

- **React** + **Vite** — frontend UI
- **Tailwind CSS** — styling
- **ExcelJS** / **SheetJS** — spreadsheet processing in the browser
- **GitHub Pages** — hosting
- **GitHub Actions** — automated deployment on push

## Author

Developed by Brian Renshaw with [Claude Code](https://claude.ai/claude-code)
