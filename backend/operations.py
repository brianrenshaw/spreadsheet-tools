"""Wrapper functions for each spreadsheet operation.

Imports read_file/write_file from the spreadsheet-scripts src/ directory
and provides clean function interfaces for the API layer.
"""

import os
import sys
import uuid
from datetime import datetime

import pandas as pd
from openpyxl import load_workbook
from openpyxl.styles import PatternFill

from backend.config import SCRIPTS_PATH, RESULTS_DIR

# Add scripts src/ to path so we can import utils
if SCRIPTS_PATH not in sys.path:
    sys.path.insert(0, SCRIPTS_PATH)

from utils import read_file, write_file  # noqa: E402


# Color fills for compare operation
FILL_ADDED = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")
FILL_REMOVED = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")
FILL_CHANGED = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")

# Placeholder values treated as empty by trim/clean
EMPTY_VALUES = {"na", "n/a", "null", "none", "nil", "-", "--"}


def _result_path(prefix: str, fmt: str) -> str:
    """Generate a unique result file path."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_id = uuid.uuid4().hex[:8]
    filename = f"{prefix}_{timestamp}_{file_id}.{fmt}"
    return os.path.join(RESULTS_DIR, filename)


def get_columns(file_path: str) -> list[str]:
    """Read a file and return its column names."""
    df = read_file(file_path)
    return list(df.columns)


def merge(file_paths: list[str], fmt: str = "xlsx") -> dict:
    """Merge multiple files into one."""
    frames = []
    reference_cols = None
    warnings = []

    for path in file_paths:
        filename = os.path.basename(path)
        df = read_file(path)

        if reference_cols is None:
            reference_cols = list(df.columns)
        else:
            extra = set(df.columns) - set(reference_cols)
            missing = set(reference_cols) - set(df.columns)
            if extra:
                warnings.append(f"{filename}: extra columns: {', '.join(sorted(extra))}")
            if missing:
                warnings.append(f"{filename}: missing columns: {', '.join(sorted(missing))}")

        frames.append(df)

    if not frames:
        raise ValueError("No files could be read.")

    merged = pd.concat(frames, ignore_index=True)

    # Reorder columns: reference first, then extras
    all_cols = list(merged.columns)
    ordered = [c for c in reference_cols if c in all_cols]
    ordered += [c for c in all_cols if c not in ordered]
    merged = merged[ordered]

    out = _result_path("merged", fmt)
    write_file(merged, out, fmt)

    return {
        "output_path": out,
        "output_filename": os.path.basename(out),
        "rows": len(merged),
        "columns": len(merged.columns),
        "files_merged": len(frames),
        "warnings": warnings,
    }


def convert(file_paths: list[str]) -> dict:
    """Convert files between CSV and XLSX."""
    results = []
    for path in file_paths:
        df = read_file(path)
        ext = os.path.splitext(path)[1].lower()
        original_name = os.path.splitext(os.path.basename(path))[0]

        if ext == ".csv":
            target_fmt = "xlsx"
        else:
            target_fmt = "csv"

        out = _result_path(f"{original_name}_converted", target_fmt)
        write_file(df, out, target_fmt)
        results.append({
            "original": os.path.basename(path),
            "converted_to": target_fmt,
            "rows": len(df),
        })

    # For single file, return the path directly
    if len(results) == 1:
        out_path = _result_path(
            f"{os.path.splitext(os.path.basename(file_paths[0]))[0]}_converted",
            "xlsx" if os.path.splitext(file_paths[0])[1].lower() == ".csv" else "csv",
        )
        # Already written above, get the actual path
        pass

    return {
        "output_path": out,
        "output_filename": os.path.basename(out),
        "results": results,
    }


def deduplicate(file_paths: list[str], columns: list[str] | None = None, fmt: str = "xlsx") -> dict:
    """Remove duplicate rows from files."""
    results = []
    last_out = None

    for path in file_paths:
        df = read_file(path)
        original_count = len(df)
        subset = columns if columns else None
        df = df.drop_duplicates(subset=subset, keep="first")
        removed = original_count - len(df)

        original_name = os.path.splitext(os.path.basename(path))[0]
        out = _result_path(f"{original_name}_deduped", fmt)
        write_file(df, out, fmt)
        last_out = out

        results.append({
            "original": os.path.basename(path),
            "original_rows": original_count,
            "final_rows": len(df),
            "duplicates_removed": removed,
        })

    return {
        "output_path": last_out,
        "output_filename": os.path.basename(last_out),
        "results": results,
    }


def filter_columns(file_path: str, columns: list[str], fmt: str = "xlsx") -> dict:
    """Extract specific columns from a file."""
    df = read_file(file_path)

    missing = [c for c in columns if c not in df.columns]
    keep = [c for c in columns if c in df.columns]

    if not keep:
        raise ValueError("None of the specified columns exist in the file.")

    df = df[keep]
    original_name = os.path.splitext(os.path.basename(file_path))[0]
    out = _result_path(f"{original_name}_filtered", fmt)
    write_file(df, out, fmt)

    return {
        "output_path": out,
        "output_filename": os.path.basename(out),
        "rows": len(df),
        "columns_kept": keep,
        "columns_missing": missing,
    }


def compare(file_paths: list[str], key: str | None = None) -> dict:
    """Compare two files and produce a color-coded diff. Always outputs XLSX."""
    if len(file_paths) != 2:
        raise ValueError("Exactly 2 files are required for comparison.")

    df1 = read_file(file_paths[0])
    df2 = read_file(file_paths[1])

    if key:
        if key not in df1.columns:
            raise ValueError(f"Key column '{key}' not found in first file.")
        if key not in df2.columns:
            raise ValueError(f"Key column '{key}' not found in second file.")
        df1 = df1.set_index(key)
        df2 = df2.set_index(key)

    # Align columns
    all_cols = list(dict.fromkeys(list(df1.columns) + list(df2.columns)))
    df1 = df1.reindex(columns=all_cols)
    df2 = df2.reindex(columns=all_cols)

    keys1 = set(df1.index)
    keys2 = set(df2.index)

    added_keys = keys2 - keys1
    removed_keys = keys1 - keys2
    common_keys = keys1 & keys2

    changed_keys = set()
    for k in common_keys:
        row1 = df1.loc[k]
        row2 = df2.loc[k]
        if isinstance(row1, pd.DataFrame):
            row1 = row1.iloc[0]
        if isinstance(row2, pd.DataFrame):
            row2 = row2.iloc[0]
        if not row1.fillna("").equals(row2.fillna("")):
            changed_keys.add(k)

    unchanged_keys = common_keys - changed_keys

    # Build output
    rows = []
    row_types = []

    for k in sorted(removed_keys, key=str):
        row = df1.loc[k]
        if isinstance(row, pd.DataFrame):
            row = row.iloc[0]
        rows.append(row)
        row_types.append("removed")

    for k in sorted(changed_keys, key=str):
        row = df2.loc[k]
        if isinstance(row, pd.DataFrame):
            row = row.iloc[0]
        rows.append(row)
        row_types.append("changed")

    for k in sorted(added_keys, key=str):
        row = df2.loc[k]
        if isinstance(row, pd.DataFrame):
            row = row.iloc[0]
        rows.append(row)
        row_types.append("added")

    for k in sorted(unchanged_keys, key=str):
        row = df2.loc[k]
        if isinstance(row, pd.DataFrame):
            row = row.iloc[0]
        rows.append(row)
        row_types.append("unchanged")

    if not rows:
        raise ValueError("Both files are empty.")

    result = pd.DataFrame(rows)
    result.insert(0, "_Status", row_types)
    if key:
        result.index.name = key
        result = result.reset_index()

    out = _result_path("comparison", "xlsx")
    result.to_excel(out, index=False, engine="openpyxl")

    # Apply color fills
    wb = load_workbook(out)
    ws = wb.active
    for row_idx in range(2, ws.max_row + 1):
        status = ws.cell(row=row_idx, column=1).value
        fill = None
        if status == "added":
            fill = FILL_ADDED
        elif status == "removed":
            fill = FILL_REMOVED
        elif status == "changed":
            fill = FILL_CHANGED
        if fill:
            for col_idx in range(1, ws.max_column + 1):
                ws.cell(row=row_idx, column=col_idx).fill = fill
    wb.save(out)

    return {
        "output_path": out,
        "output_filename": os.path.basename(out),
        "added": len(added_keys),
        "removed": len(removed_keys),
        "changed": len(changed_keys),
        "unchanged": len(unchanged_keys),
    }


def trim_clean(file_paths: list[str], fmt: str = "xlsx") -> dict:
    """Strip whitespace and normalize empty cells."""
    results = []
    last_out = None

    for path in file_paths:
        df = read_file(path)

        trimmed = 0
        normalized = 0

        # Clean column headers
        df.columns = [col.strip() if isinstance(col, str) else col for col in df.columns]

        # Process each cell
        for col in df.columns:
            for idx in df.index:
                val = df.at[idx, col]
                if not isinstance(val, str):
                    continue
                stripped = val.strip()
                if stripped != val:
                    trimmed += 1
                if stripped.lower() in EMPTY_VALUES or stripped == "":
                    df.at[idx, col] = pd.NA
                    normalized += 1
                elif stripped != val:
                    df.at[idx, col] = stripped

        original_name = os.path.splitext(os.path.basename(path))[0]
        out = _result_path(f"{original_name}_cleaned", fmt)
        write_file(df, out, fmt)
        last_out = out

        results.append({
            "original": os.path.basename(path),
            "cells_trimmed": trimmed,
            "cells_normalized": normalized,
        })

    return {
        "output_path": last_out,
        "output_filename": os.path.basename(last_out),
        "results": results,
    }


def remove_empty(file_paths: list[str], fmt: str = "xlsx") -> dict:
    """Remove entirely empty rows and columns."""
    results = []
    last_out = None

    for path in file_paths:
        df = read_file(path)
        orig_rows, orig_cols = df.shape

        # Remove empty rows
        df = df.dropna(how="all")
        df = df[~df.apply(lambda row: all(str(v).strip() == "" for v in row), axis=1)]

        # Remove empty columns
        df = df.dropna(axis=1, how="all")
        df = df.loc[:, ~df.apply(lambda col: all(str(v).strip() == "" for v in col), axis=0)]

        rows_removed = orig_rows - len(df)
        cols_removed = orig_cols - len(df.columns)

        original_name = os.path.splitext(os.path.basename(path))[0]
        out = _result_path(f"{original_name}_stripped", fmt)
        write_file(df, out, fmt)
        last_out = out

        results.append({
            "original": os.path.basename(path),
            "rows_removed": rows_removed,
            "cols_removed": cols_removed,
            "final_rows": len(df),
            "final_cols": len(df.columns),
        })

    return {
        "output_path": last_out,
        "output_filename": os.path.basename(last_out),
        "results": results,
    }
