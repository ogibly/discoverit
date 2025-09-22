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
  
  useEffect(() => {
    fetchAssets();
    fetchDiscoveredDevices();
  }, [fetchAssets, fetchDiscoveredDevices]);

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

  const systemStatus = [
    { name: 'Scanner Service', status: 'Online', color: 'bg-success', badgeColor: 'badge-success' },
    { name: 'Database', status: 'Healthy', color: 'bg-success', badgeColor: 'badge-success' },
    { name: 'API Gateway', status: 'Online', color: 'bg-success', badgeColor: 'badge-success' },
    { name: 'Discovery Engine', status: 'Ready', color: 'bg-info', badgeColor: 'badge-info' }
  ];

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              Dashboard
              <HelpIcon 
                content="Overview of your network discovery and asset management system. Click on metrics to navigate to relevant sections."
                className="ml-2"
                size="sm"
              />
            </h1>
            <p className="text-body text-muted-foreground mt-1">
              Real-time overview of your network discovery and asset management system
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalAssets}</div>
              <div className="text-caption text-muted-foreground">Total Assets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">{totalDevices}</div>
              <div className="text-caption text-muted-foreground">Total Devices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{newDevices}</div>
              <div className="text-caption text-muted-foreground">New Devices</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
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
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", metric.color)}>
                      {metric.icon}
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-sm font-medium flex items-center",
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
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Network Health Overview */}
          <Card className="surface-elevated">
            <CardHeader className="pb-4">
              <CardTitle className="text-subheading text-foreground flex items-center">
                🌐 Network Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-info/10 rounded-lg">
                  <div className="text-2xl font-bold text-info">98%</div>
                  <div className="text-body text-info">Uptime</div>
                </div>
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <div className="text-2xl font-bold text-success">24ms</div>
                  <div className="text-body text-success">Avg Response</div>
                </div>
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <div className="text-2xl font-bold text-warning">2</div>
                  <div className="text-body text-warning">Issues</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="surface-elevated">
              <CardHeader className="pb-4">
                <CardTitle className="text-subheading text-foreground flex items-center">
                  📊 Device Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deviceTypeStats.map((type, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{type.icon}</span>
                        <span className="text-body font-medium text-foreground">{type.name}</span>
                      </div>
                      <span className="text-body font-semibold text-muted-foreground">{type.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="surface-elevated">
              <CardHeader className="pb-4">
                <CardTitle className="text-subheading text-foreground flex items-center">
                  ⚡ System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemStatus.map((status, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn("w-3 h-3 rounded-full", status.color)}></div>
                        <span className="text-body font-medium text-foreground">{status.name}</span>
                      </div>
                      <Badge className={cn("text-xs", status.badgeColor)}>
                        {status.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Operations */}
          <Card className="surface-elevated">
            <CardHeader className="pb-4">
              <CardTitle className="text-subheading text-foreground flex items-center">
                🔄 Active Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeScanTask ? (
                <div className="space-y-4">
                  <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-body font-semibold text-info">Active Scan</h4>
                      <Badge className="badge-info">
                        Running
                      </Badge>
                    </div>
                    <p className="text-body text-info mb-3">{activeScanTask.name}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-caption text-info">
                        <span>Progress</span>
                        <span>{activeScanTask.progress || 0}%</span>
                      </div>
                      <Progress value={activeScanTask.progress || 0} className="h-2" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">⏸️</div>
                  <p className="text-body">No active operations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="surface-elevated">
            <CardHeader className="pb-4">
              <CardTitle className="text-subheading text-foreground flex items-center">
                🚀 Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button
                  onClick={() => navigate('/discovery')}
                  className="h-16 flex flex-col items-center justify-center space-y-1 bg-info hover:bg-info/90 text-info-foreground transition-all duration-200"
                >
                  <span className="text-xl">🔍</span>
                  <span className="text-sm font-medium">Start Discovery</span>
                </Button>
                <Button
                  onClick={() => navigate('/devices')}
                  className="h-16 flex flex-col items-center justify-center space-y-1 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
                >
                  <span className="text-xl">📱</span>
                  <span className="text-sm font-medium">View Devices</span>
                </Button>
                <Button
                  onClick={() => navigate('/assets')}
                  className="h-16 flex flex-col items-center justify-center space-y-1 bg-success hover:bg-success/90 text-success-foreground transition-all duration-200"
                >
                  <span className="text-xl">📋</span>
                  <span className="text-sm font-medium">Manage Assets</span>
                </Button>
                <Button
                  onClick={() => navigate('/admin-settings?tab=operations')}
                  className="h-16 flex flex-col items-center justify-center space-y-1 bg-warning hover:bg-warning/90 text-warning-foreground transition-all duration-200"
                >
                  <span className="text-xl">⚙️</span>
                  <span className="text-sm font-medium">Operations</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
