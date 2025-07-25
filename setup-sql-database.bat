@echo off
echo Setting up SQL database for ECG Scanner...
echo.

REM Create shared data directory
if not exist "shared_sql_data" mkdir shared_sql_data

REM Install required packages
echo Installing required packages...
pip install sqlite3

REM Create database
echo Creating SQL database...
python setup_sql_database.py

echo.
echo ✅ SQL database setup complete!
echo.
echo Database location: shared_sql_data/ecg_shared.db
echo.
echo Next steps:
echo 1. Share the 'shared_sql_data' folder on your network
echo 2. On other devices, set: set SHARED_DB_PATH=\\YOUR_PC_NAME\shared_sql_data\ecg_shared.db
echo 3. Run: python backend/app_sql.py
echo.
pause
