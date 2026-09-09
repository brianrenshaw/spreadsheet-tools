const OPERATIONS = [
  {
    id: 'merge',
    name: 'Merge',
    description: 'Combine multiple files into one',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    ),
    minFiles: 2,
    maxFiles: null,
    color: 'blue',
  },
  {
    id: 'convert',
    name: 'Convert Format',
    description: 'CSV to XLSX or XLSX to CSV',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    ),
    minFiles: 1,
    maxFiles: null,
    color: 'purple',
  },
  {
    id: 'dedup',
    name: 'Deduplicate',
    description: 'Remove duplicate rows',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    ),
    minFiles: 1,
    maxFiles: null,
    color: 'orange',
  },
  {
    id: 'filter',
    name: 'Filter Columns',
    description: 'Keep only selected columns',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    ),
    minFiles: 1,
    maxFiles: 1,
    color: 'green',
  },
  {
    id: 'compare',
    name: 'Compare',
    description: 'Color-coded diff of two files',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    ),
    minFiles: 2,
    maxFiles: 2,
    color: 'yellow',
  },
  {
    id: 'trim',
    name: 'Trim & Clean',
    description: 'Strip whitespace, normalize blanks',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    ),
    minFiles: 1,
    maxFiles: null,
    color: 'teal',
  },
  {
    id: 'remove-empty',
    name: 'Remove Empty',
    description: 'Drop blank rows and columns',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    ),
    minFiles: 1,
    maxFiles: null,
    color: 'red',
  },
]

export default function OperationMenu({ selected, onSelect, fileCount }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {OPERATIONS.map((op) => {
        const isActive = selected === op.id
        const isDisabled = fileCount < op.minFiles || (op.maxFiles && fileCount > op.maxFiles)
        const colorClasses = isActive ? 'tool-choice-active' : 'tool-choice'

        return (
          <button
            key={op.id}
            aria-pressed={isActive}
            onClick={() => onSelect(isActive ? null : op.id)}
            disabled={isDisabled}
            className={`
              tool-choice border rounded-xl p-4 text-left transition-colors
              ${isDisabled
                ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200'
                : colorClasses + ' cursor-pointer'
              }
            `}
          >
            <svg className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {op.icon}
            </svg>
            <p className="text-sm font-semibold">{op.name}</p>
            <p className="text-xs opacity-70 mt-0.5">{op.description}</p>
            {isDisabled && fileCount > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {op.minFiles > fileCount
                  ? `Needs ${op.minFiles}+ files`
                  : `Max ${op.maxFiles} file${op.maxFiles > 1 ? 's' : ''}`
                }
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}

export { OPERATIONS }
