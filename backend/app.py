"""FastAPI application for spreadsheet processing."""

import os
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.config import ALLOWED_EXTENSIONS, CLEANUP_AGE, RESULTS_DIR, UPLOAD_DIR
from backend import operations

# In-memory file registry: file_id -> {path, original_name, columns}
file_registry: dict[str, dict] = {}


# --- Pydantic request models ---

class MergeRequest(BaseModel):
    file_ids: list[str]
    format: str = "xlsx"

class ConvertRequest(BaseModel):
    file_ids: list[str]

class DedupRequest(BaseModel):
    file_ids: list[str]
    format: str = "xlsx"
    columns: list[str] | None = None

class FilterRequest(BaseModel):
    file_ids: list[str]
    format: str = "xlsx"
    columns: list[str]

class CompareRequest(BaseModel):
    file_ids: list[str]
    key: str | None = None

class TrimRequest(BaseModel):
    file_ids: list[str]
    format: str = "xlsx"

class RemoveEmptyRequest(BaseModel):
    file_ids: list[str]
    format: str = "xlsx"


# --- Helpers ---

def cleanup_old_files():
    """Delete uploaded/result files older than CLEANUP_AGE."""
    now = time.time()
    for directory in [UPLOAD_DIR, RESULTS_DIR]:
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            if os.path.isfile(filepath) and now - os.path.getmtime(filepath) > CLEANUP_AGE:
                os.remove(filepath)
    stale = [fid for fid, info in file_registry.items() if not os.path.exists(info["path"])]
    for fid in stale:
        del file_registry[fid]


def _get_paths(file_ids: list[str]) -> list[str]:
    """Resolve file IDs to filesystem paths."""
    paths = []
    for fid in file_ids:
        if fid not in file_registry:
            raise HTTPException(404, f"File not found: {fid}")
        paths.append(file_registry[fid]["path"])
    return paths


def _register_result(output_path: str, output_filename: str) -> str:
    """Register a result file and return its file_id."""
    result_id = uuid.uuid4().hex
    file_registry[result_id] = {
        "path": output_path,
        "original_name": output_filename,
        "columns": [],
    }
    return result_id


# --- App ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    cleanup_old_files()
    yield


app = FastAPI(title="Spreadsheet Tools", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Endpoints ---

@app.post("/api/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    """Upload one or more spreadsheet files. Returns file IDs and column names."""
    uploaded = []
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(400, f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

        file_id = uuid.uuid4().hex
        save_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")

        content = await file.read()
        with open(save_path, "wb") as f:
            f.write(content)

        try:
            columns = operations.get_columns(save_path)
        except Exception:
            columns = []

        file_registry[file_id] = {
            "path": save_path,
            "original_name": file.filename,
            "columns": columns,
        }
        uploaded.append({
            "file_id": file_id,
            "filename": file.filename,
            "columns": columns,
        })

    return {"files": uploaded}


@app.get("/api/columns/{file_id}")
async def get_columns(file_id: str):
    """Get column names for a previously uploaded file."""
    if file_id not in file_registry:
        raise HTTPException(404, "File not found")
    return {"columns": file_registry[file_id]["columns"]}


@app.post("/api/operations/merge")
async def op_merge(req: MergeRequest):
    if len(req.file_ids) < 2:
        raise HTTPException(400, "At least 2 files are required.")
    paths = _get_paths(req.file_ids)
    try:
        result = operations.merge(paths, fmt=req.format)
    except Exception as e:
        raise HTTPException(400, str(e))
    result["result_id"] = _register_result(result["output_path"], result["output_filename"])
    return result


@app.post("/api/operations/convert")
async def op_convert(req: ConvertRequest):
    paths = _get_paths(req.file_ids)
    try:
        result = operations.convert(paths)
    except Exception as e:
        raise HTTPException(400, str(e))
    result["result_id"] = _register_result(result["output_path"], result["output_filename"])
    return result


@app.post("/api/operations/dedup")
async def op_dedup(req: DedupRequest):
    paths = _get_paths(req.file_ids)
    try:
        result = operations.deduplicate(paths, columns=req.columns, fmt=req.format)
    except Exception as e:
        raise HTTPException(400, str(e))
    result["result_id"] = _register_result(result["output_path"], result["output_filename"])
    return result


@app.post("/api/operations/filter")
async def op_filter(req: FilterRequest):
    paths = _get_paths(req.file_ids)
    if len(paths) != 1:
        raise HTTPException(400, "Exactly 1 file is required for filtering.")
    try:
        result = operations.filter_columns(paths[0], columns=req.columns, fmt=req.format)
    except Exception as e:
        raise HTTPException(400, str(e))
    result["result_id"] = _register_result(result["output_path"], result["output_filename"])
    return result


@app.post("/api/operations/compare")
async def op_compare(req: CompareRequest):
    if len(req.file_ids) != 2:
        raise HTTPException(400, "Exactly 2 files are required.")
    paths = _get_paths(req.file_ids)
    try:
        result = operations.compare(paths, key=req.key)
    except Exception as e:
        raise HTTPException(400, str(e))
    result["result_id"] = _register_result(result["output_path"], result["output_filename"])
    return result


@app.post("/api/operations/trim")
async def op_trim(req: TrimRequest):
    paths = _get_paths(req.file_ids)
    try:
        result = operations.trim_clean(paths, fmt=req.format)
    except Exception as e:
        raise HTTPException(400, str(e))
    result["result_id"] = _register_result(result["output_path"], result["output_filename"])
    return result


@app.post("/api/operations/remove-empty")
async def op_remove_empty(req: RemoveEmptyRequest):
    paths = _get_paths(req.file_ids)
    try:
        result = operations.remove_empty(paths, fmt=req.format)
    except Exception as e:
        raise HTTPException(400, str(e))
    result["result_id"] = _register_result(result["output_path"], result["output_filename"])
    return result


@app.get("/api/download/{file_id}")
async def download_file(file_id: str):
    """Download a result file."""
    if file_id not in file_registry:
        raise HTTPException(404, "File not found")
    info = file_registry[file_id]
    if not os.path.exists(info["path"]):
        raise HTTPException(404, "File has expired")
    return FileResponse(
        info["path"],
        filename=info["original_name"],
        media_type="application/octet-stream",
    )


# Serve frontend static files (production)
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
