"""
Simple build script for DiscoverIT Scanner Installer
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path

def build_installer():
    """Build the installer executable."""
    print("Building DiscoverIT Scanner Installer...")
    
    # Create build directory
    build_dir = Path("build")
    dist_dir = Path("dist")
    
    if build_dir.exists():
        shutil.rmtree(build_dir)
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    
    # PyInstaller command as a list
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",
        "--windowed",
        "--name=DiscoverIT-Scanner-Installer",
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
    
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print("Build failed!")
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        return False
    
    print("Build completed successfully!")
    
    # Check if executable was created
    exe_path = Path("dist/DiscoverIT-Scanner-Installer.exe")
    if exe_path.exists():
        print(f"Executable created: {exe_path}")
        print(f"Size: {exe_path.stat().st_size / (1024*1024):.1f} MB")
        return True
    else:
        print("Executable not found!")
        return False

if __name__ == "__main__":
    success = build_installer()
    if not success:
        sys.exit(1)
