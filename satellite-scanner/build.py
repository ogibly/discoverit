#!/usr/bin/env python3
"""
Build script for DiscoverIT Satellite Scanner
Creates a single, portable executable using PyInstaller
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def build_executable():
    """Build a single executable file."""
    print("🔨 Building DiscoverIT Satellite Scanner...")
    
    # Check if PyInstaller is available
    try:
        import PyInstaller
        print(f"✓ PyInstaller {PyInstaller.__version__} found")
    except ImportError:
        print("❌ PyInstaller not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)
        print("✓ PyInstaller installed")
    
    # Build command
    build_cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",                    # Single executable file
        "--console",                    # Console application
        "--name", "discoverit-scanner", # Output name
        "--clean",                      # Clean build
        "--noconfirm",                  # Don't ask for confirmation
        "discoverit-scanner.py"         # Source file
    ]
    
    print("🚀 Building executable...")
    result = subprocess.run(build_cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Build successful!")
        
        # Check if executable was created
        exe_path = Path("dist/discoverit-scanner.exe")
        if exe_path.exists():
            size_mb = exe_path.stat().st_size / (1024 * 1024)
            print(f"📦 Executable created: {exe_path}")
            print(f"📏 Size: {size_mb:.1f} MB")
            
            # Copy to root directory for easy access
            shutil.copy2(exe_path, "discoverit-scanner.exe")
            print("📋 Copied to root directory: discoverit-scanner.exe")
            
            return True
        else:
            print("❌ Executable not found after build")
            return False
    else:
        print("❌ Build failed!")
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        return False

def clean_build():
    """Clean build artifacts."""
    print("🧹 Cleaning build artifacts...")
    
    dirs_to_clean = ["build", "dist", "__pycache__"]
    files_to_clean = ["*.spec"]
    
    for dir_name in dirs_to_clean:
        if Path(dir_name).exists():
            shutil.rmtree(dir_name)
            print(f"✓ Removed {dir_name}/")
    
    for pattern in files_to_clean:
        for file_path in Path(".").glob(pattern):
            file_path.unlink()
            print(f"✓ Removed {file_path}")

def main():
    """Main build process."""
    print("=" * 50)
    print("DiscoverIT Satellite Scanner - Build Script")
    print("=" * 50)
    
    # Clean previous builds
    clean_build()
    
    # Build executable
    success = build_executable()
    
    if success:
        print("\n🎉 Build completed successfully!")
        print("\n📋 Usage:")
        print("  ./discoverit-scanner.exe install --url http://server:8000 --api-key YOUR_KEY")
        print("  ./discoverit-scanner.exe start")
        print("  ./discoverit-scanner.exe status")
    else:
        print("\n❌ Build failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()

