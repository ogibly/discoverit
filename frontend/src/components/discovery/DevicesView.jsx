import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
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
  return (
    <div className="space-y-4">
      {/* Sophisticated Search and Filter Controls */}
      <Card className="surface-elevated">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Search devices by IP, hostname, MAC, OS, vendor, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-muted-foreground">🔍</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
              >
                <option value="all">All Types</option>
                <option value="devices">Discovered Devices</option>
                <option value="assets">Managed Assets</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
              >
                <option value="last_seen">Last Seen</option>
                <option value="ip">IP Address</option>
                <option value="hostname">Hostname</option>
                <option value="device_type">Device Type</option>
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

      {/* Bulk Actions */}
      {selectedDevices.length > 0 && (
        <Card className="surface-elevated border-warning/20 bg-warning/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-body text-foreground">
                  {selectedDevices.length} device(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectAllDevices([])}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkDeleteDevices}
                  className="text-error hover:text-error hover:bg-error/10 border-error/20"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sophisticated Devices Grid */}
      {devices.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map((device) => (
            <Card key={device.id} className="surface-interactive">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(device.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleDeviceSelection(device.id);
                      }}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    <div className="text-2xl">
                      {getDeviceTypeIcon(device)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-subheading text-foreground truncate">
                        {device.hostname || device.primary_ip || 'Unknown Device'}
                      </h3>
                      <p className="text-body text-muted-foreground font-mono">
                        {device.primary_ip}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge className={cn("text-xs", getStatusColor(device))}>
                      {getStatusText(device)}
                    </Badge>
                    {device.model && (
                      <Badge className={cn("text-xs", getDeviceTypeColor(device))}>
                        {device.model}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {device.mac_address && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">MAC:</span>
                      <span className="text-foreground font-mono text-xs bg-muted px-2 py-1 rounded">
                        {device.mac_address}
                      </span>
                    </div>
                  )}
                  {device.manufacturer && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Vendor:</span>
                      <span className="text-foreground font-semibold">
                        {device.manufacturer}
                      </span>
                    </div>
                  )}
                  {device.os_name && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">OS:</span>
                      <span className="text-foreground font-semibold">
                        {device.os_name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Last Seen:</span>
                    <span className="text-foreground font-semibold">
                      {formatLastSeen(device.last_seen)}
                    </span>
                  </div>
                  {device.scan_data?.response_time && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Response:</span>
                      <span className={cn("font-semibold", getResponseTimeColor(device.scan_data.response_time))}>
                        {device.scan_data.response_time}s
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDevice(device)}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  {!device.is_managed && (
                    <Button
                      size="sm"
                      onClick={() => onConvertToAsset(device)}
                      className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                    >
                      Convert to Asset
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDevice(device.id);
                    }}
                    className="text-error hover:text-error hover:bg-error/10 border-error/20"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="surface-elevated">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3 opacity-60">🔍</div>
            <h3 className="text-subheading text-foreground mb-2">
              No devices found
            </h3>
            <p className="text-body text-muted-foreground mb-4 max-w-md mx-auto">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria to find devices'
                : 'Start by running a network scan or LAN discovery to find devices on your network'
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Custom Scan
              </Button>
              <Button variant="outline">
                LAN Discovery
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DevicesView;