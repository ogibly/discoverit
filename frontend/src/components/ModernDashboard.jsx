/**
 * Modern Enterprise Dashboard Component
 * Based on reference images analysis for state-of-the-art UI/UX
 * Aligned with Network State, Inventory, and Asset Management workflow
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';
import { 
  ModernCard,
  ModernKPICard,
  ModernButton,
  ModernBadge,
  ModernProgress,
  ModernTable,
  ModernTableHeader,
  ModernTableBody,
  ModernTableRow,
  ModernTableCell,
  ModernTableHeaderCell,
  ModernLoadingSpinner,
  ModernEmptyState
} from '../design-system/ModernComponentLibrary';
import {
  Network,
  Server,
  HardDrive,
  Cpu,
  Monitor,
  Router,
  Smartphone,
  Printer,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Map,
  Users,
  Shield,
  Zap,
  Database,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Eye,
  Settings,
  MoreHorizontal
} from 'lucide-react';

const ModernDashboard = () => {
  const {
    assets,
    discoveredDevices,
    activeScanTask,
    fetchAssets,
    fetchDiscoveredDevices
  } = useApp();
  
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, map
  
  // Mock data for demonstration
  const [dashboardData, setDashboardData] = useState({
    networkStats: {
      totalDevices: 1247,
      onlineDevices: 1156,
      offlineDevices: 91,
      newDevices: 23
    },
    assetStats: {
      totalAssets: 2847,
      managedAssets: 2156,
      unmanagedAssets: 691,
      criticalAssets: 45
    },
    automationStats: {
      activeJobs: 12,
      completedJobs: 1847,
      failedJobs: 23,
      scheduledJobs: 8
    },
    performanceMetrics: {
      networkLatency: 12.5,
      cpuUsage: 68.2,
      memoryUsage: 45.8,
      diskUsage: 72.1
    }
  });

  // Recent activities
  const [recentActivities] = useState([
    {
      id: 1,
      type: 'discovery',
      message: 'New device discovered: Router-192.168.1.1',
      timestamp: '2 minutes ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'automation',
      message: 'Backup job completed for Server-01',
      timestamp: '15 minutes ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'alert',
      message: 'High CPU usage detected on Server-03',
      timestamp: '1 hour ago',
      status: 'warning'
    },
    {
      id: 4,
      type: 'asset',
      message: 'Asset inventory updated: 15 new devices',
      timestamp: '2 hours ago',
      status: 'info'
    }
  ]);

  // Top devices by activity
  const [topDevices] = useState([
    { name: 'Router-01', ip: '192.168.1.1', type: 'Router', activity: 95, status: 'online' },
    { name: 'Server-01', ip: '192.168.1.10', type: 'Server', activity: 87, status: 'online' },
    { name: 'Switch-01', ip: '192.168.1.2', type: 'Switch', activity: 82, status: 'online' },
    { name: 'Printer-01', ip: '192.168.1.50', type: 'Printer', activity: 45, status: 'online' },
    { name: 'Workstation-01', ip: '192.168.1.100', type: 'Workstation', activity: 38, status: 'offline' }
  ]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAssets(),
          fetchDiscoveredDevices()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchAssets, fetchDiscoveredDevices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ModernLoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      {/* Header */}
      <div className="bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                Network Dashboard
              </h1>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Monitor your network infrastructure and manage assets
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search devices, assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              {/* Time Range Selector */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              
              {/* View Mode Toggle */}
              <div className="flex border border-secondary-300 dark:border-secondary-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'px-3 py-2 text-sm font-medium transition-all duration-200',
                    viewMode === 'grid'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                  )}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'px-3 py-2 text-sm font-medium transition-all duration-200',
                    viewMode === 'list'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                  )}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={cn(
                    'px-3 py-2 text-sm font-medium transition-all duration-200',
                    viewMode === 'map'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                  )}
                >
                  Map
                </button>
              </div>
              
              {/* Refresh Button */}
              <ModernButton variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </ModernButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModernKPICard
            title="Total Devices"
            value={dashboardData.networkStats.totalDevices.toLocaleString()}
            change="+23 new devices"
            changeType="positive"
            trend="up"
            icon={<Network className="w-6 h-6 text-primary-600" />}
          />
          
          <ModernKPICard
            title="Online Devices"
            value={dashboardData.networkStats.onlineDevices.toLocaleString()}
            change={`${Math.round((dashboardData.networkStats.onlineDevices / dashboardData.networkStats.totalDevices) * 100)}% uptime`}
            changeType="positive"
            trend="up"
            icon={<CheckCircle2 className="w-6 h-6 text-success-600" />}
          />
          
          <ModernKPICard
            title="Managed Assets"
            value={dashboardData.assetStats.managedAssets.toLocaleString()}
            change={`${Math.round((dashboardData.assetStats.managedAssets / dashboardData.assetStats.totalAssets) * 100)}% managed`}
            changeType="positive"
            trend="up"
            icon={<Database className="w-6 h-6 text-info-600" />}
          />
          
          <ModernKPICard
            title="Active Jobs"
            value={dashboardData.automationStats.activeJobs}
            change={`${dashboardData.automationStats.completedJobs} completed`}
            changeType="neutral"
            trend="stable"
            icon={<Activity className="w-6 h-6 text-warning-600" />}
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Network Performance Chart */}
          <ModernCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Network Performance
              </h3>
              <ModernBadge variant="info">Live</ModernBadge>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600 dark:text-secondary-400">Network Latency</span>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {dashboardData.performanceMetrics.networkLatency}ms
                </span>
              </div>
              <ModernProgress 
                value={dashboardData.performanceMetrics.networkLatency} 
                max={100} 
                variant="info"
                showLabel={false}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600 dark:text-secondary-400">CPU Usage</span>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {dashboardData.performanceMetrics.cpuUsage}%
                </span>
              </div>
              <ModernProgress 
                value={dashboardData.performanceMetrics.cpuUsage} 
                max={100} 
                variant={dashboardData.performanceMetrics.cpuUsage > 80 ? 'error' : 'warning'}
                showLabel={false}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600 dark:text-secondary-400">Memory Usage</span>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {dashboardData.performanceMetrics.memoryUsage}%
                </span>
              </div>
              <ModernProgress 
                value={dashboardData.performanceMetrics.memoryUsage} 
                max={100} 
                variant={dashboardData.performanceMetrics.memoryUsage > 80 ? 'error' : 'success'}
                showLabel={false}
              />
            </div>
          </ModernCard>

          {/* Recent Activities */}
          <ModernCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Recent Activities
              </h3>
              <ModernButton variant="ghost" size="sm">
                View All
              </ModernButton>
            </div>
            
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full mt-2',
                    activity.status === 'success' && 'bg-success-500',
                    activity.status === 'warning' && 'bg-warning-500',
                    activity.status === 'error' && 'bg-error-500',
                    activity.status === 'info' && 'bg-info-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary-900 dark:text-secondary-100">
                      {activity.message}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ModernCard>
        </div>

        {/* Top Devices Table */}
        <ModernCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Top Devices by Activity
            </h3>
            <ModernButton variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </ModernButton>
          </div>
          
          <ModernTable>
            <ModernTableHeader>
              <ModernTableRow>
                <ModernTableHeaderCell>Device</ModernTableHeaderCell>
                <ModernTableHeaderCell>IP Address</ModernTableHeaderCell>
                <ModernTableHeaderCell>Type</ModernTableHeaderCell>
                <ModernTableHeaderCell>Activity</ModernTableHeaderCell>
                <ModernTableHeaderCell>Status</ModernTableHeaderCell>
                <ModernTableHeaderCell>Actions</ModernTableHeaderCell>
              </ModernTableRow>
            </ModernTableHeader>
            <ModernTableBody>
              {topDevices.map((device, index) => (
                <ModernTableRow key={index}>
                  <ModernTableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-secondary-100 dark:bg-secondary-800 rounded-lg flex items-center justify-center">
                        <Server className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {device.name}
                        </div>
                      </div>
                    </div>
                  </ModernTableCell>
                  <ModernTableCell>
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      {device.ip}
                    </span>
                  </ModernTableCell>
                  <ModernTableCell>
                    <ModernBadge variant="default">
                      {device.type}
                    </ModernBadge>
                  </ModernTableCell>
                  <ModernTableCell>
                    <div className="flex items-center space-x-2">
                      <ModernProgress 
                        value={device.activity} 
                        max={100} 
                        size="sm"
                        variant={device.activity > 80 ? 'success' : device.activity > 50 ? 'warning' : 'error'}
                        showLabel={false}
                        className="flex-1"
                      />
                      <span className="text-sm text-secondary-600 dark:text-secondary-400">
                        {device.activity}%
                      </span>
                    </div>
                  </ModernTableCell>
                  <ModernTableCell>
                    <ModernBadge 
                      variant={device.status === 'online' ? 'success' : 'error'}
                    >
                      {device.status}
                    </ModernBadge>
                  </ModernTableCell>
                  <ModernTableCell>
                    <div className="flex items-center space-x-2">
                      <ModernButton variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </ModernButton>
                      <ModernButton variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </ModernButton>
                      <ModernButton variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </ModernButton>
                    </div>
                  </ModernTableCell>
                </ModernTableRow>
              ))}
            </ModernTableBody>
          </ModernTable>
        </ModernCard>
      </div>
    </div>
  );
};

export default ModernDashboard;
