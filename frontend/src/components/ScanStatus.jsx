import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { HelpIcon } from './ui';
import { cn } from '../utils/cn';

const ScanStatus = () => {
  const { 
    scanTasks, 
    activeScanTask, 
    fetchScanTasks, 
    fetchActiveScanTask, 
    cancelScanTask 
  } = useApp();
  
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
      await Promise.all([
        fetchActiveScanTask(),
        fetchScanTasks()
      ]);
    } catch (error) {
      console.error('Error loading scan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScan = async (scanId) => {
    try {
      await cancelScanTask(scanId);
      loadScanData();
    } catch (error) {
      console.error('Error canceling scan:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'running': { color: 'bg-blue-900 text-blue-200', text: 'Running' },
      'completed': { color: 'bg-green-900 text-green-200', text: 'Completed' },
      'failed': { color: 'bg-red-900 text-red-200', text: 'Failed' },
      'cancelled': { color: 'bg-gray-900 text-gray-200', text: 'Cancelled' },
      'pending': { color: 'bg-yellow-900 text-yellow-200', text: 'Pending' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end - start) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  const filteredScans = scanTasks.filter(scan => {
    const matchesSearch = scan.target?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.scan_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || scan.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeScans = activeScanTask ? [activeScanTask] : [];

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">
              Scan Status & History
            </h1>
            <p className="text-sm text-slate-400">
              Monitor active scans and view scan history
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <HelpIcon 
              content="View active scans and scan history. Active scans are automatically refreshed every 5 seconds."
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search scans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Active Scans */}
        {activeScans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Active Scans</span>
                <Badge className="bg-blue-900 text-blue-200">
                  {activeScans.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeScans.map((scan) => (
                <div key={scan.id} className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-100">{scan.target}</h3>
                      <p className="text-sm text-slate-400">
                        {scan.scan_type} • Started {new Date(scan.start_time).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(scan.status)}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelScan(scan.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                  
                  {scan.progress !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>Progress: {scan.progress}%</span>
                        <span>
                          {scan.completed_ips || 0} / {scan.total_ips || 0} IPs
                        </span>
                      </div>
                      <Progress value={scan.progress} className="h-2" />
                      {scan.current_ip && (
                        <p className="text-xs text-slate-500">
                          Currently scanning: {scan.current_ip}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-3 text-sm text-slate-400">
                    Duration: {formatDuration(scan.start_time, scan.end_time)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Scan History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Scan History</span>
              <Badge className="bg-slate-700 text-slate-200">
                {filteredScans.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-slate-400">Loading...</span>
              </div>
            ) : filteredScans.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-slate-100 mb-2">
                  No scans found
                </h3>
                <p className="text-slate-400">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No scans have been run yet. Start a scan from the Discovery page.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredScans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-slate-100">{scan.target}</h3>
                        {getStatusBadge(scan.status)}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        <span>{scan.scan_type}</span>
                        <span className="mx-2">•</span>
                        <span>Started: {new Date(scan.start_time).toLocaleString()}</span>
                        {scan.end_time && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Duration: {formatDuration(scan.start_time, scan.end_time)}</span>
                          </>
                        )}
                      </div>
                      {scan.progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Progress: {scan.progress}%</span>
                            <span>
                              {scan.completed_ips || 0} / {scan.total_ips || 0} IPs
                            </span>
                          </div>
                          <Progress value={scan.progress} className="h-1" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {scan.status === 'running' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelScan(scan.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScanStatus;