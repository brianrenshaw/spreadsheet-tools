import { useRef, useState } from 'react'
import { readColumns } from '../lib/spreadsheet'

export default function FileDropZone({ files, setFiles, disabled, onBusyChange }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const input = useRef(null)
  const reading = useRef(false)

  const addFiles = async (fileList) => {
    if (disabled || reading.current || !fileList.length) return
    reading.current = true
    setError(null)
    setLoading(true)
    onBusyChange(true)
    try {
      const added = []
      for (const file of fileList) {
        const ext = file.name.split('.').pop().toLowerCase()
        if (!['csv', 'xlsx', 'xls'].includes(ext)) throw new Error('Choose a CSV or Excel file (.csv, .xlsx, or .xls).')
        const columns = await readColumns(file)
        if (!columns.length) throw new Error(`${file.name} has no readable data rows. Choose a file with column headings and data.`)
        added.push({ file, name: file.name, columns })
      }
      setFiles((previous) => [...previous, ...added])
    } catch (err) {
      setError(err.message)
    } finally {
      reading.current = false
      setLoading(false)
      onBusyChange(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="file-picker">
      <div
        className={`file-drop ${dragging ? 'file-drop-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void addFiles(Array.from(e.dataTransfer.files)) }}
      >
        <input ref={input} id="file-input" type="file" multiple accept=".csv,.xlsx,.xls" disabled={disabled} onChange={(e) => void addFiles(Array.from(e.target.files))} hidden />
        <svg aria-hidden="true" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M12 18v-6m-3 3 3-3 3 3" /></svg>
        <p>{loading ? 'Reading your files…' : 'Drop your files here'}</p>
        <button type="button" className="browse-files" disabled={disabled} onClick={() => input.current?.click()}>{loading ? 'Reading files…' : files.length ? 'Add more files' : 'Choose files'}</button>
        <span className="file-note">Files are processed on your device.</span>
      </div>
      {error && <p role="alert" className="file-error">{error}</p>}
      {files.length > 0 && (
        <ol className="file-list" aria-label="Selected files">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`}>
              <span className="file-index" aria-hidden="true">{index + 1}</span>
              <div className="file-details"><p>{file.name}</p><small>{file.columns.length} columns</small></div>
              <button type="button" className="remove-file" disabled={disabled} aria-label={`Remove ${file.name}`} onClick={() => { setFiles((previous) => previous.filter((_, i) => i !== index)); setError(null) }}>×</button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
