# DiscoverIT Scanner - Windows Installer

This package provides a Windows installer for deploying DiscoverIT Scanner as a satellite scanner on remote networks.

## Features

- **Easy Installation**: One-click installer with automatic dependency management
- **🔄 Dynamic Network Monitoring**: Auto-detects network changes in real-time
- **Zero Configuration**: No manual subnet entry required
- **Windows Service**: Runs as a Windows service for automatic startup
- **Remote Configuration**: Connects to main DiscoverIT instance for centralized management
- **Network Discovery**: Comprehensive network scanning capabilities
- **Secure Communication**: Encrypted communication with main instance
- **Health Monitoring**: Built-in health checks and status reporting

## Requirements

- Windows 10/11 or Windows Server 2016+
- Administrator privileges for installation
- Network access to main DiscoverIT instance
- Python 3.9+ (automatically installed if not present)

## Installation

1. Download the `DiscoverIT-Scanner-Installer.exe` file
2. Run as Administrator
3. Follow the installation wizard
4. Configure connection to main DiscoverIT instance
5. Start the scanner service

## Configuration

The scanner can be configured through:
- Installation wizard (initial setup)
- Windows Service configuration
- Configuration file: `C:\Program Files\DiscoverIT Scanner\config.json`
- Main DiscoverIT web interface (remote management)

## Usage

Once installed, the scanner will:
- Automatically start with Windows
- Connect to the main DiscoverIT instance
- Accept scan requests from the main instance
- Report status and health information
- Perform network discovery scans

## Uninstallation

Use the Windows "Add or Remove Programs" feature or run the uninstaller from the Start Menu.

## Support

For support and documentation, visit the main DiscoverIT instance or contact your system administrator.
