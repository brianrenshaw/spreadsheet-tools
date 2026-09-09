import { TOOLS } from '../lib/tools'

export default function OperationMenu({ selected, onSelect, disabled }) {
  return (
    <div className="tool-grid">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          aria-pressed={selected === tool.id}
          aria-controls="task-workspace"
          disabled={disabled}
          onClick={() => onSelect(tool.id)}
          className={`tool-choice ${selected === tool.id ? 'tool-choice-active' : ''}`}
        >
          <span className="tool-topline">
            <svg aria-hidden="true" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={tool.icon} />
            </svg>
            <span className="tool-requirement">{tool.requirement}</span>
          </span>
          <span className="tool-name">{tool.name}</span>
          <span className="tool-description">{tool.description}</span>
          <span className="tool-select" aria-hidden="true">{selected === tool.id ? 'Selected ✓' : 'Choose tool →'}</span>
        </button>
      ))}
    </div>
  )
}
