@echo off
echo Setting up shared PostgreSQL database for ECG Scanner...
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo PostgreSQL is not installed or not in PATH.
    echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo During installation, remember the password you set for the postgres user.
    pause
    exit /b 1
)

REM Start PostgreSQL service
net start postgresql-x64-15 >nul 2>nul
if %errorlevel% neq 0 (
    echo Starting PostgreSQL service...
    net start postgresql-x64-15
)

REM Create database
echo Creating shared database...
psql -U postgres -c "CREATE DATABASE ecg_shared_db;"
if %errorlevel% neq 0 (
    echo Database creation failed. Please check PostgreSQL credentials.
    pause
    exit /b 1
)

REM Install required Python packages
echo Installing Python dependencies...
pip install psycopg2-binary sqlalchemy

echo.
echo ✅ Shared database setup complete!
echo.
echo Next steps:
echo 1. Set environment variable: set DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/ecg_shared_db
echo 2. Run: python backend/app.py
echo.
pause
