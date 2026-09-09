import { useState } from 'react'
import { readColumns } from '../lib/spreadsheet'

export default function FileDropZone({ files, setFiles }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragging(false)
    setError(null)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length === 0) return
    await addFiles(droppedFiles)
  }

  const handleFileInput = async (e) => {
    const selected = Array.from(e.target.files)
    if (selected.length === 0) return
    setError(null)
    await addFiles(selected)
    e.target.value = ''
  }

  const addFiles = async (fileList) => {
    setLoading(true)
    try {
      const newFiles = []
      for (const file of fileList) {
        const ext = file.name.split('.').pop().toLowerCase()
        if (!['csv', 'xlsx', 'xls'].includes(ext)) {
          throw new Error(`Unsupported file type: .${ext}`)
        }
        const columns = await readColumns(file)
        newFiles.push({ file, name: file.name, columns })
      }
      setFiles(prev => [...prev, ...newFiles])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Choose spreadsheet files"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('file-input').click() } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          file-drop border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
          ${dragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
        `}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="text-gray-500">
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Reading files...</span>
            </div>
          ) : (
            <>
              <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium">Drop spreadsheet files here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">CSV, XLSX, XLS &mdash; files never leave your browser</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-3 min-w-0">
                <svg className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{f.columns.length} columns</p>
                </div>
              </div>
              <button
                aria-label={`Remove ${f.name}`}
                onClick={() => removeFile(i)}
                className="text-gray-400 hover:text-red-500 transition-colors ml-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
