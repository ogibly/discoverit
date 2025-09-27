import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { cn } from '../../utils/cn';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  Users, 
  Server, 
  Network,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Building,
  Zap,
  Target,
  X
} from 'lucide-react';

const AnalyticsDashboard = ({ onClose }) => {
  const { api } = useApp();
  
  const [dashboardData, setDashboardData] = useState({
    asset_metrics: { total_assets: 0, active_assets: 0, managed_assets: 0, asset_types: [], locations: [] },
    scan_metrics: { total_scans: 0, successful_scans: 0, failed_scans: 0, avg_duration: 0 },
    user_metrics: { total_users: 0, active_users: 0, admin_users: 0 },
    security_metrics: { vulnerabilities: 0, compliance_score: 0, security_incidents: 0 },
    performance_metrics: { avg_response_time: 0, uptime: 0, error_rate: 0 },
    compliance_metrics: { total_rules: 0, passed_checks: 0, failed_checks: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/dashboard');
      setDashboardData(response.data || {
        asset_metrics: { total_assets: 0, active_assets: 0, managed_assets: 0, asset_types: [], locations: [] },
        scan_metrics: { total_scans: 0, successful_scans: 0, failed_scans: 0, avg_duration: 0 },
        user_metrics: { total_users: 0, active_users: 0, admin_users: 0 },
        security_metrics: { vulnerabilities: 0, compliance_score: 0, security_incidents: 0 },
        performance_metrics: { avg_response_time: 0, uptime: 0, error_rate: 0 },
        compliance_metrics: { total_rules: 0, passed_checks: 0, failed_checks: 0 }
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Keep default data on error
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    setGeneratingReport(true);
    try {
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const response = await api.post('/analytics/reports', {
        report_type: reportType,
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString()
      });
      
      setReportData(response.data);
      setSelectedReport(reportType);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const getPeriodLabel = (period) => {
    const labels = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days'
    };
    return labels[period] || period;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getMetricIcon = (metric) => {
    const icons = {
      assets: Server,
      scans: Target,
      users: Users,
      security: Shield,
      performance: Zap,
      compliance: CheckCircle
    };
    return icons[metric] || Activity;
  };

  const getMetricColor = (metric) => {
    const colors = {
      assets: 'text-blue-500',
      scans: 'text-green-500',
      users: 'text-purple-500',
      security: 'text-red-500',
      performance: 'text-yellow-500',
      compliance: 'text-indigo-500'
    };
    return colors[metric] || 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-8">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-white">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-6 h-6" />
                <span>Enterprise Analytics Dashboard</span>
              </h2>
              <p className="text-slate-400 mt-1">
                Comprehensive insights into your network infrastructure
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Metrics Overview */}
          <div className="w-2/3 border-r border-slate-800 p-6 overflow-y-auto">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {dashboardData && Object.entries(dashboardData).map(([metric, data]) => {
                const Icon = getMetricIcon(metric);
                const color = getMetricColor(metric);
                
                return (
                  <Card key={metric} className="border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Icon className={cn("w-5 h-5", color)} />
                            <span className="text-sm font-medium text-slate-300 capitalize">
                              {metric.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {Object.entries(data).slice(0, 3).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-slate-400 capitalize">
                                  {key.replace('_', ' ')}
                                </span>
                                <span className="text-white font-medium">
                                  {typeof value === 'number' ? formatNumber(value) : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Charts and Visualizations */}
            <div className="grid grid-cols-2 gap-6">
              {/* Asset Distribution */}
              <Card className="border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Server className="w-5 h-5" />
                    <span>Asset Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.asset_metrics?.asset_types && (
                    <div className="space-y-3">
                      {Object.entries(dashboardData.asset_metrics.asset_types).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm text-slate-300 capitalize">{type}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ 
                                  width: `${(count / Math.max(...Object.values(dashboardData.asset_metrics.asset_types))) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-white w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scan Performance */}
              <Card className="border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Scan Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.scan_metrics && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Success Rate</span>
                          <span className="text-white">
                            {dashboardData.scan_metrics.success_rate?.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={dashboardData.scan_metrics.success_rate || 0} 
                          className="h-2" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-slate-400">Total Scans</div>
                          <div className="text-white font-medium">
                            {formatNumber(dashboardData.scan_metrics.total_scans)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Avg Duration</div>
                          <div className="text-white font-medium">
                            {dashboardData.scan_metrics.average_duration?.toFixed(1)}s
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Overview */}
              <Card className="border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Security Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.security_metrics && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Security Score</span>
                          <span className="text-white">
                            {dashboardData.security_metrics.security_score?.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={dashboardData.security_metrics.security_score || 0} 
                          className="h-2" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-slate-400">Failed Events</div>
                          <div className="text-red-400 font-medium">
                            {formatNumber(dashboardData.security_metrics.failed_events)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Failed Logins</div>
                          <div className="text-red-400 font-medium">
                            {formatNumber(dashboardData.security_metrics.failed_logins)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.performance_metrics && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Performance Score</span>
                          <span className="text-white">
                            {dashboardData.performance_metrics.performance_score?.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={dashboardData.performance_metrics.performance_score || 0} 
                          className="h-2" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-slate-400">Avg Latency</div>
                          <div className="text-white font-medium">
                            {dashboardData.performance_metrics.average_latency?.toFixed(1)}ms
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Healthy Assets</div>
                          <div className="text-green-400 font-medium">
                            {formatNumber(dashboardData.performance_metrics.healthy_assets)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Panel - Reports */}
          <div className="w-1/3 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Report Generation */}
              <Card className="border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>Generate Reports</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => generateReport('asset_summary')}
                      disabled={generatingReport}
                      className="w-full justify-start"
                    >
                      <Server className="w-4 h-4 mr-2" />
                      Asset Summary Report
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => generateReport('scan_performance')}
                      disabled={generatingReport}
                      className="w-full justify-start"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Scan Performance Report
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => generateReport('security_audit')}
                      disabled={generatingReport}
                      className="w-full justify-start"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Security Audit Report
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => generateReport('compliance')}
                      disabled={generatingReport}
                      className="w-full justify-start"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Compliance Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Report Results */}
              {reportData && (
                <Card className="border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Report Results</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Report Type</span>
                        <Badge variant="outline" className="capitalize">
                          {reportData.report_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Period</span>
                        <span className="text-sm text-white">
                          {getPeriodLabel(selectedPeriod)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Generated</span>
                        <span className="text-sm text-white">
                          {new Date(reportData.generated_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-700">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            // Download report logic
                            const blob = new Blob([JSON.stringify(reportData, null, 2)], {
                              type: 'application/json'
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${reportData.report_type}_${new Date().toISOString().split('T')[0]}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card className="border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Quick Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Total Assets</span>
                      <span className="text-white font-medium">
                        {formatNumber(dashboardData?.asset_metrics?.total_assets || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Active Scans</span>
                      <span className="text-white font-medium">
                        {dashboardData?.scan_metrics?.running_scans || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Active Users</span>
                      <span className="text-white font-medium">
                        {dashboardData?.user_metrics?.active_users || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Compliance Rate</span>
                      <span className="text-white font-medium">
                        {dashboardData?.compliance_metrics?.compliance_rate?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
