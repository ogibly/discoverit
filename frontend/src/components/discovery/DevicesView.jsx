import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const DevicesView = ({
  devices,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onViewDevice,
  onConvertToAsset,
  onDeleteDevice,
  onBulkDeleteDevices,
  selectedDevices,
  onToggleDeviceSelection,
  onSelectAllDevices,
  getStatusColor,
  getStatusText,
  getDeviceTypeIcon,
  getDeviceTypeColor,
  formatLastSeen,
  getResponseTimeColor
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const deviceTypes = [
    { value: 'all', label: 'All Devices', icon: '📱' },
    { value: 'router', label: 'Routers', icon: '🌐' },
    { value: 'switch', label: 'Switches', icon: '🔀' },
    { value: 'server', label: 'Servers', icon: '🖥️' },
    { value: 'workstation', label: 'Workstations', icon: '💻' },
    { value: 'printer', label: 'Printers', icon: '🖨️' },
    { value: 'other', label: 'Other', icon: '📱' }
  ];

  const sortOptions = [
    { value: 'last_seen', label: 'Last Seen' },
    { value: 'ip_address', label: 'IP Address' },
    { value: 'hostname', label: 'Hostname' },
    { value: 'device_type', label: 'Device Type' },
    { value: 'response_time', label: 'Response Time' }
  ];

  const allSelected = devices.length > 0 && devices.every(device => selectedDevices.includes(device.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading text-foreground">Discovered Devices</h2>
          <p className="text-caption text-muted-foreground mt-1">
            Manage and convert discovered network devices
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{devices.length}</div>
            <div className="text-caption text-muted-foreground">Total Devices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{devices.filter(d => d.status === 'online').length}</div>
            <div className="text-caption text-muted-foreground">Online</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="surface-elevated">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search devices by IP, hostname, or MAC address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                {deviceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Online Devices</p>
                <p className="text-2xl font-bold text-success">{devices.filter(d => d.status === 'online').length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                <span className="text-success">🟢</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Offline Devices</p>
                <p className="text-2xl font-bold text-error">{devices.filter(d => d.status === 'offline').length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-error/20 flex items-center justify-center">
                <span className="text-error">🔴</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Device Types</p>
                <p className="text-2xl font-bold text-info">{new Set(devices.map(d => d.device_type)).size}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
                <span className="text-info">🔧</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-warning">{selectedDevices.length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <span className="text-warning">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedDevices.length > 0 && (
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-body text-foreground">
                  {selectedDevices.length} device(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectAllDevices([])}
                  className="text-caption"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkDeleteDevices(selectedDevices)}
                  className="text-error hover:text-error hover:bg-error/10 border-error/20"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device List */}
      {devices.length === 0 ? (
        <Card className="surface-elevated">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-subheading text-foreground mb-2">No devices found</h3>
            <p className="text-body text-muted-foreground">
              Start a network discovery scan to find devices on your network.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* View Toggle */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">View:</span>
              <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "text-xs font-medium transition-all duration-200 h-8 px-3",
                    viewMode === 'grid' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ⊞
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "text-xs font-medium transition-all duration-200 h-8 px-3",
                    viewMode === 'table' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ☰
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {devices.length} device{devices.length !== 1 ? 's' : ''}
            </div>
          </div>

          {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <Card key={device.id} className="surface-interactive">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(device.id)}
                      onChange={() => onToggleDeviceSelection(device.id)}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", getDeviceTypeColor(device.device_type))}>
                      {getDeviceTypeIcon(device.device_type)}
                    </div>
                  </div>
                  <Badge className={cn("text-xs", getStatusColor(device.status))}>
                    {getStatusText(device.status)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-subheading text-foreground truncate">
                      {device.hostname || device.ip_address}
                    </h3>
                    <p className="text-caption text-muted-foreground">
                      {device.ip_address}
                    </p>
                  </div>

                  <div className="space-y-2 text-caption text-muted-foreground">
                    {device.mac_address && (
                      <div className="flex justify-between">
                        <span>MAC:</span>
                        <span className="font-mono">{device.mac_address}</span>
                      </div>
                    )}
                    {device.device_type && (
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="capitalize">{device.device_type}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Last Seen:</span>
                      <span>{formatLastSeen(device.last_seen)}</span>
                    </div>
                    {device.response_time && (
                      <div className="flex justify-between">
                        <span>Response:</span>
                        <span className={cn("font-mono", getResponseTimeColor(device.response_time))}>
                          {device.response_time}ms
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDevice(device)}
                      className="flex-1 text-xs"
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onConvertToAsset(device)}
                      className="flex-1 text-xs"
                    >
                      Convert
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteDevice(device.id)}
                      className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        ) : (
        <Card className="surface-elevated">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => onSelectAllDevices(allSelected ? [] : devices.map(d => d.id))}
                        className="rounded border-border text-primary focus:ring-ring"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Device</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">IP Address</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Type</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Last Seen</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {devices.map((device) => (
                    <tr key={device.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDevices.includes(device.id)}
                          onChange={() => onToggleDeviceSelection(device.id)}
                          className="rounded border-border text-primary focus:ring-ring"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-sm", getDeviceTypeColor(device.device_type))}>
                            {getDeviceTypeIcon(device.device_type)}
                          </div>
                          <div>
                            <div className="text-body font-medium text-foreground">
                              {device.hostname || 'Unknown'}
                            </div>
                            {device.mac_address && (
                              <div className="text-caption text-muted-foreground font-mono">
                                {device.mac_address}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body text-foreground font-mono">{device.ip_address}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body text-foreground capitalize">{device.device_type || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn("text-xs", getStatusColor(device.status))}>
                          {getStatusText(device.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body text-muted-foreground">{formatLastSeen(device.last_seen)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDevice(device)}
                            className="text-xs"
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onConvertToAsset(device)}
                            className="text-xs"
                          >
                            Convert
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteDevice(device.id)}
                            className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        )}
        </>
      )}
    </div>
  );
};

export default DevicesView;