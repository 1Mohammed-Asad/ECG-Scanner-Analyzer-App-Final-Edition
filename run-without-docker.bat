@echo off
echo Starting ECG Scanner with shared database (no Docker required)...
echo.

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo DATABASE_URL environment variable is not set.
    echo Setting default database connection...
    set DATABASE_URL=postgresql://postgres:password@localhost:5432/ecg_shared_db
)

REM Check if PostgreSQL is running
netstat -an | findstr :5432 >nul
if %errorlevel% neq 0 (
    echo PostgreSQL is not running on port 5432
    echo Please start PostgreSQL service or run setup-shared-server.bat first
    pause
    exit /b 1
)

REM Install PostgreSQL adapter if not present
python -c "import psycopg2" >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing PostgreSQL adapter...
    pip install psycopg2-binary
)

REM Start the backend
echo Starting backend server...
python backend/app.py

pause
