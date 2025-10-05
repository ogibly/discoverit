import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { Input } from './ui/Input';
import { 
  ModernCard,
  ModernKPICard,
  ModernButton,
  ModernBadge,
  ModernProgress
} from '../design-system/ModernComponentLibrary';
import { cn } from '../utils/cn';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  Mic, 
  Plus, 
  Network, 
  Server, 
  Smartphone, 
  Monitor, 
  Router, 
  Printer, 
  Power,
  Fan,
  Snowflake,
  Droplets,
  Globe,
  ArrowLeft,
  X,
  MoreHorizontal
} from 'lucide-react';

const Dashboard = () => {
  const {
    assets,
    discoveredDevices,
    activeScanTask,
    fetchAssets,
    fetchDiscoveredDevices
  } = useApp();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Scanner information state
  const [scanners, setScanners] = useState([]);
  const [scannerHealth, setScannerHealth] = useState([]);
  const [loadingScanners, setLoadingScanners] = useState(true);
  
  // Modern UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceControls, setDeviceControls] = useState({
    temperature: 22.5,
    power: true,
    mode: 'cooling',
    fanSpeed: 3
  });
  
  useEffect(() => {
    fetchAssets();
    fetchDiscoveredDevices();
    fetchScannerInfo();
  }, [fetchAssets, fetchDiscoveredDevices]);

  const fetchScannerInfo = async () => {
    try {
      setLoadingScanners(true);
      
      // Fetch scanner configurations (use only the main scanners endpoint to avoid duplicates)
      const scannersResponse = await axios.get('/api/v2/scanners');
      setScanners(scannersResponse.data);
      
      // Note: Satellite scanners are now included in the main scanners endpoint
      // No need to fetch separately to avoid duplicates
      
      // Fetch scanner health
      const healthResponse = await axios.get('/api/v2/scanners/health/all');
      setScannerHealth(healthResponse.data);
    } catch (error) {
      console.error('Failed to fetch scanner information:', error);
    } finally {
      setLoadingScanners(false);
    }
  };

  // Calculate key metrics
  const totalAssets = assets.length;
  const totalDevices = discoveredDevices.length;
  const newDevices = discoveredDevices.filter(device => 
    !assets.some(asset => asset.primary_ip === device.primary_ip)
  ).length;
  const deviceTypes = [...new Set(assets.map(asset => asset?.device_type).filter(Boolean))].length;

  // Modern device categories for Q-Home style interface
  const deviceCategories = [
    { name: 'Network Infrastructure', count: assets.filter(a => ['router', 'switch'].includes(a?.device_type)).length, icon: Router, color: 'text-blue-500' },
    { name: 'Servers', count: assets.filter(a => a?.device_type === 'server').length, icon: Server, color: 'text-green-500' },
    { name: 'Workstations', count: assets.filter(a => a?.device_type === 'workstation').length, icon: Monitor, color: 'text-purple-500' },
    { name: 'Mobile Devices', count: assets.filter(a => a?.device_type === 'smartphone').length, icon: Smartphone, color: 'text-orange-500' },
    { name: 'Printers', count: assets.filter(a => a?.device_type === 'printer').length, icon: Printer, color: 'text-red-500' }
  ];

  // Most used devices (frequently accessed)
  const mostUsedDevices = assets.slice(0, 3).map(asset => ({
    ...asset,
    icon: asset.device_type === 'server' ? Server : 
          asset.device_type === 'router' ? Router :
          asset.device_type === 'printer' ? Printer : Network,
    status: 'online',
    lastSeen: '2 minutes ago'
  }));

  // Weather widget data (simulated)
  const weatherData = {
    condition: 'Sunny',
    temperature: 32,
    icon: '☀️',
    location: 'Data Center'
  };

  // Calculate system status based on actual data
  const getSystemStatus = () => {
    const status = [];
    
    // Database status (always healthy if we can fetch data)
    status.push({
      name: 'Database',
      status: 'Healthy',
      color: 'bg-success',
      badgeColor: 'badge-success',
      details: 'Connected and responsive'
    });
    
    // API Gateway status
    status.push({
      name: 'API Gateway',
      status: 'Online',
      color: 'bg-success',
      badgeColor: 'badge-success',
      details: 'All endpoints responding'
    });
    
    // Scanner status based on actual scanner health
    if (loadingScanners) {
      status.push({
        name: 'Scanner Service',
        status: 'Checking...',
        color: 'bg-warning',
        badgeColor: 'badge-warning',
        details: 'Verifying scanner health'
      });
    } else if (scannerHealth.length === 0) {
      status.push({
        name: 'Scanner Service',
        status: 'No Scanners',
        color: 'bg-error',
        badgeColor: 'badge-error',
        details: 'No scanner configurations found'
      });
    } else {
      const healthyScanners = scannerHealth.filter(s => s.status === 'healthy').length;
      const totalScanners = scannerHealth.length;
      const hasDefaultScanner = scannerHealth.some(s => s.scanner_id === 'default');
      
      if (healthyScanners === totalScanners) {
        const statusText = hasDefaultScanner && totalScanners === 1 ? 'Default Online' : 'All Healthy';
        status.push({
          name: 'Scanner Service',
          status: statusText,
          color: 'bg-success',
          badgeColor: 'badge-success',
          details: hasDefaultScanner && totalScanners === 1 
            ? 'Default scanner is online and healthy'
            : `${healthyScanners}/${totalScanners} scanners online`
        });
      } else if (healthyScanners > 0) {
        status.push({
          name: 'Scanner Service',
          status: 'Partial',
          color: 'bg-warning',
          badgeColor: 'badge-warning',
          details: `${healthyScanners}/${totalScanners} scanners online`
        });
      } else {
        status.push({
          name: 'Scanner Service',
          status: 'Offline',
          color: 'bg-error',
          badgeColor: 'badge-error',
          details: 'All scanners unreachable'
        });
      }
    }
    
    // Scan Engine status
    status.push({
      name: 'Scan Engine',
      status: activeScanTask ? 'Active' : 'Ready',
      color: activeScanTask ? 'bg-info' : 'bg-success',
      badgeColor: activeScanTask ? 'badge-info' : 'badge-success',
      details: activeScanTask ? `Scanning: ${activeScanTask.name}` : 'Ready for new scans'
    });
    
    return status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Modern Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Welcome {user?.username || 'User'}</h1>
                <p className="text-slate-400 text-sm">Network Discovery & Asset Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search for device..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-yellow-500/20"
                />
              </div>
              <button className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                <Mic className="w-5 h-5 text-slate-300" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-slate-900 font-bold text-sm">U</span>
                </div>
                <span className="text-slate-300 text-sm">uiamjad</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Devices Section */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Devices ({totalAssets})</h2>
              <p className="text-slate-400 text-sm">Manage your network assets</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold px-4 py-2 rounded-lg">
                <Plus className="w-4 h-4 mr-2" />
                Add new
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Edit
              </Button>
            </div>
          </div>

          {/* Device Categories */}
          <div className="flex space-x-2 mb-6">
            {deviceCategories.map((category, index) => (
              <button
                key={index}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  index === 0 
                    ? "bg-yellow-500 text-slate-900" 
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Device Control Card */}
          {assets.length > 0 && (
            <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Network Infrastructure</h3>
                  <p className="text-slate-400">Primary Router • 12.5 kW</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-500">22.5°C</div>
                  <div className="text-sm text-slate-400">Optimal</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-slate-600 flex items-center justify-center">
                    <div className="text-3xl font-bold text-white">22.5°</div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-slate-900 text-xs">°C</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4 mb-6">
                <button className="w-12 h-12 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center transition-colors">
                  <Power className="w-5 h-5 text-white" />
                </button>
                <button className="w-12 h-12 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors">
                  <Snowflake className="w-5 h-5 text-slate-900" />
                </button>
                <button className="w-12 h-12 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center transition-colors">
                  <Fan className="w-5 h-5 text-white" />
                </button>
                <button className="w-12 h-12 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center transition-colors">
                  <Droplets className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex justify-between text-xs text-slate-400">
                <span>05°C</span>
                <span>32°C</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Map Section */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Live Map</h2>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Stop sharing
            </Button>
          </div>
          <div className="bg-slate-900/50 rounded-xl h-64 flex items-center justify-center border border-slate-600">
            <div className="text-center">
              <Globe className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Geographic device distribution</p>
              <p className="text-slate-500 text-sm">Map view coming soon</p>
            </div>
          </div>
        </div>

        {/* Most Used Devices */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Most Used ({mostUsedDevices.length})</h2>
            <button className="text-yellow-500 hover:text-yellow-400 text-sm font-medium">
              See all
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {mostUsedDevices.map((device, index) => (
              <div key={index} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 relative">
                <div className="flex items-center justify-between mb-2">
                  <device.icon className="w-6 h-6 text-slate-300" />
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <h3 className="text-white font-medium text-sm">{device.name || 'Device'}</h3>
                <p className="text-slate-400 text-xs">{device.lastSeen}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Widgets Section */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Widgets (01)</h2>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Add new
            </Button>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">☀️</span>
                  <span className="text-3xl font-bold">{weatherData.temperature}°</span>
                </div>
                <p className="font-semibold">{weatherData.condition} Weather</p>
                <p className="text-sm opacity-80">{weatherData.location}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-lg hover:bg-slate-900/20 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-900/20 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
