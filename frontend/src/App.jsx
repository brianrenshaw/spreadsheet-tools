import { useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import FileDropZone from './components/FileDropZone'
import OperationMenu from './components/OperationMenu'
import OperationForm from './components/OperationForm'
import ResultPanel from './components/ResultPanel'

const TOOL_DESCRIPTIONS = [
  { name: 'Merge', desc: 'Combine multiple files into one. Keeps the header from the first file and appends all rows from the rest.' },
  { name: 'Convert Format', desc: 'Switch between CSV and XLSX. CSV files become XLSX, Excel files become CSV.' },
  { name: 'Deduplicate', desc: 'Remove duplicate rows. Deduplicate by all columns, or choose specific columns as a composite key.' },
  { name: 'Filter Columns', desc: 'Keep only the columns you need. Pick from a list of detected column names.' },
  { name: 'Compare', desc: 'See what changed between two files. Produces a color-coded diff: green (added), red (removed), yellow (changed).' },
  { name: 'Trim & Clean', desc: 'Strip whitespace from cells and headers. Normalizes placeholders like NA, N/A, null, and none to empty cells.' },
  { name: 'Remove Empty', desc: 'Drop rows and columns that are entirely blank. Great for cleaning up messy exports.' },
]

function App() {
  const [files, setFiles] = useState([])
  const [selectedOp, setSelectedOp] = useState(null)
  const [result, setResult] = useState(null)
  const [showGuide, setShowGuide] = useState(false)

  const handleResult = (data) => {
    setResult(data)
  }

  const handleReset = () => {
    setFiles([])
    setSelectedOp(null)
    setResult(null)
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Spreadsheet Tools</h1>
          <p className="text-gray-600 text-sm mt-1">
            Upload spreadsheet files and pick an operation. Supports CSV, XLSX, and XLS.
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <svg className="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xs text-green-700">
              Your files stay on your computer. Everything is processed right here in your browser — nothing is uploaded to a server.
            </p>
          </div>

          {/* Guide toggle */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
          >
            <svg className={`h-4 w-4 transition-transform ${showGuide ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showGuide ? 'Hide' : 'What can this do?'}
          </button>

          {showGuide && (
            <div className="mt-3 bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              {TOOL_DESCRIPTIONS.map((tool) => (
                <div key={tool.name}>
                  <p className="text-sm font-semibold text-gray-900">{tool.name}</p>
                  <p className="text-sm text-gray-500">{tool.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Step 1: Upload files */}
          <section>
            <StepHeader number="1" title="Upload Files" />
            <FileDropZone files={files} setFiles={setFiles} />
          </section>

          {/* Step 2: Choose operation */}
          {files.length > 0 && (
            <section>
              <StepHeader number="2" title="Choose Operation" />
              <OperationMenu
                selected={selectedOp}
                onSelect={(op) => { setSelectedOp(op); setResult(null) }}
                fileCount={files.length}
              />
            </section>
          )}

          {/* Step 3: Configure & run */}
          {selectedOp && (
            <section>
              <StepHeader number="3" title="Configure & Run" />
              <OperationForm
                operation={selectedOp}
                files={files}
                onResult={handleResult}
              />
            </section>
          )}

          {/* Result */}
          {result && (
            <section>
              <ResultPanel result={result} operation={selectedOp} />
            </section>
          )}

          {/* Reset */}
          {files.length > 0 && (
            <div className="text-center pt-2">
              <button
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Start over
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            Built by Brian Renshaw with{' '}
            <a href="https://claude.ai/claude-code" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700 underline">
              Claude Code
            </a>
          </p>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  )
}

function StepHeader({ number, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold">
        {number}
      </span>
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
    </div>
  )
}

export default App
