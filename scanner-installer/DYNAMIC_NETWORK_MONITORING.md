# 🔄 Dynamic Network Monitoring

## Overview

The DiscoverIT Scanner now features **Dynamic Network Monitoring** that automatically detects and adapts to network changes without any manual configuration. This eliminates the need for users to manually enter network subnets and ensures the scanner always has the most current network information.

## Key Features

### 🚀 **Auto-Detection on Startup**
- Scans all network adapters when the service starts
- Identifies active network interfaces and their subnets
- Automatically excludes virtual interfaces (VMware, VirtualBox, Hyper-V)
- Only includes private networks and corporate ranges

### ⚡ **Real-Time Monitoring**
- Checks for network changes every 30 seconds
- Detects when network adapters are added/removed
- Monitors IP address changes and subnet modifications
- Automatically updates configuration when changes are detected

### 📡 **Automatic Server Updates**
- Notifies the main DiscoverIT instance when networks change
- Sends comprehensive network information including:
  - Current subnets
  - Network interface details
  - Interface status and speed
  - Last update timestamp

### 🔧 **Zero Configuration**
- No manual subnet entry required
- Works out-of-the-box on any network
- Automatically adapts to network topology changes
- Handles DHCP and static IP configurations

## Technical Implementation

### Network Detection Algorithm

```python
def detect_network_subnets(self) -> list:
    """Auto-detect network subnets from available network interfaces."""
    subnets = []
    
    # Get all network interfaces
    interfaces = psutil.net_if_addrs()
    
    for interface_name, addresses in interfaces.items():
        # Skip virtual interfaces
        if interface_name.lower() in ['lo', 'loopback', 'vmware', 'virtualbox', 'hyper-v']:
            continue
        
        for addr in addresses:
            # Only process IPv4 addresses
            if addr.family == socket.AF_INET and addr.address != '127.0.0.1':
                # Check if interface is up
                interface_stats = psutil.net_if_stats().get(interface_name)
                if interface_stats and interface_stats.isup:
                    # Calculate subnet from IP and netmask
                    network = ipaddress.IPv4Network(f"{addr.address}/{addr.netmask}", strict=False)
                    
                    # Only include private networks
                    if network.is_private:
                        subnets.append(str(network))
    
    return subnets
```

### Monitoring Loop

```python
def _network_monitor_loop(self):
    """Background loop to monitor network changes."""
    while True:
        try:
            # Check for network changes
            if self.config.check_network_changes():
                # Notify main instance of network changes
                self._notify_network_changes()
            
            # Sleep for 30 seconds before next check
            time.sleep(30)
            
        except Exception as e:
            logger.error(f"Error in network monitoring loop: {e}")
            time.sleep(60)  # Wait longer on error
```

## API Endpoints

### GET `/network-info`
Returns comprehensive network information:

```json
{
  "subnets": ["192.168.1.0/24", "10.0.0.0/8"],
  "interfaces": [
    {
      "name": "Ethernet",
      "addresses": [
        {
          "ip": "192.168.1.100",
          "netmask": "255.255.255.0",
          "broadcast": "192.168.1.255"
        }
      ],
      "is_up": true,
      "speed": 1000
    }
  ],
  "last_updated": "2024-01-15T10:30:00Z",
  "total_interfaces": 3
}
```

### POST `/refresh-networks`
Manually triggers network detection:

```json
{
  "status": "success",
  "previous_subnets": ["192.168.1.0/24"],
  "current_subnets": ["192.168.1.0/24", "10.0.0.0/8"],
  "changed": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Benefits

### 🎯 **For Administrators**
- **Zero Maintenance**: No need to manually update network configurations
- **Automatic Adaptation**: Scanners adapt to network changes automatically
- **Real-Time Visibility**: Always know what networks each scanner can access
- **Reduced Errors**: Eliminates configuration mistakes

### 🏢 **For Organizations**
- **Dynamic Environments**: Perfect for offices with changing network topologies
- **Branch Offices**: Automatically adapts to different network configurations
- **Mobile Scanners**: Works seamlessly when scanners are moved between networks
- **DHCP Networks**: Handles dynamic IP assignments automatically

### 🔧 **For IT Teams**
- **Simplified Deployment**: One-click installation with zero configuration
- **Centralized Management**: All network information visible in main interface
- **Automatic Updates**: Network changes are immediately reflected
- **Comprehensive Logging**: Full audit trail of network changes

## Configuration

The dynamic network monitoring is enabled by default and requires no configuration. However, you can customize the behavior:

```json
{
  "auto_detect_networks": true,
  "dynamic_network_monitoring": true,
  "network_check_interval": 300,
  "subnets": [],
  "last_network_update": "2024-01-15T10:30:00Z"
}
```

## Monitoring and Logging

The system provides comprehensive logging for network monitoring:

```
2024-01-15 10:30:00 - INFO - Detected network interface: Ethernet -> 192.168.1.0/24
2024-01-15 10:30:00 - INFO - Auto-detected 2 network subnets: ['192.168.1.0/24', '10.0.0.0/8']
2024-01-15 10:35:00 - INFO - Network changes detected:
2024-01-15 10:35:00 - INFO -   Previous: ['192.168.1.0/24']
2024-01-15 10:35:00 - INFO -   Current:  ['192.168.1.0/24', '10.0.0.0/8']
2024-01-15 10:35:01 - INFO - Successfully notified main instance of network changes
```

## Troubleshooting

### Common Issues

1. **No Networks Detected**
   - Check if network adapters are active
   - Verify network interfaces are not virtual
   - Ensure adapters have valid IP addresses

2. **Network Changes Not Detected**
   - Check system logs for errors
   - Verify network monitoring is enabled
   - Restart the scanner service

3. **Main Instance Not Updated**
   - Verify API key is correct
   - Check network connectivity to main instance
   - Review authentication logs

### Manual Network Refresh

If automatic detection fails, you can manually refresh networks:

```bash
curl -X POST http://scanner-ip:8001/refresh-networks
```

## Future Enhancements

- **Network Performance Monitoring**: Track interface speeds and utilization
- **Network Topology Discovery**: Map network relationships
- **VLAN Detection**: Identify and monitor VLAN configurations
- **Wireless Network Support**: Monitor WiFi networks and access points
- **Network Security Scanning**: Detect unauthorized network changes
