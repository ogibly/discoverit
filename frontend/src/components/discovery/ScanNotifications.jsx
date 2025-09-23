import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  Bell,
  BellOff
} from 'lucide-react';

const ScanNotifications = ({ 
  activeScanTask, 
  scanTasks, 
  onDismiss,
  position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
}) => {
  const [notifications, setNotifications] = useState([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const previousStatusRef = useRef(null);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  // Track scan status changes
  useEffect(() => {
    if (!isEnabled || !activeScanTask) return;

    const currentStatus = activeScanTask.status;
    const previousStatus = previousStatusRef.current;

    // Only show notification if status actually changed
    if (previousStatus !== currentStatus) {
      previousStatusRef.current = currentStatus;
      let notification = null;

      switch (currentStatus) {
        case 'completed':
          notification = {
            id: Date.now(),
            type: 'success',
            title: 'Scan Completed',
            message: `Discovery scan "${activeScanTask.name || activeScanTask.target}" has completed successfully.`,
            scanId: activeScanTask.id,
            status: currentStatus,
            timestamp: new Date()
          };
          break;
        case 'failed':
          notification = {
            id: Date.now(),
            type: 'error',
            title: 'Scan Failed',
            message: `Discovery scan "${activeScanTask.name || activeScanTask.target}" has failed.`,
            scanId: activeScanTask.id,
            status: currentStatus,
            timestamp: new Date(),
            error: activeScanTask.error_message
          };
          break;
        case 'cancelled':
          notification = {
            id: Date.now(),
            type: 'warning',
            title: 'Scan Cancelled',
            message: `Discovery scan "${activeScanTask.name || activeScanTask.target}" has been cancelled.`,
            scanId: activeScanTask.id,
            status: currentStatus,
            timestamp: new Date()
          };
          break;
        case 'running':
          // Only show running notification if it's a new scan
          const lastNotification = notifications[notifications.length - 1];
          if (!lastNotification || lastNotification.scanId !== activeScanTask.id) {
            notification = {
              id: Date.now(),
              type: 'info',
              title: 'Scan Started',
              message: `Discovery scan "${activeScanTask.name || activeScanTask.target}" has started.`,
              scanId: activeScanTask.id,
              status: currentStatus,
              timestamp: new Date()
            };
          }
          break;
      }

      if (notification) {
        setNotifications(prev => [...prev, notification]);
        
        // Auto-dismiss after 5 seconds for success/info, 10 seconds for errors
        const dismissTime = notification.type === 'error' ? 10000 : 5000;
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, dismissTime);
      }
    }
  }, [activeScanTask, isEnabled, notifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20 dark:border-gray-800';
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const dismissAll = () => {
    setNotifications([]);
  };

  if (!isEnabled || notifications.length === 0) {
    return null;
  }

  return (
    <div className={cn("fixed z-50 space-y-2 max-w-sm", positionClasses[position])}>
      {/* Notification Toggle */}
      <div className="flex justify-end mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEnabled(false)}
          className="h-8 w-8 p-0 opacity-50 hover:opacity-100"
        >
          <BellOff className="w-4 h-4" />
        </Button>
      </div>

      {/* Notifications */}
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={cn(
            "shadow-lg border-2 transition-all duration-300 transform",
            getNotificationColor(notification.type),
            "animate-in slide-in-from-right-full"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">
                    {notification.title}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissNotification(notification.id)}
                    className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                
                {notification.error && (
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
                    <p className="text-red-700 dark:text-red-300">
                      {notification.error}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {notification.timestamp.toLocaleTimeString()}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Scan #{notification.scanId}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Dismiss All Button */}
      {notifications.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={dismissAll}
            className="text-xs"
          >
            Dismiss All
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScanNotifications;
