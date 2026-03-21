/**
 * Client-side implementations of all 7 spreadsheet operations.
 * All processing happens in the browser — no data leaves the user's machine.
 */

import { readFile, download, downloadCompareXlsx } from './spreadsheet'

const EMPTY_VALUES = new Set(['na', 'n/a', 'null', 'none', 'nil', '-', '--', ''])

function timestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

// --- 1. Merge ---

export async function merge(files, format) {
  let allRows = []
  let referenceCols = null
  const warnings = []

  for (const file of files) {
    const { columns, rows } = await readFile(file)

    if (referenceCols === null) {
      referenceCols = columns
    } else {
      const refSet = new Set(referenceCols)
      const curSet = new Set(columns)
      const extra = columns.filter(c => !refSet.has(c))
      const missing = referenceCols.filter(c => !curSet.has(c))
      if (extra.length) warnings.push(`${file.name}: extra columns: ${extra.join(', ')}`)
      if (missing.length) warnings.push(`${file.name}: missing columns: ${missing.join(', ')}`)
    }

    allRows = allRows.concat(rows)
  }

  // Reorder columns: reference first, then extras
  const allColSet = new Set(allRows.length > 0 ? Object.keys(allRows[0]) : [])
  for (const row of allRows) {
    for (const key of Object.keys(row)) allColSet.add(key)
  }
  const ordered = [...referenceCols.filter(c => allColSet.has(c))]
  for (const c of allColSet) {
    if (!ordered.includes(c)) ordered.push(c)
  }

  // Reorder each row
  const orderedRows = allRows.map(row => {
    const newRow = {}
    for (const col of ordered) newRow[col] = row[col] ?? ''
    return newRow
  })

  const filename = `merged_${timestamp()}.${format}`
  download(orderedRows, filename, format)

  return {
    filename,
    rows: orderedRows.length,
    columns: ordered.length,
    files_merged: files.length,
    warnings,
  }
}

// --- 2. Convert ---

export async function convert(files) {
  const results = []

  for (const file of files) {
    const { rows } = await readFile(file)
    const ext = file.name.split('.').pop().toLowerCase()
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const targetFmt = ext === 'csv' ? 'xlsx' : 'csv'
    const filename = `${baseName}_converted.${targetFmt}`

    download(rows, filename, targetFmt)
    results.push({
      original: file.name,
      converted_to: targetFmt,
      rows: rows.length,
      filename,
    })
  }

  return { results }
}

// --- 3. Deduplicate ---

export async function deduplicate(files, columns, format) {
  const results = []

  for (const file of files) {
    const { rows } = await readFile(file)
    const originalCount = rows.length

    const seen = new Set()
    const deduped = rows.filter(row => {
      const key = columns
        ? columns.map(c => String(row[c] ?? '')).join('|||')
        : Object.values(row).map(v => String(v ?? '')).join('|||')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const baseName = file.name.replace(/\.[^.]+$/, '')
    const filename = `${baseName}_deduped_${timestamp()}.${format}`
    download(deduped, filename, format)

    results.push({
      original: file.name,
      original_rows: originalCount,
      final_rows: deduped.length,
      duplicates_removed: originalCount - deduped.length,
      filename,
    })
  }

  return { results }
}

// --- 4. Filter Columns ---

export async function filterColumns(file, columns, format) {
  const { columns: allCols, rows } = await readFile(file)

  const missing = columns.filter(c => !allCols.includes(c))
  const keep = columns.filter(c => allCols.includes(c))

  if (keep.length === 0) {
    throw new Error('None of the specified columns exist in the file.')
  }

  const filtered = rows.map(row => {
    const newRow = {}
    for (const col of keep) newRow[col] = row[col] ?? ''
    return newRow
  })

  const baseName = file.name.replace(/\.[^.]+$/, '')
  const filename = `${baseName}_filtered_${timestamp()}.${format}`
  download(filtered, filename, format)

  return {
    rows: filtered.length,
    columns_kept: keep,
    columns_missing: missing,
    filename,
  }
}

// --- 5. Compare ---

export async function compare(files, keyColumn) {
  if (files.length !== 2) throw new Error('Exactly 2 files required.')

  const data1 = await readFile(files[0])
  const data2 = await readFile(files[1])

  let rows1 = data1.rows
  let rows2 = data2.rows

  // Build index maps
  const buildIndex = (rows, key) => {
    const map = new Map()
    rows.forEach((row, i) => {
      const k = key ? String(row[key] ?? '') : String(i)
      if (!map.has(k)) map.set(k, row)
    })
    return map
  }

  const index1 = buildIndex(rows1, keyColumn)
  const index2 = buildIndex(rows2, keyColumn)

  const keys1 = new Set(index1.keys())
  const keys2 = new Set(index2.keys())

  // Collect all columns
  const allColsSet = new Set()
  for (const cols of [data1.columns, data2.columns]) {
    for (const c of cols) allColsSet.add(c)
  }
  const allCols = [...allColsSet]

  let added = 0, removed = 0, changed = 0, unchanged = 0
  const resultRows = []

  // Removed (in file1 only)
  for (const k of [...keys1].sort()) {
    if (!keys2.has(k)) {
      const row = { _Status: 'removed' }
      if (keyColumn) row[keyColumn] = k
      for (const col of allCols) row[col] = index1.get(k)[col] ?? ''
      resultRows.push(row)
      removed++
    }
  }

  // Changed (in both, but different)
  for (const k of [...keys1].filter(k => keys2.has(k)).sort()) {
    const r1 = index1.get(k)
    const r2 = index2.get(k)
    const isDiff = allCols.some(col => String(r1[col] ?? '') !== String(r2[col] ?? ''))
    if (isDiff) {
      const row = { _Status: 'changed' }
      if (keyColumn) row[keyColumn] = k
      for (const col of allCols) row[col] = r2[col] ?? ''
      resultRows.push(row)
      changed++
    }
  }

  // Added (in file2 only)
  for (const k of [...keys2].sort()) {
    if (!keys1.has(k)) {
      const row = { _Status: 'added' }
      if (keyColumn) row[keyColumn] = k
      for (const col of allCols) row[col] = index2.get(k)[col] ?? ''
      resultRows.push(row)
      added++
    }
  }

  // Unchanged
  for (const k of [...keys1].filter(k => keys2.has(k)).sort()) {
    const r1 = index1.get(k)
    const r2 = index2.get(k)
    const isDiff = allCols.some(col => String(r1[col] ?? '') !== String(r2[col] ?? ''))
    if (!isDiff) {
      const row = { _Status: 'unchanged' }
      if (keyColumn) row[keyColumn] = k
      for (const col of allCols) row[col] = r2[col] ?? ''
      resultRows.push(row)
      unchanged++
    }
  }

  const filename = `comparison_${timestamp()}.xlsx`
  await downloadCompareXlsx(resultRows, filename)

  return { added, removed, changed, unchanged, filename }
}

// --- 6. Trim & Clean ---

export async function trimClean(files, format) {
  const results = []

  for (const file of files) {
    const { rows } = await readFile(file)
    let trimmed = 0
    let normalized = 0

    const cleaned = rows.map(row => {
      const newRow = {}
      for (const [key, val] of Object.entries(row)) {
        const cleanKey = typeof key === 'string' ? key.trim() : key
        if (typeof val !== 'string') {
          newRow[cleanKey] = val
          continue
        }
        const stripped = val.trim()
        if (stripped !== val) trimmed++
        if (EMPTY_VALUES.has(stripped.toLowerCase())) {
          newRow[cleanKey] = ''
          normalized++
        } else {
          newRow[cleanKey] = stripped
        }
      }
      return newRow
    })

    const baseName = file.name.replace(/\.[^.]+$/, '')
    const filename = `${baseName}_cleaned_${timestamp()}.${format}`
    download(cleaned, filename, format)

    results.push({
      original: file.name,
      cells_trimmed: trimmed,
      cells_normalized: normalized,
      filename,
    })
  }

  return { results }
}

// --- 7. Remove Empty ---

export async function removeEmpty(files, format) {
  const results = []

  for (const file of files) {
    const { columns, rows } = await readFile(file)
    const origRows = rows.length
    const origCols = columns.length

    // Remove empty rows
    const nonEmptyRows = rows.filter(row =>
      Object.values(row).some(v => String(v ?? '').trim() !== '')
    )

    // Find non-empty columns
    const nonEmptyCols = columns.filter(col =>
      nonEmptyRows.some(row => String(row[col] ?? '').trim() !== '')
    )

    // Rebuild rows with only non-empty columns
    const cleaned = nonEmptyRows.map(row => {
      const newRow = {}
      for (const col of nonEmptyCols) newRow[col] = row[col] ?? ''
      return newRow
    })

    const baseName = file.name.replace(/\.[^.]+$/, '')
    const filename = `${baseName}_stripped_${timestamp()}.${format}`
    download(cleaned, filename, format)

    results.push({
      original: file.name,
      rows_removed: origRows - cleaned.length,
      cols_removed: origCols - nonEmptyCols.length,
      final_rows: cleaned.length,
      final_cols: nonEmptyCols.length,
      filename,
    })
  }

  return { results }
}
