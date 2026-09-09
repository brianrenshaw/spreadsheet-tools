// Shared task copy and requirements for the menu and selected workspace.
export const TOOLS = [
  {
    id: 'merge', name: 'Combine files',
    description: 'Bring rows from several spreadsheets together in one file.',
    action: 'Combine and download', requirement: '2 or more files', minFiles: 2,
    hint: 'Files are combined in the order listed below. Columns are matched by their headings.',
    icon: 'M4 4h10v6H4zM10 14h10v6H10zM7 10v7h3M17 4v6m-3-3 3 3 3-3',
  },
  {
    id: 'convert', name: 'Convert CSV or Excel',
    description: 'Turn a CSV into an Excel file, or an Excel file into a CSV.',
    action: 'Convert and download', requirement: '1 or more files', minFiles: 1,
    hint: 'CSV files become XLSX. Excel files become CSV. Each file gets its own download.',
    icon: 'M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4',
  },
  {
    id: 'dedup', name: 'Remove duplicate rows',
    description: 'Keep one copy of each row, using all columns or the ones you choose.',
    action: 'Remove duplicates and download', requirement: '1 or more files', minFiles: 1,
    hint: 'The first matching row is kept. Each file is processed separately.',
    icon: 'M8 3h12v14H8zM4 7v14h12M11 10h6',
  },
  {
    id: 'filter', name: 'Keep selected columns',
    description: 'Make a smaller file with just the columns you need.',
    action: 'Keep columns and download', requirement: '1 file', minFiles: 1, maxFiles: 1,
    hint: 'Choose the columns to keep after adding your file. The others are left out of the download.',
    icon: 'M3 4h18v16H3zM9 4v16M15 4v16M3 9h18',
  },
  {
    id: 'compare', name: 'Compare two files',
    description: 'See added, removed, and changed rows in a color-coded Excel file.',
    action: 'Compare and download', requirement: '2 files', minFiles: 2, maxFiles: 2,
    hint: 'Add the older file first, then the newer file. Match rows by position or by a column with a unique value for each row.',
    icon: 'M3 3h7v18H3zM14 3h7v18h-7zM5 8h3M16 8h3M5 13h3M16 17h3',
  },
  {
    id: 'trim', name: 'Clean up spaces and blanks',
    description: 'Remove extra spaces at the edges of text and clear values like N/A.',
    action: 'Clean up and download', requirement: '1 or more files', minFiles: 1,
    hint: 'Spaces at the start and end of text are removed. Values such as NA, N/A, null, none, nil, and dashes become empty cells.',
    icon: 'M4 5h16M7 10h10M7 15h10M4 20h16M3 9v7M21 9v7',
  },
  {
    id: 'remove-empty', name: 'Remove empty rows and columns',
    description: 'Clear out rows and columns that contain no data.',
    action: 'Remove empty rows and columns', requirement: '1 or more files', minFiles: 1,
    hint: 'Only entirely blank rows and columns are removed. Blank cells within other rows stay in place.',
    icon: 'M3 4h18v16H3zM3 9h18M3 15h18M9 4v16M15 4v16',
  },
]

export function fileRequirementError(tool, count) {
  if (!tool) return 'Choose a tool to get started.'
  if (count < tool.minFiles) {
    const missing = tool.minFiles - count
    return `Add ${missing}${count ? ' more' : ''} file${missing === 1 ? '' : 's'} to continue.`
  }
  if (tool.maxFiles && count > tool.maxFiles) {
    return `This tool uses ${tool.maxFiles} file${tool.maxFiles === 1 ? '' : 's'}. Remove the extra files to continue.`
  }
  return null
}
