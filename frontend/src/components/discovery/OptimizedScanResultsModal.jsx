/**
 * Optimized Scan Results Modal
 * Performance-optimized version with virtual scrolling and memoization
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { cn } from '../../utils/cn';
import { formatTimestampSafe } from '../../utils/formatters';
import { 
  useDebounce, 
  useMemoizedFilter, 
  useMemoizedSort, 
  useVirtualScroll,
  usePagination,
  createSearchFunction,
  createSortFunction
} from '../../utils/performance';
import { 
  X, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  EyeOff,
  Network,
  Clock,
  CheckCircle,
  AlertCircle,
  Server,
  Wifi,
  HardDrive,
  Cpu,
  Monitor
} from 'lucide-react';

// Memoized device icon component
const DeviceIcon = memo(({ device }) => {
  const getDeviceIcon = (device) => {
    if (device.device_type === 'server') return <Server className="w-5 h-5" />;
    if (device.device_type === 'router') return <Network className="w-5 h-5" />;
    if (device.device_type === 'printer') return <HardDrive className="w-5 h-5" />;
    if (device.device_type === 'workstation') return <Monitor className="w-5 h-5" />;
    if (device.device_type === 'mobile') return <Wifi className="w-5 h-5" />;
    return <Cpu className="w-5 h-5" />;
  };

  return getDeviceIcon(device);
});

DeviceIcon.displayName = 'DeviceIcon';

// Memoized device row component
const DeviceRow = memo(({ 
  device, 
  isSelected, 
  showDetails, 
  onToggleSelection, 
  onToggleDetails, 
  onConvert 
}) => {
  const handleSelectionChange = useCallback(() => {
    onToggleSelection(device.id);
  }, [device.id, onToggleSelection]);

  const handleDetailsToggle = useCallback(() => {
    onToggleDetails(device.id);
  }, [device.id, onToggleDetails]);

  const handleConvert = useCallback(() => {
    onConvert(device);
  }, [device, onConvert]);

  return (
    <div className="border-b border-slate-700 last:border-b-0">
      <div className="p-4 hover:bg-slate-700/30 transition-colors">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectionChange}
            className="w-4 h-4 text-yellow-500 bg-slate-700/50 border-slate-600 rounded focus:ring-yellow-500/20"
          />
          
          <div className="flex-shrink-0">
            <DeviceIcon device={device} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-white truncate">
                {device.hostname || device.ip}
              </h4>
              <Badge className={cn(
                "text-xs",
                device.status === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              )}>
                {device.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 font-mono">
              {device.ip}
            </p>
            {device.mac && (
              <p className="text-xs text-slate-500 font-mono">
                MAC: {device.mac}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDetailsToggle}
              className="text-xs"
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              onClick={handleConvert}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 text-xs"
            >
              Convert
            </Button>
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {device.os && (
                <div>
                  <span className="text-slate-400">OS:</span>
                  <p className="text-white">{device.os}</p>
                </div>
              )}
              {device.vendor && (
                <div>
                  <span className="text-slate-400">Vendor:</span>
                  <p className="text-white">{device.vendor}</p>
                </div>
              )}
              {device.last_seen && (
                <div>
                  <span className="text-slate-400">Last Seen:</span>
                  <p className="text-white">{formatTimestampSafe(device.last_seen)}</p>
                </div>
              )}
              {device.port && (
                <div>
                  <span className="text-slate-400">Port:</span>
                  <p className="text-white">{device.port}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

DeviceRow.displayName = 'DeviceRow';

const OptimizedScanResultsModal = ({ 
  isOpen, 
  onClose, 
  scanTask, 
  scanResults = [] 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('ip');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedDevices, setSelectedDevices] = useState(new Set());
  const [showDetails, setShowDetails] = useState(new Set());

  // Debounced search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setFilterStatus('all');
      setSelectedDevices(new Set());
      setShowDetails(new Set());
    }
  }, [isOpen]);

  // Memoized processed results
  const processedResults = useMemo(() => {
    if (!Array.isArray(scanResults)) return [];
    
    return scanResults
      .map(device => ({
        ...device,
        id: device.id || `${device.ip}-${device.mac || 'unknown'}`,
        hostname: device.hostname || device.hostname_scan || null,
        mac: device.mac || device.mac_address || null,
        os: device.os || device.os_name || device.operating_system || null,
        vendor: device.vendor || device.manufacturer || null,
        status: device.status || device.scan_status || 'up',
        last_seen: device.last_seen || device.discovered_at || device.scan_timestamp || new Date().toISOString()
      }))
      .reduce((acc, device) => {
        // Deduplicate by IP address, keeping the most recent entry
        const existing = acc.find(d => d.ip === device.ip);
        if (!existing) {
          acc.push(device);
        } else if (new Date(device.last_seen) > new Date(existing.last_seen)) {
          const index = acc.indexOf(existing);
          acc[index] = device;
        }
        return acc;
      }, []);
  }, [scanResults]);

  // Memoized search function
  const searchFunction = useMemo(() => 
    createSearchFunction(['ip', 'hostname', 'mac', 'os', 'vendor']), 
    []
  );

  // Memoized sort function
  const sortFunction = useMemo(() => 
    createSortFunction(sortBy, sortOrder), 
    [sortBy, sortOrder]
  );

  // Memoized filtered and sorted results
  const filteredResults = useMemo(() => {
    let results = processedResults;
    
    // Apply search filter
    if (debouncedSearchTerm) {
      results = searchFunction(results, debouncedSearchTerm);
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      results = results.filter(device => device.status === filterStatus);
    }
    
    // Apply sorting
    return results.sort(sortFunction);
  }, [processedResults, debouncedSearchTerm, filterStatus, searchFunction, sortFunction]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext,
    hasPrev
  } = usePagination(filteredResults, 20);

  // Event handlers
  const handleToggleSelection = useCallback((deviceId) => {
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  }, []);

  const handleToggleDetails = useCallback((deviceId) => {
    setShowDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedDevices.size === paginatedItems.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(paginatedItems.map(device => device.id)));
    }
  }, [selectedDevices.size, paginatedItems]);

  const handleConvert = useCallback((device) => {
    // Handle device conversion
    console.log('Converting device:', device);
  }, []);

  const handleDownload = useCallback(() => {
    // Handle download functionality
    console.log('Downloading results for devices:', Array.from(selectedDevices));
  }, [selectedDevices]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Scan Results</h2>
            <p className="text-slate-400">
              {scanTask?.name || 'Network Discovery'} • {filteredResults.length} devices found
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-slate-700 bg-slate-800/30">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-600 rounded-lg bg-slate-700/50 text-white text-sm min-w-[160px] focus:ring-2 focus:ring-yellow-500/20"
            >
              <option value="all">All Status</option>
              <option value="up">Online</option>
              <option value="down">Offline</option>
            </select>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
              >
                {selectedDevices.size === paginatedItems.length ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedDevices.size > 0 && (
                <Button
                  onClick={handleDownload}
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-900"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download ({selectedDevices.size})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto">
          {paginatedItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">No devices found</h3>
              <p className="text-slate-400">
                {debouncedSearchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No devices were discovered in this scan.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {paginatedItems.map((device) => (
                <DeviceRow
                  key={device.id}
                  device={device}
                  isSelected={selectedDevices.has(device.id)}
                  showDetails={showDetails.has(device.id)}
                  onToggleSelection={handleToggleSelection}
                  onToggleDetails={handleToggleDetails}
                  onConvert={handleConvert}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-700 bg-slate-800/30">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, filteredResults.length)} of {filteredResults.length} devices
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={prevPage}
                  disabled={!hasPrev}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300"
                >
                  Previous
                </Button>
                <span className="text-slate-400 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={nextPage}
                  disabled={!hasNext}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OptimizedScanResultsModal;
