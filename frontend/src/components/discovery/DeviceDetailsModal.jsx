import React from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const DeviceDetailsModal = ({
  device,
  onConvertToAsset,
  onClose,
  getStatusColor,
  getStatusText,
  getDeviceTypeIcon,
  getDeviceTypeColor,
  formatLastSeen,
  getResponseTimeColor
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="text-4xl">{getDeviceTypeIcon(device)}</div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {device.hostname || device.primary_ip || 'Unknown Device'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 font-mono">
            {device.primary_ip}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Hostname
          </label>
          <p className="text-slate-900 dark:text-slate-100 font-medium">
            {device.hostname || 'Unknown'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            IP Address
          </label>
          <p className="text-slate-900 dark:text-slate-100 font-mono font-medium">
            {device.primary_ip}
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            MAC Address
          </label>
          <p className="text-slate-900 dark:text-slate-100 font-mono font-medium">
            {device.mac_address || 'Unknown'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Operating System
          </label>
          <p className="text-slate-900 dark:text-slate-100 font-medium">
            {device.os_name || 'Unknown'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Manufacturer
          </label>
          <p className="text-slate-900 dark:text-slate-100 font-medium">
            {device.manufacturer || 'Unknown'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Device Type
          </label>
          <p className="text-slate-900 dark:text-slate-100 font-medium">
            {device.model || 'Unknown'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Status
          </label>
          <Badge className={cn("text-xs font-semibold px-2 py-1", getStatusColor(device))}>
            {getStatusText(device)}
          </Badge>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Last Seen
          </label>
          <p className="text-slate-900 dark:text-slate-100 font-medium">
            {formatLastSeen(device.last_seen)}
          </p>
        </div>
      </div>

      {device.description && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <p className="text-slate-900 dark:text-slate-100">
            {device.description}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        {!device.is_managed && (
          <Button
            onClick={() => {
              onConvertToAsset(device);
              onClose();
            }}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-emerald-500/25"
          >
            Convert to Managed Asset
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default DeviceDetailsModal;

