# 🚀 DiscoverIT Scanner - Quick Start Guide

## ✅ Build Complete!

Your DiscoverIT Scanner installer has been successfully built and is ready for deployment!

## 📦 Package Contents

The `DiscoverIT-Scanner-Package` folder contains:
- **`DiscoverIT-Scanner-Installer.exe`** (20.5 MB) - Main installer executable
- **`README.md`** - Overview and features
- **`INSTALLATION_GUIDE.md`** - Detailed installation instructions
- **`DEPLOYMENT_SUMMARY.md`** - Complete deployment guide

## 🔑 Credential Requirements

### **Yes, you need credentials from the main application:**

#### **Required Credentials:**
1. **Main Instance URL** - The URL of your DiscoverIT server
   - Example: `http://192.168.1.100:8000` or `https://discoverit.company.com`

2. **API Key** - Authentication token for the scanner
   - This needs to be generated from your main DiscoverIT instance
   - The scanner uses this to register and communicate with the main instance

#### **How to Get the API Key:**

1. **Access your main DiscoverIT instance** (web interface)
2. **Go to Admin Settings** → **API Keys** (or similar section)
3. **Create a new API key** specifically for scanner services
4. **Copy the API key** - you'll need it during installation

#### **Alternative: Generate API Key via API**
```bash
# If you have admin access to the main instance
curl -X POST "http://your-discoverit-instance:8000/api/v2/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-admin-password"}'
```

## 🎯 Next Steps

### **1. Test the Installer (Recommended)**
- Copy `DiscoverIT-Scanner-Installer.exe` to a test Windows machine
- Run as Administrator
- Use your main DiscoverIT instance details
- Verify the scanner appears in your main instance

### **2. Deploy to Production**
- Distribute the installer to target Windows machines
- Ensure each machine has network access to your main DiscoverIT instance
- Use the same API key for all scanners (or create separate keys for each)

### **3. Monitor Deployment**
- Check the main DiscoverIT web interface
- Go to **Admin Settings** → **Scanner Configs**
- Verify all scanners are registered and showing as "online"

## 🔧 Installation Process

### **On Target Windows Machine:**
1. **Right-click** `DiscoverIT-Scanner-Installer.exe`
2. **Select "Run as administrator"**
3. **Enter configuration:**
   - Main Instance URL: `http://your-discoverit-server:8000`
   - API Key: `your-generated-api-key`
   - Scanner Name: `Branch-Office-NYC` (descriptive name)
   - Port: `8001` (default)
   - Network Detection: **🔄 Dynamic Auto-Detection** ✅
4. **Click "Test Connection"** to verify
5. **Click "Install"** to complete installation

### **🚀 Dynamic Network Monitoring:**
- **Auto-Detection**: Scans all network adapters on startup
- **Real-Time Monitoring**: Checks for network changes every 30 seconds
- **Automatic Updates**: Notifies main server when networks change
- **Zero Configuration**: No manual subnet entry required

### **Verification:**
- Service starts automatically
- Scanner appears in main DiscoverIT interface
- Health status shows "online"

## 🚨 Important Notes

### **Network Requirements:**
- **Outbound**: Scanner → Main instance (for API calls)
- **Inbound**: Main instance → Scanner (for scan requests)
- **Local**: Scanner → Target networks (for scanning)

### **Firewall:**
- Windows Firewall rules are automatically configured
- Ensure corporate firewalls allow the required connections

### **Security:**
- API keys should be treated as passwords
- Store securely and rotate regularly
- Use HTTPS for main instance if possible

## 📞 Support

If you encounter issues:
1. Check the **INSTALLATION_GUIDE.md** for detailed troubleshooting
2. Verify network connectivity between scanner and main instance
3. Check Windows Event Viewer for service errors
4. Review scanner logs at: `C:\Program Files\DiscoverIT Scanner\scanner.log`

---

**🎉 Your DiscoverIT Scanner installer is ready for deployment!**
