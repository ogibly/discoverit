# DiscoverIT Satellite Scanner - Installation Guide

## 🎯 **Elegant Single-File Solution**

The new DiscoverIT Satellite Scanner is a **completely redesigned, elegant solution** that follows modern best practices:

- ✅ **Single executable file** (12.6 MB)
- ✅ **Zero installation complexity** - just run the executable
- ✅ **Beautiful CLI interface** with colors and progress indicators
- ✅ **Auto-detection** of network interfaces and subnets
- ✅ **Real-time monitoring** with dynamic network change detection
- ✅ **Robust error handling** and informative feedback
- ✅ **Minimal dependencies** - only 2 packages (requests, psutil)

## 🚀 **Quick Installation**

### Step 1: Download the Scanner
```bash
# Download the single executable
curl -O https://your-server/discoverit-scanner.exe
```

### Step 2: Install and Configure
```bash
# Install with your DiscoverIT instance
discoverit-scanner.exe install \
  --url http://your-discoverit-server:8000 \
  --api-key YOUR_API_KEY \
  --name "My Satellite Scanner" \
  --port 8001
```

### Step 3: Start the Scanner
```bash
# Start the scanner service
discoverit-scanner.exe start
```

### Step 4: Verify Installation
```bash
# Check scanner status
discoverit-scanner.exe status
```

## 📋 **Complete Command Reference**

| Command | Description | Example |
|---------|-------------|---------|
| `install` | Install and configure scanner | `discoverit-scanner.exe install --url http://server:8000 --api-key KEY` |
| `start` | Start the scanner service | `discoverit-scanner.exe start` |
| `stop` | Stop the scanner service | `discoverit-scanner.exe stop` |
| `status` | Show scanner status and network info | `discoverit-scanner.exe status` |

## 🔧 **Configuration**

The scanner automatically creates configuration at:
- **Windows**: `%USERPROFILE%\.discoverit-scanner\config.json`
- **Linux/macOS**: `~/.discoverit-scanner/config.json`

### Example Configuration
```json
{
  "scanner_id": "scanner_abc123",
  "scanner_name": "Scanner-OFFICE-01",
  "main_instance_url": "http://discoverit-server:8000",
  "api_key": "dit_abc123...",
  "port": 8001,
  "networks": [
    {
      "interface": "Ethernet",
      "ip": "192.168.1.100",
      "cidr": "192.168.1.0/24",
      "network": "192.168.1.0",
      "broadcast": "192.168.1.255"
    }
  ],
  "max_concurrent_scans": 3,
  "timeout_seconds": 300,
  "heartbeat_interval": 30,
  "auto_register": true,
  "log_level": "INFO"
}
```

## 🌐 **Network Detection**

The scanner automatically:

1. **Discovers all active network interfaces**
2. **Calculates network subnets and CIDR blocks**
3. **Monitors for network changes every 30 seconds**
4. **Reports changes to the main DiscoverIT instance**
5. **Filters out virtual/loopback interfaces**

### Supported Networks
- ✅ Ethernet interfaces
- ✅ WiFi adapters  
- ✅ VPN connections
- ✅ Virtual interfaces
- ❌ Loopback interfaces (filtered)
- ❌ VM interfaces (filtered)

## 📊 **Status Output Example**

```
DiscoverIT Scanner Status
==================================================
Configuration: ✓ Configured
Main Instance: ✓ Connected
Network Interfaces: 2 detected
  • Ethernet: 192.168.1.0/24 (192.168.1.100)
  • WiFi: 10.0.0.0/24 (10.0.0.50)
Service Status: ✓ Running

Config File: C:\Users\user\.discoverit-scanner\config.json
Log File: C:\Users\user\.discoverit-scanner\scanner.log
Port: 8001
```

## 🔐 **Security Features**

- **API Key Authentication** - Secure communication with main instance
- **Local Configuration** - Sensitive data stored locally with proper permissions
- **Network Isolation** - Only reports network information, no data collection
- **Minimal Attack Surface** - Single file with minimal dependencies

## 🐛 **Troubleshooting**

### Connection Issues
```bash
# Test connectivity manually
curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://your-server:8000/api/v2/health
```

### Network Detection Issues
```bash
# Check network interfaces
discoverit-scanner.exe status
```

### Logs
Check the log file for detailed information:
- **Location**: `~/.discoverit-scanner/scanner.log`
- **Format**: JSON with timestamps
- **Level**: INFO, WARNING, ERROR

## 📈 **Performance**

- **Memory Usage**: < 50MB
- **CPU Usage**: < 1% (idle)
- **Network Overhead**: Minimal (30-second intervals)
- **Startup Time**: < 2 seconds
- **File Size**: 12.6 MB (single executable)

## 🔄 **Automatic Features**

The scanner automatically:
- Detects network changes every 30 seconds
- Reports changes to the main instance
- Maintains connection health
- Logs all activities
- Handles errors gracefully

## 🎉 **What's New**

This is a **complete rewrite** from the previous installer with:

- ✅ **Single-file solution** - No complex installation
- ✅ **Elegant CLI** - Beautiful terminal interface
- ✅ **Auto-detection** - No manual network configuration
- ✅ **Real-time monitoring** - Dynamic network change detection
- ✅ **Robust error handling** - Graceful error handling
- ✅ **Modern architecture** - Clean, maintainable code
- ✅ **Best practices** - Following modern Python standards

---

**This is the new standard for DiscoverIT satellite scanners - elegant, simple, and powerful!**
