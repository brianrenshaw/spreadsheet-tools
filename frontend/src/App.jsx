import { useEffect, useRef, useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import FileDropZone from './components/FileDropZone'
import OperationMenu from './components/OperationMenu'
import OperationForm from './components/OperationForm'
import ResultPanel from './components/ResultPanel'
import { TOOLS, fileRequirementError } from './lib/tools'

function App() {
  const [files, setFiles] = useState([])
  const [selectedOp, setSelectedOp] = useState(null)
  const [result, setResult] = useState(null)
  const [fileRevision, setFileRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const workspaceHeading = useRef(null)
  const menuHeading = useRef(null)
  const tool = TOOLS.find((item) => item.id === selectedOp)
  const fileError = fileRequirementError(tool, files.length)

  useEffect(() => {
    if (selectedOp) workspaceHeading.current?.focus()
  }, [selectedOp])

  const changeFiles = (next) => {
    setFiles(next)
    setFileRevision((revision) => revision + 1)
    setResult(null)
  }

  const selectTool = (id) => {
    if (busy) return
    setSelectedOp(id)
    setResult(null)
    if (id === selectedOp) workspaceHeading.current?.focus()
  }

  const reset = () => {
    if (busy) return
    changeFiles([])
    setSelectedOp(null)
    menuHeading.current?.focus()
  }

  return (
    <ErrorBoundary>
      <div className="tools-app">
        <a className="skip-link" href="#tools">Skip to tools</a>
        <header className="tools-nav">
          <a href="https://brianrenshaw.app/">← Brian’s homepage</a>
          <a href="https://github.com/brianrenshaw/spreadsheet-scripts">Get the scripts ↗</a>
        </header>
        <main className="tools-main">
          <div className="tools-intro">
            <p className="tools-eyebrow">SPREADSHEET TOOLS · BY BRIAN RENSHAW</p>
            <h1>Make everyday spreadsheet tasks easier.</h1>
            <p className="tools-lead">Combine files, remove duplicates, compare spreadsheets, and convert formats.</p>
            <p className="privacy-note">No installation or account needed. Your files stay in your browser.</p>
            <ol className="task-steps" aria-label="How it works">
              <li><span>1</span> Choose a tool</li>
              <li><span>2</span> Add your files</li>
              <li><span>3</span> Download the result</li>
            </ol>
          </div>

          <section id="tools" aria-labelledby="tools-title" tabIndex={-1}>
            <div className="section-heading">
              <h2 id="tools-title" ref={menuHeading} tabIndex={-1}>What do you need to do?</h2>
              <p>Choose a tool to get started.</p>
            </div>
            <OperationMenu selected={selectedOp} onSelect={selectTool} disabled={busy} />
          </section>

          <section id="task-workspace" className={`workspace ${tool ? '' : 'workspace-empty'}`} aria-labelledby="workspace-title" aria-busy={busy}>
            {tool ? (
              <>
                <div className="workspace-heading">
                  <div>
                    <p className="tools-eyebrow">YOUR SELECTED TOOL</p>
                    <h2 id="workspace-title" ref={workspaceHeading} tabIndex={-1}>{tool.name}</h2>
                  </div>
                  <button type="button" className="text-action" disabled={busy} onClick={() => menuHeading.current?.focus()}>Choose a different tool ↑</button>
                </div>
                <p className="workspace-hint">{tool.hint}</p>
                <div className="workspace-columns">
                  <section aria-labelledby="files-title">
                    <StepHeader id="files-title" number="2" title="Add your files" />
                    <p className="file-requirement">{tool.requirement} · CSV, XLSX, or XLS</p>
                    <FileDropZone files={files} setFiles={changeFiles} disabled={busy} onBusyChange={setBusy} />
                    <p className="file-note">Excel files use the first worksheet. Downloads contain data values, without the original workbook’s formatting.</p>
                  </section>
                  <section aria-labelledby="download-title">
                    <StepHeader id="download-title" number="3" title="Download the result" />
                    {fileError ? (
                      <p className="next-step" role="status">{fileError}</p>
                    ) : (
                      <OperationForm
                        key={`${selectedOp}-${fileRevision}`}
                        operation={selectedOp}
                        files={files}
                        onResult={setResult}
                        onBusyChange={setBusy}
                        busy={busy}
                      />
                    )}
                    {result && <div className="result"><ResultPanel result={result} operation={selectedOp} /></div>}
                  </section>
                </div>
                <div className="workspace-footer">
                  <p>Your original files stay unchanged.</p>
                  <button type="button" className="text-action" disabled={busy} onClick={reset}>Start over</button>
                </div>
              </>
            ) : (
              <><h2 id="workspace-title">Your next step starts with a tool.</h2><p>Choose one above, then add the files you want to work with.</p></>
            )}
          </section>
          <footer className="tools-footer">
            <span>Spreadsheet Tools · Brian Renshaw</span>
            <a href="mailto:contact@brianrenshaw.app">Contact</a>
            <a href="https://github.com/brianrenshaw/spreadsheet-tools">Source on GitHub ↗</a>
          </footer>
        </main>
      </div>
    </ErrorBoundary>
  )
}

function StepHeader({ id, number, title }) {
  return <h3 className="step-heading" id={id}><span>{number}</span>{title}</h3>
}

export default App
