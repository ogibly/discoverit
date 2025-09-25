import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { cn } from '../utils/cn';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Square,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  Zap
} from 'lucide-react';

const SidebarScanTracker = () => {
  const { activeScanTask, scanTasks, cancelScanTask } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewResults = (scanId) => {
    // Navigate to discovery page with results view
    window.location.href = `/discovery?scan=${scanId}`;
  };

  const handleDownloadResults = async (scanId) => {
    try {
      const response = await fetch(`/api/v2/scan-tasks/${scanId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan-results-${scanId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download scan results');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download scan results');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Activity className="w-3 h-3 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'cancelled':
        return <Square className="w-3 h-3 text-gray-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const recentScans = scanTasks?.slice(0, 3) || [];
  const hasActiveScan = activeScanTask && activeScanTask.status === 'running';

  return (
    <div className="pt-4 border-t border-border">
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Scan Tracker
        </h3>
        
        {/* Active Scan */}
        {hasActiveScan && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Active Scan</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelScanTask(activeScanTask.id)}
                className="h-5 px-2 text-xs"
              >
                Cancel
              </Button>
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="truncate">{activeScanTask.target}</p>
              <p>{Math.round(activeScanTask.progress || 0)}% complete</p>
            </div>
          </div>
        )}

        {/* Recent Scans Section */}
        <div className="space-y-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group",
              "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <div className="flex items-center space-x-3">
              <div className="transition-all duration-200 group-hover:scale-105">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-medium">Recent Scans</span>
              <Badge variant="outline" className="text-xs">
                {recentScans.length}
              </Badge>
            </div>
            <div className="transition-all duration-200 group-hover:scale-105">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          
          {isExpanded && (
            <div className="ml-7 space-y-1 max-h-40 overflow-y-auto">
              {recentScans.length === 0 ? (
                <div className="text-center py-2 text-muted-foreground">
                  <Activity className="w-5 h-5 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No scans yet</p>
                </div>
              ) : (
                recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-2 rounded-md bg-background/50 hover:bg-accent/30 transition-colors border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1 flex-1 min-w-0">
                        {getStatusIcon(scan.status)}
                        <span className="text-xs font-medium truncate">
                          {scan.name || `Scan ${scan.id}`}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", {
                          'border-green-200 text-green-700 bg-green-50': scan.status === 'completed',
                          'border-blue-200 text-blue-700 bg-blue-50': scan.status === 'running',
                          'border-red-200 text-red-700 bg-red-50': scan.status === 'failed',
                          'border-gray-200 text-gray-700 bg-gray-50': scan.status === 'cancelled'
                        })}
                      >
                        {scan.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p className="truncate">{scan.target}</p>
                      <p>{formatTimestamp(scan.start_time)}</p>
                    </div>
                    {scan.status === 'completed' && (
                      <div className="flex space-x-1 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-5 text-xs"
                          onClick={() => handleViewResults(scan.id)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-5 text-xs"
                          onClick={() => handleDownloadResults(scan.id)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarScanTracker;
