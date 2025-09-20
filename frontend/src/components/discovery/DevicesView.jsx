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
    <div className="space-y-6">
      {/* Enhanced Search and Filter Controls */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Search devices by IP, hostname, MAC, OS, vendor, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 bg-white/80 dark:bg-slate-700/80 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400">🔍</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                <option value="all">All Types</option>
                <option value="devices">Discovered Devices</option>
                <option value="assets">Managed Assets</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
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
                className="px-4 py-2 border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-700"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedDevices.length > 0 && (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {selectedDevices.length} device(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectAllDevices([])}
                  className="text-slate-600 hover:text-slate-700"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkDeleteDevices}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Devices Grid */}
      {devices.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-2">
          {devices.map((device) => (
            <Card key={device.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(device.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleDeviceSelection(device.id);
                      }}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                      {getDeviceTypeIcon(device)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {device.hostname || device.primary_ip || 'Unknown Device'}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                        {device.primary_ip}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={cn("text-xs font-semibold px-2 py-1", getStatusColor(device))}>
                      {getStatusText(device)}
                    </Badge>
                    {device.model && (
                      <Badge className={cn("text-xs font-semibold px-2 py-1", getDeviceTypeColor(device))}>
                        {device.model}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {device.mac_address && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">MAC:</span>
                      <span className="text-slate-900 dark:text-slate-100 font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {device.mac_address}
                      </span>
                    </div>
                  )}
                  {device.manufacturer && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Vendor:</span>
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">
                        {device.manufacturer}
                      </span>
                    </div>
                  )}
                  {device.os_name && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">OS:</span>
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">
                        {device.os_name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Last Seen:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">
                      {formatLastSeen(device.last_seen)}
                    </span>
                  </div>
                  {device.scan_data?.response_time && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Response:</span>
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
                    className="flex-1 border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    View Details
                  </Button>
                  {!device.is_managed && (
                    <Button
                      size="sm"
                      onClick={() => onConvertToAsset(device)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-emerald-500/25"
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
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4 opacity-60">🔍</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              No devices found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria to find devices'
                : 'Start by running a network scan or LAN discovery to find devices on your network'
              }
            </p>
            <div className="flex gap-3 justify-center">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25">
                Custom Scan
              </Button>
              <Button variant="outline" className="border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
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
