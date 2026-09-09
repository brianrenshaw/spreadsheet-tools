export default function ResultPanel({ result, operation }) {
  if (!result) return null

  return (
    <div role="status" className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h3 className="font-semibold text-green-800">Your result is ready.</h3>
      </div>

      <p className="text-sm text-green-700">Your download starts automatically.</p>
      <div className="text-sm text-green-700 space-y-1">
        <ResultSummary result={result} operation={operation} />
      </div>
    </div>
  )
}

function ResultSummary({ result, operation }) {
  switch (operation) {
    case 'merge':
      return (
        <>
          <p>Merged {result.files_merged} files into {result.rows} rows, {result.columns} columns</p>
          {result.warnings?.map((w, i) => (
            <p key={i} className="text-yellow-700">Warning: {w}</p>
          ))}
        </>
      )

    case 'convert':
      return result.results?.map((r, i) => (
        <p key={i}>{r.original} converted to {r.converted_to.toUpperCase()} ({r.rows} rows)</p>
      ))

    case 'dedup':
      return result.results?.map((r, i) => (
        <p key={i}>
          {r.original}: {r.original_rows} rows &rarr; {r.final_rows} rows ({r.duplicates_removed} duplicates removed)
        </p>
      ))

    case 'filter':
      return (
        <>
          <p>Kept {result.columns_kept?.length} columns, {result.rows} rows</p>
          {result.columns_missing?.length > 0 && (
            <p className="text-yellow-700">Missing columns skipped: {result.columns_missing.join(', ')}</p>
          )}
        </>
      )

    case 'compare':
      return (
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-300"></span>
            {result.added} added
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-300"></span>
            {result.removed} removed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-yellow-300"></span>
            {result.changed} changed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-gray-200"></span>
            {result.unchanged} unchanged
          </span>
        </div>
      )

    case 'trim':
      return result.results?.map((r, i) => (
        <p key={i}>{r.original}: {r.cells_trimmed} trimmed, {r.cells_normalized} normalized to empty</p>
      ))

    case 'remove-empty':
      return result.results?.map((r, i) => (
        <p key={i}>
          {r.original}: {r.rows_removed} empty rows removed, {r.cols_removed} empty columns removed
          (final: {r.final_rows} &times; {r.final_cols})
        </p>
      ))

    default:
      return <p>Operation complete</p>
  }
}
