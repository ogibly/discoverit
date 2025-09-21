import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import { cn } from '../utils/cn';

const ScanStatusTracker = ({ 
  className = '',
  position = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'inline'
  compact = false 
}) => {
  const { activeScanTask, fetchActiveScanTask, cancelScanTask } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for active scans on mount
    checkActiveScans();
    
    // Set up periodic check for active scans (every 3 seconds)
    const interval = setInterval(checkActiveScans, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const checkActiveScans = async () => {
    try {
      await fetchActiveScanTask();
      setIsVisible(!!activeScanTask);
    } catch (error) {
      console.error('Failed to check active scans:', error);
      setIsVisible(false);
    }
  };

  const handleCancelScan = async (scanId) => {
    try {
      await cancelScanTask(scanId);
      // Refresh active scans after cancellation
      checkActiveScans();
    } catch (error) {
      console.error('Failed to cancel scan:', error);
    }
  };

  const formatDuration = (startTime) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    const now = new Date();
    const duration = Math.floor((now - start) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  // Don't render if no active scans or not visible
  if (!isVisible || !activeScanTask) {
    return null;
  }

  const scan = activeScanTask;

  // Position classes
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'inline': 'relative'
  };

  const cardClasses = cn(
    'w-80 shadow-lg border border-slate-700',
    positionClasses[position],
    className
  );

  return (
    <div className={cardClasses}>
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-100">
                Active Scan
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleCancelScan(scan.id)}
              className="h-6 px-2 text-xs"
            >
              Cancel
            </Button>
          </div>

          <div className="space-y-2">
            <div>
              <h3 className="text-sm font-medium text-slate-100 truncate">
                {scan.target}
              </h3>
              <p className="text-xs text-slate-400">
                {scan.scan_type} • {formatDuration(scan.start_time)}
              </p>
            </div>

            {scan.progress !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Progress: {scan.progress}%</span>
                  <span>
                    {scan.completed_ips || 0} / {scan.total_ips || 0}
                  </span>
                </div>
                <Progress value={scan.progress} className="h-1" />
                {scan.current_ip && (
                  <p className="text-xs text-slate-500 truncate">
                    Scanning: {scan.current_ip}
                  </p>
                )}
              </div>
            )}

            {!compact && (
              <div className="pt-2 border-t border-slate-700">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Started: {new Date(scan.start_time).toLocaleTimeString()}</span>
                  <Badge className="bg-blue-900 text-blue-200 text-xs">
                    Running
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanStatusTracker;