import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { HelpIcon } from './ui';
import { cn } from '../utils/cn';

const ScanStatus = () => {
  const [activeScans, setActiveScans] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadScanData();
    
    // Set up periodic refresh (every 5 seconds)
    const interval = setInterval(loadScanData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadScanData = async () => {
    try {
      setLoading(true);
      const [activeResponse, historyResponse] = await Promise.all([
        fetch('/api/v2/scan-tasks/active', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/v2/scan-tasks?limit=50', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        setActiveScans(activeData ? [activeData] : []);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setScanHistory(historyData || []);
      }
    } catch (error) {
      console.error('Failed to load scan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScan = async (scanId) => {
    try {
      const response = await fetch(`/api/v2/scan-tasks/${scanId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        loadScanData(); // Refresh data
      } else {
        const error = await response.json();
        alert('Failed to cancel scan: ' + (error.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to cancel scan:', error);
      alert('Failed to cancel scan: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20',
      'running': 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
      'completed': 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
      'failed': 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
      'cancelled': 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20'
    };
    return colors[status] || 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'running': '🔄',
      'completed': '✅',
      'failed': '❌',
      'cancelled': '⏹️'
    };
    return icons[status] || '❓';
  };

  const filteredHistory = scanHistory.filter(scan => {
    const matchesSearch = !searchTerm || 
      scan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.target.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || scan.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            Scan Status & History
            <HelpIcon 
              content="Monitor active scans and view scan history. Active scans are tracked globally and persist across page navigation."
              className="ml-2"
            />
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track running scans and view historical scan results
          </p>
        </div>
        <Button onClick={loadScanData} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Active Scans */}
      {activeScans.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
              <span className="mr-2">🔄</span>
              Active Scans ({activeScans.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeScans.map((scan) => (
                <div key={scan.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl animate-spin">🔄</div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {scan.name}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          Target: <span className="font-mono">{scan.target}</span>
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                          Started: {new Date(scan.start_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(scan.status)}>
                        {scan.status}
                      </Badge>
                      <Button
                        variant="outline"
                        onClick={() => handleCancelScan(scan.id)}
                        className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800"
                      >
                        Cancel Scan
                      </Button>
                    </div>
                  </div>
                  {scan.progress > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <span>Progress</span>
                        <span>{scan.progress}%</span>
                      </div>
                      <Progress value={scan.progress} className="h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">📊</span>
              Scan History ({filteredHistory.length})
            </CardTitle>
            <div className="flex space-x-3">
              <Input
                placeholder="Search scans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">📊</div>
              <p>No scan history found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getStatusIcon(scan.status)}</div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        {scan.name}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Target: {scan.target} • Type: {scan.scan_type}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {new Date(scan.start_time).toLocaleString()}
                        {scan.end_time && ` - ${new Date(scan.end_time).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(scan.status)}>
                      {scan.status}
                    </Badge>
                    {scan.progress > 0 && (
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {scan.progress}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanStatus;
