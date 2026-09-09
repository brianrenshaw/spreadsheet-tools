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
    <div className="tools-app min-h-screen bg-gray-50">
      <a className="skip-link" href="#workspace">Skip to tools</a><header className="tools-nav"><a href="https://brianrenshaw.app/">← Brian’s homepage</a><a href="https://github.com/brianrenshaw/spreadsheet-scripts">Get the scripts ↗</a></header><main className="tools-main">
        {/* Header */}
        <div className="tools-intro">
          <p className="tools-eyebrow">SPREADSHEET TOOLS · BY BRIAN RENSHAW</p><h1>A little less<br />spreadsheet busywork.</h1>
          <p className="tools-lead">
            Merge, tidy, compare, and convert. Small tools for getting your files into shape.
          </p>
          <div className="privacy-note">
            <svg className="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm">
              Your files stay yours. All processing happens in your browser. No accounts or uploads.
            </p>
          </div>

          {/* Guide toggle */}
          <button
            aria-expanded={showGuide}
            aria-controls="tool-guide"
            onClick={() => setShowGuide(!showGuide)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
          >
            <svg className={`h-4 w-4 transition-transform ${showGuide ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showGuide ? 'Hide' : 'What can this do?'}
          </button>

          {showGuide && (
            <div id="tool-guide" className="mt-3 bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              {TOOL_DESCRIPTIONS.map((tool) => (
                <div key={tool.name}>
                  <p className="text-sm font-semibold text-gray-900">{tool.name}</p>
                  <p className="text-sm text-gray-500">{tool.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="workspace space-y-6" id="workspace" tabIndex={-1}>
          {/* Step 1: Upload files */}
          <section>
            <StepHeader number="1" title="Choose your files" />
            <FileDropZone files={files} setFiles={(next) => { setFiles(next); setSelectedOp(null); setResult(null) }} />
          </section>

          {/* Step 2: Choose operation */}
          {files.length > 0 && (
            <section>
              <StepHeader number="2" title="Choose a tool" />
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
              <StepHeader number="3" title="Make it yours" />
              <OperationForm
                key={selectedOp}
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

        <footer className="tools-footer"><span>Spreadsheet Tools · Brian Renshaw</span><a href="mailto:contact@brianrenshaw.app">Contact</a><a href="https://github.com/brianrenshaw/spreadsheet-tools">Source on GitHub ↗</a></footer>
      </main>
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
