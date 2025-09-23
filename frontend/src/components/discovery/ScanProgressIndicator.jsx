import React from 'react';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Zap,
  Network,
  Server
} from 'lucide-react';

const ScanProgressIndicator = ({ 
  scanTask, 
  showDetails = false,
  size = 'default' // 'small', 'default', 'large'
}) => {
  if (!scanTask) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getScanTypeIcon = (scanType) => {
    switch (scanType) {
      case 'quick':
        return <Zap className="w-3 h-3 text-yellow-500" />;
      case 'comprehensive':
        return <Network className="w-3 h-3 text-blue-500" />;
      default:
        return <Server className="w-3 h-3 text-gray-500" />;
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

  const getProgressColor = (progress) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const sizeClasses = {
    small: {
      container: 'p-2',
      text: 'text-xs',
      icon: 'w-3 h-3',
      progress: 'h-1'
    },
    default: {
      container: 'p-3',
      text: 'text-sm',
      icon: 'w-4 h-4',
      progress: 'h-2'
    },
    large: {
      container: 'p-4',
      text: 'text-base',
      icon: 'w-5 h-5',
      progress: 'h-3'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={cn("space-y-2", classes.container)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon(scanTask.status)}
          <span className={cn("font-medium", classes.text)}>
            {scanTask.name || `Scan ${scanTask.id}`}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {getScanTypeIcon(scanTask.scan_type)}
            <span className={cn("text-muted-foreground", classes.text)}>
              {scanTask.scan_type}
            </span>
          </div>
          <Badge className={cn("text-xs", getStatusColor(scanTask.status))}>
            {scanTask.status}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={cn("text-muted-foreground", classes.text)}>
            Progress
          </span>
          <span className={cn("font-medium", classes.text)}>
            {Math.round(scanTask.progress || 0)}%
          </span>
        </div>
        <Progress 
          value={Math.round(scanTask.progress || 0)} 
          className={cn(classes.progress)}
        />
      </div>

      {/* Details */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <span>Target:</span>
            <p className="font-mono truncate">{scanTask.target}</p>
          </div>
          <div>
            <span>Duration:</span>
            <p>{formatDuration(scanTask.start_time, scanTask.end_time)}</p>
          </div>
          {scanTask.current_ip && (
            <div>
              <span>Current IP:</span>
              <p className="font-mono">{scanTask.current_ip}</p>
            </div>
          )}
          <div>
            <span>Progress:</span>
            <p className="font-medium text-foreground">
              {Math.round(scanTask.progress || 0)}%
            </p>
          </div>
          <div>
            <span>Discovered:</span>
            <p className="font-medium text-foreground">
              {scanTask.discovered_devices || 0} devices
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {scanTask.error_message && (
        <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs">
          <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-3 h-3" />
            <span className="font-medium">Error:</span>
          </div>
          <p className="mt-1 text-red-700 dark:text-red-300">
            {scanTask.error_message}
          </p>
        </div>
      )}
    </div>
  );
};

export default ScanProgressIndicator;
