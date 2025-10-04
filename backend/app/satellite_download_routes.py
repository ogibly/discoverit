from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import HTTPBearer
import os
import zipfile
import tempfile
import shutil
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v2/satellite-scanner", tags=["satellite-scanner"])
security = HTTPBearer()

def get_satellite_scanner_dir():
    """Get the satellite scanner directory path"""
    # Get the project root directory (two levels up from this file)
    current_dir = Path(__file__).parent
    project_root = current_dir.parent.parent
    return project_root / "satellite-scanner"

def create_linux_executable():
    """Create a Linux executable package"""
    satellite_dir = get_satellite_scanner_dir()
    
    # Create a temporary directory for the Linux package
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Copy the Python script
        script_path = satellite_dir / "discoverit-scanner.py"
        if not script_path.exists():
            raise HTTPException(status_code=404, detail="Satellite scanner script not found")
        
        # Create the package directory
        package_dir = temp_path / "discoverit-scanner-linux"
        package_dir.mkdir()
        
        # Copy the script and requirements
        shutil.copy2(script_path, package_dir / "discoverit-scanner.py")
        
        # Copy requirements.txt
        requirements_path = satellite_dir / "requirements.txt"
        if requirements_path.exists():
            shutil.copy2(requirements_path, package_dir / "requirements.txt")
        
        # Create installation script for Linux
        install_script = package_dir / "install.sh"
        install_script.write_text("""#!/bin/bash
# DiscoverIT Satellite Scanner Installation Script for Linux

set -e

echo "🛰️ DiscoverIT Satellite Scanner Installation"
echo "============================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.8 or higher and try again."
    exit 1
fi

# Check Python version
python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
required_version="3.8"

if [ "$(printf '%s\\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.8 or higher is required. Found: $python_version"
    exit 1
fi

echo "✅ Python $python_version detected"

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f "requirements.txt" ]; then
    python3 -m pip install -r requirements.txt --user
else
    python3 -m pip install requests psutil --user
fi

# Make the script executable
chmod +x discoverit-scanner.py

# Create systemd service file
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/discoverit-scanner.service > /dev/null <<EOF
[Unit]
Description=DiscoverIT Satellite Scanner
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/python3 $(pwd)/discoverit-scanner.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
echo "🚀 Starting DiscoverIT Satellite Scanner service..."
sudo systemctl daemon-reload
sudo systemctl enable discoverit-scanner.service
sudo systemctl start discoverit-scanner.service

echo "✅ Installation complete!"
echo ""
echo "📋 Service Management Commands:"
echo "  Start:   sudo systemctl start discoverit-scanner"
echo "  Stop:    sudo systemctl stop discoverit-scanner"
echo "  Status:  sudo systemctl status discoverit-scanner"
echo "  Logs:    sudo journalctl -u discoverit-scanner -f"
echo ""
echo "🔧 Configuration:"
echo "  Edit the configuration in: $(pwd)/discoverit-scanner.py"
echo "  Restart service after changes: sudo systemctl restart discoverit-scanner"
""")
        
        # Make install script executable
        install_script.chmod(0o755)
        
        # Create README for Linux
        readme_path = package_dir / "README.md"
        readme_path.write_text("""# DiscoverIT Satellite Scanner for Linux

## Quick Start

1. Run the installation script:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

2. Configure the scanner by editing `discoverit-scanner.py`

3. Restart the service:
   ```bash
   sudo systemctl restart discoverit-scanner
   ```

## Manual Installation

If you prefer manual installation:

1. Install Python dependencies:
   ```bash
   pip3 install -r requirements.txt
   ```

2. Make the script executable:
   ```bash
   chmod +x discoverit-scanner.py
   ```

3. Run the scanner:
   ```bash
   python3 discoverit-scanner.py
   ```

## Service Management

- **Start**: `sudo systemctl start discoverit-scanner`
- **Stop**: `sudo systemctl stop discoverit-scanner`
- **Status**: `sudo systemctl status discoverit-scanner`
- **Logs**: `sudo journalctl -u discoverit-scanner -f`

## Configuration

Edit the configuration variables in `discoverit-scanner.py`:

- `SERVER_URL`: Main DiscoverIT server URL
- `SCANNER_NAME`: Unique name for this scanner
- `NETWORK_SEGMENTS`: List of network segments to scan

## Troubleshooting

- Check service status: `sudo systemctl status discoverit-scanner`
- View logs: `sudo journalctl -u discoverit-scanner -f`
- Test connectivity: `curl -I $SERVER_URL/health`
""")
        
        # Create a zip file
        zip_path = temp_path / "discoverit-scanner-linux.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in package_dir.rglob('*'):
                if file_path.is_file():
                    arcname = file_path.relative_to(package_dir)
                    zipf.write(file_path, arcname)
        
        return zip_path

@router.get("/download/windows")
async def download_windows_scanner():
    """Download Windows satellite scanner executable"""
    try:
        satellite_dir = get_satellite_scanner_dir()
        exe_path = satellite_dir / "dist" / "discoverit-scanner.exe"
        
        if not exe_path.exists():
            raise HTTPException(status_code=404, detail="Windows executable not found")
        
        # Create a zip package with the executable and installation guide
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            package_dir = temp_path / "discoverit-scanner-windows"
            package_dir.mkdir()
            
            # Copy the executable
            shutil.copy2(exe_path, package_dir / "discoverit-scanner.exe")
            
            # Copy installation guide
            guide_path = satellite_dir / "INSTALLATION_GUIDE.md"
            if guide_path.exists():
                shutil.copy2(guide_path, package_dir / "INSTALLATION_GUIDE.md")
            
            # Create Windows installation script
            install_script = package_dir / "install.bat"
            install_script.write_text("""@echo off
echo 🛰️ DiscoverIT Satellite Scanner Installation for Windows
echo =====================================================

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running with administrator privileges
) else (
    echo ❌ This script requires administrator privileges
    echo Please run as administrator and try again
    pause
    exit /b 1
)

REM Create service directory
set SERVICE_DIR=C:\\Program Files\\DiscoverIT Scanner
if not exist "%SERVICE_DIR%" mkdir "%SERVICE_DIR%"

REM Copy executable
copy "discoverit-scanner.exe" "%SERVICE_DIR%\\"
if %errorLevel% neq 0 (
    echo ❌ Failed to copy executable
    pause
    exit /b 1
)

REM Create Windows service
sc create "DiscoverIT Scanner" binPath="%SERVICE_DIR%\\discoverit-scanner.exe" start=auto
if %errorLevel% neq 0 (
    echo ❌ Failed to create Windows service
    pause
    exit /b 1
)

REM Start the service
sc start "DiscoverIT Scanner"
if %errorLevel% neq 0 (
    echo ❌ Failed to start service
    pause
    exit /b 1
)

echo ✅ Installation complete!
echo.
echo 📋 Service Management:
echo   Start:   sc start "DiscoverIT Scanner"
echo   Stop:    sc stop "DiscoverIT Scanner"
echo   Status:  sc query "DiscoverIT Scanner"
echo.
echo 🔧 Configuration:
echo   Edit: %SERVICE_DIR%\\discoverit-scanner.exe
echo   Logs: Event Viewer ^> Windows Logs ^> Application
echo.
pause
""")
            
            # Create README for Windows
            readme_path = package_dir / "README.md"
            readme_path.write_text("""# DiscoverIT Satellite Scanner for Windows

## Quick Start

1. **Run as Administrator**: Right-click `install.bat` and select "Run as administrator"

2. The installation script will:
   - Copy the scanner to `C:\\Program Files\\DiscoverIT Scanner\\`
   - Create a Windows service
   - Start the service automatically

## Manual Installation

If you prefer manual installation:

1. Copy `discoverit-scanner.exe` to a permanent location (e.g., `C:\\Program Files\\DiscoverIT Scanner\\`)

2. Create a Windows service:
   ```cmd
   sc create "DiscoverIT Scanner" binPath="C:\\Program Files\\DiscoverIT Scanner\\discoverit-scanner.exe" start=auto
   ```

3. Start the service:
   ```cmd
   sc start "DiscoverIT Scanner"
   ```

## Service Management

- **Start**: `sc start "DiscoverIT Scanner"`
- **Stop**: `sc stop "DiscoverIT Scanner"`
- **Status**: `sc query "DiscoverIT Scanner"`
- **Logs**: Event Viewer > Windows Logs > Application

## Configuration

Edit the configuration in the executable or create a config file:

- `SERVER_URL`: Main DiscoverIT server URL
- `SCANNER_NAME`: Unique name for this scanner
- `NETWORK_SEGMENTS`: List of network segments to scan

## Troubleshooting

- Check service status: `sc query "DiscoverIT Scanner"`
- View logs: Event Viewer > Windows Logs > Application
- Test connectivity: `curl -I %SERVER_URL%/health`
- Restart service: `sc stop "DiscoverIT Scanner" && sc start "DiscoverIT Scanner"`
""")
            
            # Create zip file
            zip_path = temp_path / "discoverit-scanner-windows.zip"
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_path in package_dir.rglob('*'):
                    if file_path.is_file():
                        arcname = file_path.relative_to(package_dir)
                        zipf.write(file_path, arcname)
            
            return FileResponse(
                path=str(zip_path),
                filename="discoverit-scanner-windows.zip",
                media_type="application/zip"
            )
    
    except Exception as e:
        logger.error(f"Error creating Windows package: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create Windows package: {str(e)}")

@router.get("/download/linux")
async def download_linux_scanner():
    """Download Linux satellite scanner package"""
    try:
        zip_path = create_linux_executable()
        
        return FileResponse(
            path=str(zip_path),
            filename="discoverit-scanner-linux.zip",
            media_type="application/zip"
        )
    
    except Exception as e:
        logger.error(f"Error creating Linux package: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create Linux package: {str(e)}")

@router.get("/download/guide")
async def download_installation_guide():
    """Download installation guide"""
    try:
        satellite_dir = get_satellite_scanner_dir()
        guide_path = satellite_dir / "INSTALLATION_GUIDE.md"
        
        if not guide_path.exists():
            raise HTTPException(status_code=404, detail="Installation guide not found")
        
        return FileResponse(
            path=str(guide_path),
            filename="DiscoverIT-Satellite-Scanner-Installation-Guide.md",
            media_type="text/markdown"
        )
    
    except Exception as e:
        logger.error(f"Error downloading installation guide: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download installation guide: {str(e)}")

@router.get("/download/info")
async def get_download_info():
    """Get information about available downloads"""
    try:
        satellite_dir = get_satellite_scanner_dir()
        
        info = {
            "windows": {
                "available": (satellite_dir / "dist" / "discoverit-scanner.exe").exists(),
                "filename": "discoverit-scanner-windows.zip",
                "description": "Windows executable with installation script"
            },
            "linux": {
                "available": (satellite_dir / "discoverit-scanner.py").exists(),
                "filename": "discoverit-scanner-linux.zip", 
                "description": "Linux Python package with systemd service"
            },
            "guide": {
                "available": (satellite_dir / "INSTALLATION_GUIDE.md").exists(),
                "filename": "DiscoverIT-Satellite-Scanner-Installation-Guide.md",
                "description": "Comprehensive installation guide"
            }
        }
        
        return info
    
    except Exception as e:
        logger.error(f"Error getting download info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get download info: {str(e)}")
