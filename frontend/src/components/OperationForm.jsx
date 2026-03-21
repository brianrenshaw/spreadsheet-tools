import { useState } from 'react'
import * as ops from '../lib/operations'

export default function OperationForm({ operation, files, onResult }) {
  const [format, setFormat] = useState('xlsx')
  const [selectedColumns, setSelectedColumns] = useState([])
  const [keyColumn, setKeyColumn] = useState('')
  const [dedupMode, setDedupMode] = useState('all')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const allColumns = files.length > 0 ? files[0].columns : []

  const toggleColumn = (col) => {
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    )
  }

  const handleSubmit = async () => {
    setProcessing(true)
    setError(null)

    const rawFiles = files.map(f => f.file)

    try {
      let result
      switch (operation) {
        case 'merge':
          result = await ops.merge(rawFiles, format)
          break
        case 'convert':
          result = await ops.convert(rawFiles)
          break
        case 'dedup':
          result = await ops.deduplicate(
            rawFiles,
            dedupMode === 'selected' ? selectedColumns : null,
            format,
          )
          break
        case 'filter':
          result = await ops.filterColumns(rawFiles[0], selectedColumns, format)
          break
        case 'compare':
          result = await ops.compare(rawFiles, keyColumn || null)
          break
        case 'trim':
          result = await ops.trimClean(rawFiles, format)
          break
        case 'remove-empty':
          result = await ops.removeEmpty(rawFiles, format)
          break
      }
      onResult(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const canSubmit = () => {
    if (processing) return false
    if (operation === 'filter' && selectedColumns.length === 0) return false
    if (operation === 'dedup' && dedupMode === 'selected' && selectedColumns.length === 0) return false
    return true
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Options</h3>

      {/* Format selector */}
      {!['convert', 'compare'].includes(operation) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Output Format</label>
          <div className="flex gap-2">
            {['xlsx', 'csv'].map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  format === f
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dedup mode */}
      {operation === 'dedup' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deduplicate By</label>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setDedupMode('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                dedupMode === 'all'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              All Columns
            </button>
            <button
              onClick={() => setDedupMode('selected')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                dedupMode === 'selected'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              Specific Columns
            </button>
          </div>
          {dedupMode === 'selected' && (
            <ColumnPicker columns={allColumns} selected={selectedColumns} onToggle={toggleColumn} />
          )}
        </div>
      )}

      {/* Filter columns */}
      {operation === 'filter' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Columns to Keep</label>
          <ColumnPicker columns={allColumns} selected={selectedColumns} onToggle={toggleColumn} />
        </div>
      )}

      {/* Compare key column */}
      {operation === 'compare' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Match By</label>
          <select
            value={keyColumn}
            onChange={(e) => setKeyColumn(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Row position (default)</option>
            {allColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit()}
        className={`
          w-full py-2.5 rounded-lg text-sm font-semibold transition-colors
          ${canSubmit()
            ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </span>
        ) : (
          'Run'
        )}
      </button>
    </div>
  )
}

function ColumnPicker({ columns, selected, onToggle }) {
  if (columns.length === 0) {
    return <p className="text-sm text-gray-400">No columns detected</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {columns.map(col => (
        <button
          key={col}
          onClick={() => onToggle(col)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            selected.includes(col)
              ? 'bg-blue-100 text-blue-700 border-blue-300'
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          {col}
        </button>
      ))}
    </div>
  )
}
