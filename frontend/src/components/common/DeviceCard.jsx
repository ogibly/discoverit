/**
 * Consolidated Device Card Component
 * Reusable card component for displaying device/asset information
 */

import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

const DeviceCard = ({
  device,
  variant = 'default', // 'default', 'compact', 'detailed'
  showActions = true,
  onViewDetails,
  onConvert,
  onSelect,
  isSelected = false,
  className = '',
  ...props
}) => {
  const getDeviceIcon = (deviceType, osName) => {
    // This would be replaced with actual icon components
    return '🖥️'; // Placeholder
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'new':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'converted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'new':
        return '✓';
      case 'inactive':
        return '✗';
      case 'converted':
        return '🔄';
      default:
        return '⏱️';
    }
  };

  const baseClasses = cn(
    'group bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-xl',
    isSelected && 'ring-2 ring-yellow-500/50 border-yellow-500/50',
    className
  );

  if (variant === 'compact') {
    return (
      <div className={baseClasses} onClick={onSelect} {...props}>
        <div className="p-4 flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 text-slate-200 flex-shrink-0">
            {getDeviceIcon(device.deviceType, device.osName)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-white text-sm truncate">
              {device.hostname || device.name || device.ipAddress}
            </h4>
            <p className="text-slate-400 text-xs truncate">
              {device.ipAddress || device.primary_ip}
            </p>
          </div>
          <Badge className={cn("text-xs", getStatusColor(device.status))}>
            {getStatusIcon(device.status)} {device.status}
          </Badge>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={baseClasses} {...props}>
        <div className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 text-slate-200 flex-shrink-0 group-hover:from-slate-600 group-hover:to-slate-500 transition-all duration-300">
                {getDeviceIcon(device.deviceType, device.osName)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-white text-lg truncate group-hover:text-yellow-400 transition-colors">
                  {device.hostname || device.name || device.ipAddress}
                </h4>
                <p className="text-slate-400 font-mono text-sm truncate">
                  {device.ipAddress || device.primary_ip}
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-2 flex-shrink-0">
              <Badge className={cn("text-xs", getStatusColor(device.status))}>
                {getStatusIcon(device.status)} {device.status}
              </Badge>
              {device.is_managed && (
                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                  <span className="mr-1">🛡️</span> Managed
                </Badge>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 flex-1">
            {device.deviceType && (
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Type:</span>
                  <span className="text-white font-medium">{device.deviceType}</span>
                </div>
              </div>
            )}
            {device.osName && (
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">OS:</span>
                  <span className="text-white font-medium text-sm truncate">{device.osName}</span>
                </div>
              </div>
            )}
            {device.manufacturer && (
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Manufacturer:</span>
                  <span className="text-white font-medium text-sm truncate">{device.manufacturer}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex space-x-2 mt-4">
              <Button
                onClick={onViewDetails}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-slate-900 font-semibold px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
              >
                View Details
              </Button>
              {onConvert && (
                <Button
                  onClick={onConvert}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700/50 px-4 py-2 rounded-xl"
                >
                  Convert
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={baseClasses} onClick={onSelect} {...props}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-slate-700 to-slate-600 text-slate-200">
              {getDeviceIcon(device.deviceType, device.osName)}
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">
                {device.hostname || device.name || device.ipAddress}
              </h4>
              <p className="text-slate-400 text-xs">
                {device.ipAddress || device.primary_ip}
              </p>
            </div>
          </div>
          <Badge className={cn("text-xs", getStatusColor(device.status))}>
            {getStatusIcon(device.status)} {device.status}
          </Badge>
        </div>

        {device.osName && (
          <p className="text-slate-400 text-xs mb-3">
            OS: {device.osName}
          </p>
        )}

        {showActions && (
          <div className="flex space-x-2">
            <Button
              onClick={onViewDetails}
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
            >
              View Details
            </Button>
            {onConvert && (
              <Button
                onClick={onConvert}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Convert
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceCard;
