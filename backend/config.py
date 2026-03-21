"""Configuration for the spreadsheet webapp."""

import os

# Path to the spreadsheet-scripts src/ directory
SCRIPTS_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "spreadsheet-scripts", "src"
)
SCRIPTS_PATH = os.path.abspath(SCRIPTS_PATH)

# Temp directories
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
RESULTS_DIR = os.path.join(BASE_DIR, "results")

# Ensure dirs exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# Max file size: 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024

# Allowed extensions
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}

# File cleanup: delete files older than this (seconds)
CLEANUP_AGE = 3600  # 1 hour
