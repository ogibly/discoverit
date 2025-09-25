import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { cn } from '../../utils/cn';
import { formatScanProgress, getCappedProgress } from '../../utils/formatters';
import ScanProgressIndicator from './ScanProgressIndicator';
import { 
  Play, 
  Pause, 
  Square, 
  Eye, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Network,
  Zap,
  Settings,
  ExternalLink
} from 'lucide-react';

const ScansTracker = ({ 
  activeScanTask, 
  scanTasks, 
  onCancelScan, 
  onViewResults, 
  onDownloadResults,
  className = "" 
}) => {
  const navigate = useNavigate();
  const [expandedScan, setExpandedScan] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [recentScansCount, setRecentScansCount] = useState(3);

  // Auto-expand active scan
  useEffect(() => {
    if (activeScanTask && activeScanTask.status === 'running') {
      setExpandedScan(activeScanTask.id);
    }
  }, [activeScanTask]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <Square className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatDuration = (startTime, endTime = null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    }
    return `${diffSecs}s`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getScanTypeIcon = (scanType) => {
    switch (scanType) {
      case 'quick':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'comprehensive':
        return <Network className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getScanTypeLabel = (scanType) => {
    switch (scanType) {
      case 'quick':
        return 'Quick Scan';
      case 'comprehensive':
        return 'Comprehensive Scan';
      default:
        return 'Custom Scan';
    }
  };

  const recentScans = scanTasks?.slice(0, recentScansCount) || [];
  const hasActiveScan = activeScanTask && activeScanTask.status === 'running';

  const handleViewAllScans = () => {
    navigate('/scans');
  };

  if (isCollapsed) {
    return (
      <div className={cn("fixed bottom-0 left-64 right-0 z-30 transition-all duration-300", className)}>
        <Card className="mx-4 mb-4 shadow-lg border border-border/50 bg-background/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {hasActiveScan ? (
                  <>
                    <Activity className="w-5 h-5 text-blue-500 animate-pulse flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Scan Running</p>
                      <p className="text-xs text-muted-foreground">
                        {formatScanProgress(activeScanTask.progress)} • {formatDuration(activeScanTask.start_time)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Scan Tracker</p>
                      <p className="text-xs text-muted-foreground">
                        {recentScans.length} recent scans • Click to expand
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {hasActiveScan && (
                  <Badge variant="secondary" className="text-xs">
                    {formatScanProgress(activeScanTask.progress)}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(false)}
                  className="h-8 w-8 p-0 flex-shrink-0 hover:bg-accent/50"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("fixed bottom-0 left-64 right-0 z-30 transition-all duration-300", className)}>
      <Card className="mx-4 mb-4 shadow-lg border border-border/50 bg-background/95 backdrop-blur-sm max-h-80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center space-x-2">
              <Activity className="w-4 h-4 text-primary" />
              <span>Scan Tracker</span>
              <Badge 
                variant="outline" 
                className="text-xs ml-2 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={handleViewAllScans}
                title="Click to view all scans"
              >
                {scanTasks?.length || 0} scans
                <ExternalLink className="w-3 h-3 ml-1" />
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Settings className="w-3 h-3 text-muted-foreground" />
                <Select value={recentScansCount.toString()} onValueChange={(value) => setRecentScansCount(parseInt(value))}>
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(true)}
                className="h-7 w-7 p-0 hover:bg-accent/50"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 max-h-64 overflow-y-auto">
          {/* Active Scan */}
          {hasActiveScan && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-blue-800 dark:text-blue-200">Active Scan</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancelScan(activeScanTask.id)}
                    className="text-xs h-7"
                  >
                    <Square className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewResults(activeScanTask.id)}
                    className="text-xs h-7"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
              <ScanProgressIndicator 
                scanTask={activeScanTask} 
                showDetails={true}
                size="default"
              />
            </div>
          )}

          {/* Recent Scans */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Recent Scans</span>
              <Badge variant="outline" className="text-xs">
                {recentScans.length}
              </Badge>
            </h4>
            
            {recentScans.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No scans yet</p>
                <p className="text-xs">Start a discovery scan to see results here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className={cn(
                      "p-2 rounded-lg border transition-all cursor-pointer",
                      expandedScan === scan.id 
                        ? "bg-muted border-primary/50" 
                        : "bg-background border-border hover:border-primary/30"
                    )}
                    onClick={() => setExpandedScan(expandedScan === scan.id ? null : scan.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {getStatusIcon(scan.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {scan.name || `Scan ${scan.id}`}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {scan.target} • {formatTimestamp(scan.start_time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={cn("text-xs", getStatusColor(scan.status))}>
                          {scan.status}
                        </Badge>
                        {expandedScan === scan.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {expandedScan === scan.id && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <div className="flex items-center space-x-1 mt-1">
                              {getScanTypeIcon(scan.scan_type)}
                              <span>{getScanTypeLabel(scan.scan_type)}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <p className="mt-1">{formatDuration(scan.start_time, scan.end_time)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Discovered:</span>
                            <p className="mt-1 font-medium">{scan.discovered_devices || 0} devices</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Progress:</span>
                            <p className="mt-1">{scan.progress}%</p>
                          </div>
                        </div>

                        {scan.error_message && (
                          <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs">
                            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                              <AlertCircle className="w-3 h-3" />
                              <span className="font-medium">Error:</span>
                            </div>
                            <p className="mt-1 text-red-700 dark:text-red-300">{scan.error_message}</p>
                          </div>
                        )}

                        <div className="flex space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewResults(scan.id);
                            }}
                            className="flex-1 text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Results
                          </Button>
                          {scan.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDownloadResults(scan.id);
                              }}
                              className="flex-1 text-xs"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScansTracker;
