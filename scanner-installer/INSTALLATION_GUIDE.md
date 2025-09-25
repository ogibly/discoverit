# DiscoverIT Scanner - Installation Guide

## Overview

The DiscoverIT Scanner installer allows you to deploy satellite scanners on remote Windows machines to extend your network discovery capabilities across multiple networks.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11 or Windows Server 2016+
- **Architecture**: x64 (64-bit)
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Disk Space**: 500MB free space
- **Network**: Access to main DiscoverIT instance
- **Privileges**: Administrator rights required for installation

### Software Requirements
- Python 3.9+ (automatically installed if not present)
- Network access to main DiscoverIT instance
- Valid API key from main DiscoverIT instance

## Installation Methods

### Method 1: GUI Installer (Recommended)

1. **Download the Installer**
   - Download `DiscoverIT-Scanner-Installer.exe` from your main DiscoverIT instance
   - Save to a local directory on the target Windows machine

2. **Run as Administrator**
   - Right-click on `DiscoverIT-Scanner-Installer.exe`
   - Select "Run as administrator"
   - Click "Yes" when prompted by User Account Control

3. **Configure the Scanner**
   - **Main Instance URL**: Enter the URL of your main DiscoverIT instance
     - Example: `http://192.168.1.100:8000` or `https://discoverit.company.com`
   - **API Key**: Enter the API key provided by your DiscoverIT administrator
   - **Scanner Name**: Enter a descriptive name for this scanner
     - Example: `Branch-Office-NYC` or `Remote-Site-1`
   - **Port**: Specify the port for the scanner service (default: 8001)
   - **Network Subnets**: Enter comma-separated network ranges this scanner will monitor
     - Example: `192.168.1.0/24,10.0.0.0/8,172.16.0.0/12`

4. **Test Connection**
   - Click "Test Connection" to verify connectivity to the main instance
   - Ensure you receive a "Connection test successful!" message

5. **Install**
   - Click "Install" to begin the installation process
   - Wait for the installation to complete
   - The service will start automatically

### Method 2: Console Installer

For automated deployments or server environments:

```cmd
DiscoverIT-Scanner-Installer.exe --console
```

Follow the prompts to enter configuration details.

## Post-Installation

### Verification

1. **Check Service Status**
   ```cmd
   sc query DiscoverITScanner
   ```
   Status should show "RUNNING"

2. **View Service Logs**
   - Logs are located at: `C:\Program Files\DiscoverIT Scanner\scanner.log`
   - Check for any error messages

3. **Test Scanner API**
   ```cmd
   curl http://localhost:8001/health
   ```
   Should return JSON with scanner status

### Configuration File

The scanner configuration is stored at:
`C:\Program Files\DiscoverIT Scanner\config.json`

You can modify this file to update settings, then restart the service:
```cmd
net stop DiscoverITScanner
net start DiscoverITScanner
```

## Management

### Windows Service Commands

```cmd
# Start service
net start DiscoverITScanner

# Stop service
net stop DiscoverITScanner

# Restart service
net stop DiscoverITScanner && net start DiscoverITScanner

# Check status
sc query DiscoverITScanner
```

### Service Management Scripts

The installer creates batch files in the installation directory:

- `install_service.bat` - Install and start the service
- `uninstall_service.bat` - Stop and remove the service

### Remote Management

Once installed, the scanner can be managed through the main DiscoverIT web interface:

1. Navigate to **Admin Settings** → **Scanner Configs**
2. View registered scanners and their status
3. Configure scan targets and schedules
4. Monitor scanner health and performance

## Troubleshooting

### Common Issues

#### Installation Fails with "Administrator privileges required"
- Ensure you're running the installer as Administrator
- Right-click the installer and select "Run as administrator"

#### Connection Test Fails
- Verify the main instance URL is correct and accessible
- Check that the API key is valid
- Ensure firewall allows outbound connections to the main instance
- Test connectivity: `ping <main-instance-ip>`

#### Service Won't Start
- Check Windows Event Viewer for error details
- Verify Python is installed correctly
- Check the scanner.log file for errors
- Ensure port 8001 is not in use by another service

#### Scanner Not Appearing in Main Instance
- Verify the scanner registered successfully during installation
- Check the main instance logs for registration errors
- Ensure the API key has sufficient permissions
- Manually register the scanner if needed

### Log Files

- **Service Logs**: `C:\Program Files\DiscoverIT Scanner\scanner.log`
- **Windows Event Logs**: Event Viewer → Windows Logs → Application
- **Installation Logs**: Check the installer output for error messages

### Network Configuration

#### Firewall Rules
The installer automatically creates Windows Firewall rules, but you may need to configure:

1. **Outbound Rules**: Allow scanner to connect to main instance
2. **Inbound Rules**: Allow main instance to connect to scanner (if needed)
3. **Local Network**: Ensure scanner can access target networks

#### Network Access
- Scanner must be able to reach the main DiscoverIT instance
- Scanner must have access to the networks it will scan
- Consider network segmentation and security policies

## Security Considerations

### API Key Management
- Store API keys securely
- Rotate API keys regularly
- Use least-privilege access for scanner API keys

### Network Security
- Place scanners in appropriate network segments
- Use VPN connections for remote scanners
- Implement network monitoring and alerting

### Service Security
- The scanner service runs with SYSTEM privileges
- Ensure the installation directory has proper permissions
- Regularly update the scanner software

## Uninstallation

### Using Windows Programs and Features
1. Open "Add or remove programs"
2. Find "DiscoverIT Scanner"
3. Click "Uninstall"

### Manual Uninstallation
1. Stop the service: `net stop DiscoverITScanner`
2. Remove the service: `sc delete DiscoverITScanner`
3. Delete installation directory: `rmdir /s "C:\Program Files\DiscoverIT Scanner"`
4. Remove from main instance (via web interface)

### Uninstall Script
Run the provided uninstall script:
```cmd
C:\Program Files\DiscoverIT Scanner\uninstall.bat
```

## Support

For additional support:
- Check the main DiscoverIT documentation
- Contact your system administrator
- Review the scanner logs for error details
- Ensure all prerequisites are met

## Advanced Configuration

### Custom Scan Parameters
Modify `config.json` to customize:
- Scan timeouts
- Concurrent scan limits
- Heartbeat intervals
- Log levels

### Multiple Scanners
You can install multiple scanners on the same machine by:
1. Using different ports for each scanner
2. Modifying the service name
3. Ensuring unique scanner names

### High Availability
For critical deployments:
- Install multiple scanners for redundancy
- Use load balancing for scanner requests
- Monitor scanner health and availability
