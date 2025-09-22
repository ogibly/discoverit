import React from 'react';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { statusConfig } from '../../utils/apiHelpers';

const StatusIndicator = ({
  status,
  variant = 'badge',
  size = 'default',
  showIcon = false,
  className = ''
}) => {
  const config = statusConfig[status] || statusConfig.inactive;
  
  const iconMap = {
    active: '🟢',
    inactive: '⚫',
    pending: '🟡',
    running: '🔵',
    completed: '✅',
    failed: '❌',
    cancelled: '⏹️'
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    default: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  };

  if (variant === 'dot') {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <div
          className={cn(
            "rounded-full w-2 h-2",
            config.bg.replace('bg-', 'bg-').replace('-100', '-500')
          )}
        />
        <span className="text-sm text-foreground">{config.text}</span>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <span className={cn("text-sm font-medium", config.color, className)}>
        {showIcon && iconMap[status] && `${iconMap[status]} `}
        {config.text}
      </span>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        sizeClasses[size],
        config.bg,
        config.color,
        "border-0",
        className
      )}
    >
      {showIcon && iconMap[status] && `${iconMap[status]} `}
      {config.text}
    </Badge>
  );
};

export default StatusIndicator;
