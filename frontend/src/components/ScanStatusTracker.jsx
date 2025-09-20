import React, { useState, useEffect } from 'react';
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
  const [activeScans, setActiveScans] = useState([]);
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
      const response = await fetch('/api/v2/scan-tasks/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const scanData = await response.json();
        if (scanData) {
          setActiveScans([scanData]); // API returns single active scan
          setIsVisible(true);
        } else {
          setActiveScans([]);
          setIsVisible(false);
        }
      } else {
        setActiveScans([]);
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Failed to check active scans:', error);
      setActiveScans([]);
      setIsVisible(false);
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
        // Remove the cancelled scan from the list
        setActiveScans(prev => prev.filter(scan => scan.id !== scanId));
        if (activeScans.length === 1) {
          setIsVisible(false);
        }
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

  if (!isVisible || activeScans.length === 0) {
    return null;
  }

  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'inline': 'relative'
  };

  return (
    <div className={cn(positionClasses[position], className)}>
      {activeScans.map((scan) => (
        <Card 
          key={scan.id}
          className={cn(
            "border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-lg",
            compact ? "w-80" : "w-96"
          )}
        >
          <CardContent className={cn("p-4", compact && "p-3")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "flex-shrink-0",
                  compact ? "text-lg" : "text-2xl"
                )}>
                  {scan.status === 'running' ? (
                    <div className="animate-spin">🔄</div>
                  ) : (
                    getStatusIcon(scan.status)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-semibold text-blue-900 dark:text-blue-100 truncate",
                    compact ? "text-sm" : "text-base"
                  )}>
                    {scan.name}
                  </h3>
                  <p className={cn(
                    "text-blue-700 dark:text-blue-300",
                    compact ? "text-xs" : "text-sm"
                  )}>
                    Target: {scan.target}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusColor(scan.status)}>
                      {scan.status}
                    </Badge>
                    {scan.progress > 0 && (
                      <span className={cn(
                        "text-blue-600 dark:text-blue-400",
                        compact ? "text-xs" : "text-sm"
                      )}>
                        {scan.progress}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size={compact ? "sm" : "default"}
                  onClick={() => handleCancelScan(scan.id)}
                  className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800"
                >
                  {compact ? "Cancel" : "Cancel Scan"}
                </Button>
              </div>
            </div>
            
            {scan.progress > 0 && (
              <div className="mt-3">
                <Progress value={scan.progress} className="h-2" />
              </div>
            )}
            
            {!compact && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Started: {new Date(scan.start_time).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ScanStatusTracker;
