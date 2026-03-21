@echo off
:: Start the Spreadsheet Tools webapp
:: Access at http://localhost:8080

cd /d "%~dp0"

:: Build frontend if dist doesn't exist
if not exist "frontend\dist" (
    echo Building frontend...
    cd frontend
    call npm run build
    cd ..
)

:: Activate venv and start server
call venv\Scripts\activate
echo.
echo Spreadsheet Tools running at:
echo   http://localhost:8080
echo.
echo Press Ctrl+C to stop the server.
echo.
uvicorn backend.app:app --host 0.0.0.0 --port 8080
pause
