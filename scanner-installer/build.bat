@echo off
echo Building DiscoverIT Scanner Installer...
echo ========================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.9+ and try again
    pause
    exit /b 1
)

REM Install build dependencies
echo Installing build dependencies...
pip install -r requirements.txt

REM Run the build script
echo Building installer executable...
python build_installer.py

if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.
echo Output files:
echo - dist/DiscoverIT-Scanner-Installer.exe
echo - DiscoverIT-Scanner-Installer.zip
echo.
echo You can now distribute the installer to Windows machines.
pause
