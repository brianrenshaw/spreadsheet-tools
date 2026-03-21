/**
 * Client-side spreadsheet reading/writing utilities.
 * All processing happens in the browser — no data leaves the user's machine.
 */

import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

// --- File Reading ---

/**
 * Read a File object into an array of row objects.
 * Returns { columns: string[], rows: object[] }
 */
export async function readFile(file) {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array', raw: false })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  const columns = rows.length > 0 ? Object.keys(rows[0]) : []
  return { columns, rows }
}

/**
 * Read just the column names from a file.
 */
export async function readColumns(file) {
  const { columns } = await readFile(file)
  return columns
}

// --- File Writing ---

function buildWorkbook(rows) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return wb
}

export function downloadAsXlsx(rows, filename) {
  const wb = buildWorkbook(rows)
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, filename)
}

export function downloadAsCsv(rows, filename) {
  const wb = buildWorkbook(rows)
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets['Sheet1'])
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, filename)
}

export function download(rows, filename, format) {
  if (format === 'csv') {
    downloadAsCsv(rows, filename)
  } else {
    downloadAsXlsx(rows, filename)
  }
}

/**
 * Download a compare result with color-coded rows using ExcelJS.
 */
export async function downloadCompareXlsx(rows, filename) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Comparison')

  if (rows.length === 0) return

  // Add header row
  const columns = Object.keys(rows[0])
  ws.addRow(columns)

  // Style header
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true }

  // Color fills
  const fills = {
    added: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } },
    removed: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } },
    changed: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } },
  }

  // Add data rows with colors
  for (const row of rows) {
    const dataRow = ws.addRow(columns.map(col => row[col] ?? ''))
    const status = row['_Status']
    if (fills[status]) {
      dataRow.eachCell((cell) => {
        cell.fill = fills[status]
      })
    }
  }

  // Auto-width columns
  ws.columns.forEach((col, i) => {
    col.width = Math.min(30, Math.max(10, columns[i].length + 4))
  })

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, filename)
}
