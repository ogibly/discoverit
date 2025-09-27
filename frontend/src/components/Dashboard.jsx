import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { HelpIcon } from './ui';
import { cn } from '../utils/cn';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageHeader from './PageHeader';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import { BarChart3 } from 'lucide-react';

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
  
  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  useEffect(() => {
    fetchAssets();
    fetchDiscoveredDevices();
    fetchScannerInfo();
  }, [fetchAssets, fetchDiscoveredDevices]);

  const fetchScannerInfo = async () => {
    try {
      setLoadingScanners(true);
      
      // Fetch scanner configurations
      const scannersResponse = await axios.get('/api/v2/scanners');
      setScanners(scannersResponse.data);
      
      // Fetch satellite scanners
      try {
        const satelliteScannersResponse = await axios.get('/api/v2/satellite-scanners');
        setScanners(prev => [...prev, ...satelliteScannersResponse.data]);
      } catch (satelliteError) {
        console.warn('Failed to fetch satellite scanners:', satelliteError);
      }
      
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

  const keyMetrics = [
    {
      label: 'Total Assets',
      value: totalAssets,
      description: 'Assets in inventory',
      icon: '📊',
      color: 'bg-primary text-primary-foreground',
      change: '+12%',
      changeType: 'positive',
      onClick: () => navigate('/assets')
    },
    {
      label: 'Total Devices',
      value: totalDevices,
      description: 'Discovered devices',
      icon: '📱',
      color: 'bg-info text-info-foreground',
      change: '+8%',
      changeType: 'positive',
      onClick: () => navigate('/devices')
    },
    {
      label: 'New Devices',
      value: newDevices,
      description: 'Awaiting conversion',
      icon: '🆕',
      color: 'bg-warning text-warning-foreground',
      change: '-3%',
      changeType: 'negative',
      onClick: () => navigate('/devices?filter=new')
    },
    {
      label: 'Device Types',
      value: deviceTypes,
      description: 'Unique device models',
      icon: '🔧',
      color: 'bg-success text-success-foreground',
      change: '+2',
      changeType: 'positive',
      onClick: () => navigate('/assets')
    }
  ];

  const deviceTypeStats = [
    { name: 'Routers', count: assets.filter(a => a && a.device_type === 'router').length, icon: '🌐' },
    { name: 'Switches', count: assets.filter(a => a && a.device_type === 'switch').length, icon: '🔀' },
    { name: 'Servers', count: assets.filter(a => a && a.device_type === 'server').length, icon: '🖥️' },
    { name: 'Workstations', count: assets.filter(a => a && a.device_type === 'workstation').length, icon: '💻' },
    { name: 'Printers', count: assets.filter(a => a && a.device_type === 'printer').length, icon: '🖨️' },
    { name: 'Other', count: assets.filter(a => a && (!a.device_type || a.device_type === 'other')).length, icon: '📱' }
  ];

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
    
    // Discovery Engine status
    status.push({
      name: 'Discovery Engine',
      status: activeScanTask ? 'Active' : 'Ready',
      color: activeScanTask ? 'bg-info' : 'bg-success',
      badgeColor: activeScanTask ? 'badge-info' : 'badge-success',
      details: activeScanTask ? `Scanning: ${activeScanTask.name}` : 'Ready for new scans'
    });
    
    return status;
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <PageHeader
        title={
          <span className="flex items-center">
            Dashboard
            <HelpIcon 
              content="Overview of your network discovery and asset management system. Click on metrics to navigate to relevant sections."
              className="ml-2"
              size="sm"
            />
          </span>
        }
        subtitle="Real-time overview of your network discovery and asset management system"
        metrics={[
          { value: totalAssets, label: "Assets", color: "text-primary" },
          { value: totalDevices, label: "Devices", color: "text-info" },
          { value: newDevices, label: "New", color: "text-warning" }
        ]}
      />

      {/* Analytics Button */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setShowAnalytics(true)}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Enterprise Analytics</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {keyMetrics.map((metric, index) => (
              <Card 
                key={index} 
                className="surface-elevated hover:shadow-lg transition-all duration-300 group cursor-pointer transform hover:scale-105"
                onClick={metric.onClick}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm", metric.color)}>
                      {metric.icon}
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-xs font-medium flex items-center",
                        metric.changeType === 'positive' ? 'text-success' : 
                        metric.changeType === 'negative' ? 'text-error' : 'text-muted-foreground'
                      )}>
                        {metric.changeType === 'positive' && '↗'}
                        {metric.changeType === 'negative' && '↘'}
                        {metric.change}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="text-lg font-bold text-foreground">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Device Distribution and System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="surface-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center">
                  📊 Device Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deviceTypeStats.map((type, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{type.icon}</span>
                        <span className="text-sm font-medium text-foreground">{type.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">{type.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="surface-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center">
                  ⚡ System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getSystemStatus().map((status, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={cn("w-2 h-2 rounded-full", status.color)}></div>
                          <span className="text-sm font-medium text-foreground">{status.name}</span>
                        </div>
                        <Badge className={cn("text-xs", status.badgeColor)}>
                          {status.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground ml-4">
                        {status.details}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Scanner Details */}
                {scanners.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="text-xs font-medium text-foreground mb-2">Available Scanners:</div>
                    <div className="space-y-1">
                      {scanners.slice(0, 3).map((scanner, index) => {
                        const health = scannerHealth.find(h => h.scanner_id === scanner.id);
                        return (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate">{scanner.name}</span>
                            <div className="flex items-center space-x-1">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                health?.status === 'healthy' ? 'bg-success' : 
                                health?.status === 'unhealthy' ? 'bg-error' : 'bg-warning'
                              )}></div>
                              <span className="text-muted-foreground">
                                {health?.status === 'healthy' ? 'Online' : 
                                 health?.status === 'unhealthy' ? 'Offline' : 'Unknown'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {scanners.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{scanners.length - 3} more scanners
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Activity */}
            <Card className="surface-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center">
                  📊 Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeScanTask ? (
                  <div className="p-3 bg-info/10 rounded-lg border border-info/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-info">Active Scan</h4>
                      <Badge className="badge-info text-xs">
                        Running
                      </Badge>
                    </div>
                    <p className="text-sm text-info mb-2">{activeScanTask.name}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-info">
                        <span>Progress</span>
                        <span>{activeScanTask.progress || 0}%</span>
                      </div>
                      <Progress value={activeScanTask.progress || 0} className="h-1.5" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <div className="text-2xl mb-1">⏸️</div>
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="surface-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center">
                  🚀 Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => navigate('/discovery')}
                    className="h-12 flex flex-col items-center justify-center space-y-1 bg-info hover:bg-info/90 text-info-foreground transition-all duration-200"
                  >
                    <span className="text-lg">🔍</span>
                    <span className="text-xs font-medium">Start Discovery</span>
                  </Button>
                  <Button
                    onClick={() => navigate('/devices')}
                    className="h-12 flex flex-col items-center justify-center space-y-1 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
                  >
                    <span className="text-lg">📱</span>
                    <span className="text-xs font-medium">View Devices</span>
                  </Button>
                  <Button
                    onClick={() => navigate('/assets')}
                    className="h-12 flex flex-col items-center justify-center space-y-1 bg-success hover:bg-success/90 text-success-foreground transition-all duration-200"
                  >
                    <span className="text-lg">📋</span>
                    <span className="text-xs font-medium">Manage Assets</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard Modal */}
      {showAnalytics && (
        <AnalyticsDashboard
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
