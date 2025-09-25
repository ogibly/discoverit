"""
Build script for creating the DiscoverIT Scanner installer executable.
"""
import os
import sys
import subprocess
import shutil
import zipfile
from pathlib import Path

def build_installer():
    """Build the installer executable."""
    print("Building DiscoverIT Scanner Installer...")
    
    # Install PyInstaller if not present
    try:
        import PyInstaller
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)
    
    # Create build directory
    build_dir = Path("build")
    dist_dir = Path("dist")
    
    if build_dir.exists():
        shutil.rmtree(build_dir)
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    
    # PyInstaller command
    cmd = [
        "pyinstaller",
        "--onefile",
        "--windowed",
        "--name=DiscoverIT-Scanner-Installer",
        "--icon=icon.ico",  # Add icon if available
        "--add-data=scanner_service.py;.",
        "--add-data=requirements.txt;.",
        "--hidden-import=win32service",
        "--hidden-import=win32serviceutil",
        "--hidden-import=win32event",
        "--hidden-import=servicemanager",
        "--hidden-import=nmap",
        "--hidden-import=fastapi",
        "--hidden-import=uvicorn",
        "installer.py"
    ]
    
    # Remove icon parameter if icon file doesn't exist
    if not Path("icon.ico").exists():
        cmd = [arg for arg in cmd if not arg.startswith("--icon")]
    
    print(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)
    
    # Create final installer package
    create_installer_package()

def create_installer_package():
    """Create the final installer package."""
    print("Creating installer package...")
    
    # Create package directory
    package_dir = Path("DiscoverIT-Scanner-Installer")
    if package_dir.exists():
        shutil.rmtree(package_dir)
    package_dir.mkdir()
    
    # Copy executable
    exe_path = Path("dist/DiscoverIT-Scanner-Installer.exe")
    if exe_path.exists():
        shutil.copy2(exe_path, package_dir / "DiscoverIT-Scanner-Installer.exe")
    
    # Copy additional files
    files_to_copy = [
        "README.md",
        "scanner_service.py",
        "requirements.txt"
    ]
    
    for file in files_to_copy:
        if Path(file).exists():
            shutil.copy2(file, package_dir / file)
    
    # Create uninstaller script
    create_uninstaller(package_dir)
    
    # Create ZIP package
    zip_path = Path("DiscoverIT-Scanner-Installer.zip")
    if zip_path.exists():
        zip_path.unlink()
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_path in package_dir.rglob('*'):
            if file_path.is_file():
                arcname = file_path.relative_to(package_dir)
                zipf.write(file_path, arcname)
    
    print(f"Installer package created: {zip_path}")
    print(f"Package contents: {package_dir}")

def create_uninstaller(package_dir):
    """Create uninstaller script."""
    uninstaller_content = '''@echo off
echo DiscoverIT Scanner Uninstaller
echo ==============================

echo Stopping service...
net stop DiscoverITScanner 2>nul

echo Removing service...
sc delete DiscoverITScanner 2>nul

echo Removing files...
rmdir /s /q "C:\\Program Files\\DiscoverIT Scanner" 2>nul

echo Uninstallation completed.
pause
'''
    
    with open(package_dir / "uninstall.bat", 'w') as f:
        f.write(uninstaller_content)

if __name__ == "__main__":
    build_installer()
