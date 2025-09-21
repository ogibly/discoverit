import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { cn } from '../utils/cn';

const ScanStatus = () => {
  const { 
    activeScanTask, 
    fetchActiveScanTask, 
    cancelScanTask,
    scanHistory,
    fetchScanHistory 
  } = useApp();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchActiveScanTask(),
        fetchScanHistory()
      ]);
    } catch (err) {
      setError('Failed to load scan data');
      console.error('Error loading scan data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelScan = async (scanId) => {
    try {
      await cancelScanTask(scanId);
      await fetchActiveScanTask(); // Refresh active scans
    } catch (error) {
      console.error('Failed to cancel scan:', error);
    }
  };

  const formatDuration = (startTime, endTime = null) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end - start) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  const getStatusBadge = (status) => {
    const variants = {
      'running': { className: 'bg-info text-info-foreground', label: 'Running' },
      'completed': { className: 'bg-success text-success-foreground', label: 'Completed' },
      'failed': { className: 'bg-error text-error-foreground', label: 'Failed' },
      'cancelled': { className: 'bg-muted text-muted-foreground', label: 'Cancelled' }
    };
    
    const variant = variants[status] || variants['failed'];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading scan status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-foreground">Scan Status</h1>
          <p className="text-body text-muted-foreground mt-1">
            Monitor active scans and view scan history
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-error">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Scan */}
      {activeScanTask && (
        <Card className="surface-elevated">
          <CardHeader>
            <CardTitle className="text-heading text-foreground flex items-center space-x-2">
              <div className="w-2 h-2 bg-info rounded-full animate-pulse"></div>
              <span>Active Scan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-subheading text-foreground font-medium">
                  {activeScanTask.target}
                </h3>
                <p className="text-caption text-muted-foreground">
                  {activeScanTask.scan_type} • Started {formatDuration(activeScanTask.start_time)}
                </p>
              </div>
              <div className="flex items-center justify-end space-x-2">
                {getStatusBadge('running')}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancelScan(activeScanTask.id)}
                >
                  Cancel Scan
                </Button>
              </div>
            </div>

            {activeScanTask.progress !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-caption text-muted-foreground">
                  <span>Progress: {activeScanTask.progress}%</span>
                  <span>
                    {activeScanTask.completed_ips || 0} / {activeScanTask.total_ips || 0} IPs
                  </span>
                </div>
                <Progress value={activeScanTask.progress} className="h-2" />
                {activeScanTask.current_ip && (
                  <p className="text-caption text-muted-foreground">
                    Currently scanning: {activeScanTask.current_ip}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-caption text-muted-foreground">Start Time</p>
                <p className="text-body text-foreground">
                  {new Date(activeScanTask.start_time).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Duration</p>
                <p className="text-body text-foreground">
                  {formatDuration(activeScanTask.start_time)}
                </p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Scan Type</p>
                <p className="text-body text-foreground capitalize">
                  {activeScanTask.scan_type}
                </p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Target</p>
                <p className="text-body text-foreground font-mono text-sm">
                  {activeScanTask.target}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle className="text-heading text-foreground">
            Scan History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scanHistory && scanHistory.length > 0 ? (
            <div className="space-y-3">
              {scanHistory.map((scan) => (
                <div
                  key={scan.id}
                  className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-subheading text-foreground font-medium">
                        {scan.target}
                      </h3>
                      {getStatusBadge(scan.status)}
                    </div>
                    <span className="text-caption text-muted-foreground">
                      {new Date(scan.start_time).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-caption text-muted-foreground">
                    <div>
                      <span className="font-medium">Type:</span> {scan.scan_type}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {formatDuration(scan.start_time, scan.end_time)}
                    </div>
                    <div>
                      <span className="font-medium">IPs Scanned:</span> {scan.total_ips || 0}
                    </div>
                    <div>
                      <span className="font-medium">Devices Found:</span> {scan.devices_found || 0}
                    </div>
                  </div>
                  
                  {scan.error_message && (
                    <div className="mt-2 p-2 bg-error/10 border border-error/20 rounded text-caption text-error">
                      Error: {scan.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-2">📊</div>
              <p className="text-body text-muted-foreground">No scan history available</p>
              <p className="text-caption text-muted-foreground mt-1">
                Run a scan to see history here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanStatus;