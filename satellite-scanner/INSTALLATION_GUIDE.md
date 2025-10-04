# DiscoverIT Satellite Scanner Installation Guide

## Overview

The DiscoverIT Satellite Scanner is a lightweight agent designed to run on remote network segments to enhance discovery capabilities. This guide covers installation for both Windows and Linux environments following industry best practices for minimal-touch deployments.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Windows Installation](#windows-installation)
3. [Linux Installation](#linux-installation)
4. [Configuration](#configuration)
5. [Service Management](#service-management)
6. [Troubleshooting](#troubleshooting)
7. [Security Considerations](#security-considerations)
8. [Uninstallation](#uninstallation)

## System Requirements

### Minimum Requirements
- **CPU**: 1 core, 1 GHz
- **RAM**: 512 MB
- **Disk**: 100 MB free space
- **Network**: Stable internet connection to main DiscoverIT server

### Operating Systems
- **Windows**: Windows 10/11, Windows Server 2016/2019/2022
- **Linux**: Ubuntu 18.04+, CentOS 7+, RHEL 7+, Debian 9+

### Network Requirements
- Outbound HTTPS (443) to main DiscoverIT server
- Outbound HTTP (80) for initial configuration
- Inbound access to network segments being scanned

## Windows Installation

### Automated Installation (Recommended)

1. **Download the Windows Package**
   - Download `discoverit-scanner-windows.zip` from the DiscoverIT admin interface
   - Extract the archive to a temporary directory

2. **Run Installation Script**
   ```cmd
   # Right-click install.bat and select "Run as administrator"
   install.bat
   ```

3. **Verify Installation**
   ```cmd
   sc query "DiscoverIT Scanner"
   ```

### Manual Installation

1. **Extract Files**
   ```cmd
   # Extract to Program Files
   mkdir "C:\Program Files\DiscoverIT Scanner"
   copy discoverit-scanner.exe "C:\Program Files\DiscoverIT Scanner\"
   ```

2. **Create Windows Service**
   ```cmd
   sc create "DiscoverIT Scanner" binPath="C:\Program Files\DiscoverIT Scanner\discoverit-scanner.exe" start=auto
   ```

3. **Start Service**
   ```cmd
   sc start "DiscoverIT Scanner"
   ```

### Windows Service Configuration

The scanner runs as a Windows service with the following characteristics:
- **Service Name**: `DiscoverIT Scanner`
- **Startup Type**: Automatic
- **Account**: Local System
- **Recovery**: Restart on failure

## Linux Installation

### Automated Installation (Recommended)

1. **Download the Linux Package**
   ```bash
   # Download from DiscoverIT admin interface
   wget /api/v2/satellite-scanner/download/linux -O discoverit-scanner-linux.zip
   unzip discoverit-scanner-linux.zip
   cd discoverit-scanner-linux
   ```

2. **Run Installation Script**
   ```bash
   chmod +x install.sh
   sudo ./install.sh
   ```

3. **Verify Installation**
   ```bash
   sudo systemctl status discoverit-scanner
   ```

### Manual Installation

1. **Install Dependencies**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install python3 python3-pip
   pip3 install requests psutil

   # CentOS/RHEL
   sudo yum install python3 python3-pip
   pip3 install requests psutil
   ```

2. **Setup Scanner**
   ```bash
   # Create service directory
   sudo mkdir -p /opt/discoverit-scanner
   sudo cp discoverit-scanner.py /opt/discoverit-scanner/
   sudo chmod +x /opt/discoverit-scanner/discoverit-scanner.py
   ```

3. **Create Systemd Service**
   ```bash
   sudo tee /etc/systemd/system/discoverit-scanner.service > /dev/null <<EOF
   [Unit]
   Description=DiscoverIT Satellite Scanner
   After=network.target

   [Service]
   Type=simple
   User=discoverit
   Group=discoverit
   WorkingDirectory=/opt/discoverit-scanner
   ExecStart=/usr/bin/python3 /opt/discoverit-scanner/discoverit-scanner.py
   Restart=always
   RestartSec=10
   StandardOutput=journal
   StandardError=journal

   [Install]
   WantedBy=multi-user.target
   EOF
   ```

4. **Create Service User**
   ```bash
   sudo useradd -r -s /bin/false discoverit
   sudo chown -R discoverit:discoverit /opt/discoverit-scanner
   ```

5. **Enable and Start Service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable discoverit-scanner
   sudo systemctl start discoverit-scanner
   ```

## Configuration

### Basic Configuration

Edit the scanner configuration in the executable or create a config file:

```python
# Main DiscoverIT server URL
SERVER_URL = "https://your-discoverit-server.com"

# Unique identifier for this scanner
SCANNER_NAME = "Branch-Office-Scanner-01"

# Network segments to scan (CIDR notation)
NETWORK_SEGMENTS = [
    "192.168.1.0/24",
    "10.0.0.0/16"
]

# Scanner settings
SCAN_INTERVAL = 3600  # seconds
MAX_CONCURRENT_SCANS = 3
TIMEOUT_SECONDS = 300
```

### Advanced Configuration

```python
# Authentication
API_KEY = "your-api-key-here"

# Logging
LOG_LEVEL = "INFO"
LOG_FILE = "/var/log/discoverit-scanner.log"

# Network settings
BIND_INTERFACE = "eth0"
SCAN_PORTS = [22, 23, 80, 443, 3389, 5900]

# Performance tuning
WORKER_THREADS = 4
QUEUE_SIZE = 100
```

## Service Management

### Windows Service Management

```cmd
# Start service
sc start "DiscoverIT Scanner"

# Stop service
sc stop "DiscoverIT Scanner"

# Check status
sc query "DiscoverIT Scanner"

# View logs
# Event Viewer > Windows Logs > Application
```

### Linux Service Management

```bash
# Start service
sudo systemctl start discoverit-scanner

# Stop service
sudo systemctl stop discoverit-scanner

# Check status
sudo systemctl status discoverit-scanner

# View logs
sudo journalctl -u discoverit-scanner -f

# Restart service
sudo systemctl restart discoverit-scanner
```

## Troubleshooting

### Common Issues

#### Scanner Not Starting
1. **Check Service Status**
   ```bash
   # Linux
   sudo systemctl status discoverit-scanner
   
   # Windows
   sc query "DiscoverIT Scanner"
   ```

2. **Check Logs**
   ```bash
   # Linux
   sudo journalctl -u discoverit-scanner -f
   
   # Windows
   # Event Viewer > Windows Logs > Application
   ```

3. **Verify Network Connectivity**
   ```bash
   curl -I https://your-discoverit-server.com/health
   ```

#### Scanner Not Discovering Devices
1. **Check Network Configuration**
   - Verify network segments are correct
   - Ensure scanner has access to target networks
   - Check firewall rules

2. **Check Scanner Permissions**
   - Linux: Ensure user has network access
   - Windows: Check service account permissions

#### High Resource Usage
1. **Adjust Scan Settings**
   ```python
   MAX_CONCURRENT_SCANS = 1  # Reduce concurrent scans
   SCAN_INTERVAL = 7200      # Increase scan interval
   ```

2. **Monitor System Resources**
   ```bash
   # Linux
   top -p $(pgrep -f discoverit-scanner)
   
   # Windows
   # Task Manager > Services
   ```

### Log Analysis

#### Linux Logs
```bash
# View recent logs
sudo journalctl -u discoverit-scanner --since "1 hour ago"

# Filter for errors
sudo journalctl -u discoverit-scanner -p err

# Follow logs in real-time
sudo journalctl -u discoverit-scanner -f
```

#### Windows Logs
- Open Event Viewer
- Navigate to Windows Logs > Application
- Filter by Source: "DiscoverIT Scanner"

## Security Considerations

### Network Security
- Use HTTPS for all communications
- Implement proper firewall rules
- Use VPN for remote installations
- Regular security updates

### Access Control
- Use dedicated service accounts
- Implement least privilege principle
- Regular credential rotation
- Monitor access logs

### Data Protection
- Encrypt sensitive configuration
- Secure log files
- Regular backup of configuration
- Data retention policies

## Uninstallation

### Windows Uninstallation

1. **Stop and Remove Service**
   ```cmd
   sc stop "DiscoverIT Scanner"
   sc delete "DiscoverIT Scanner"
   ```

2. **Remove Files**
   ```cmd
   rmdir /s "C:\Program Files\DiscoverIT Scanner"
   ```

### Linux Uninstallation

1. **Stop and Disable Service**
   ```bash
   sudo systemctl stop discoverit-scanner
   sudo systemctl disable discoverit-scanner
   ```

2. **Remove Service File**
   ```bash
   sudo rm /etc/systemd/system/discoverit-scanner.service
   sudo systemctl daemon-reload
   ```

3. **Remove Files and User**
   ```bash
   sudo rm -rf /opt/discoverit-scanner
   sudo userdel discoverit
   ```

## Support and Maintenance

### Regular Maintenance
- Monitor service health
- Review logs for errors
- Update scanner software
- Verify network connectivity

### Monitoring
- Set up health checks
- Configure alerts for failures
- Monitor resource usage
- Track scan performance

### Updates
- Regular security updates
- Feature updates from DiscoverIT
- Configuration updates
- Network topology changes

## Best Practices

### Installation
- Use automated installation scripts
- Test in non-production environments first
- Document installation procedures
- Maintain installation records

### Configuration
- Use descriptive scanner names
- Implement proper network segmentation
- Regular configuration reviews
- Version control for configurations

### Operations
- Implement monitoring and alerting
- Regular health checks
- Automated log rotation
- Backup configurations

---

For additional support, contact your DiscoverIT administrator or refer to the main DiscoverIT documentation.