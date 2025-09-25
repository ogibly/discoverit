import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { Input } from './ui/Input';
import { cn } from '../utils/cn';
import { formatScanProgress, getCappedProgress } from '../utils/formatters';
import { 
  ArrowLeft,
  Search,
  Filter,
  Download,
  Eye,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Network,
  Zap,
  Calendar,
  Target,
  Timer,
  HardDrive
} from 'lucide-react';

const ScansView = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading scans data
    const loadScans = async () => {
      setLoading(true);
      // In a real app, this would fetch from an API
      setTimeout(() => {
        const mockScans = [
          {
            id: 1,
            name: 'Discovery Scan - 172.16.0.0/30',
            target: '172.16.0.0/30',
            scan_type: 'comprehensive',
            status: 'completed',
            start_time: '2025-01-25T06:13:20Z',
            end_time: '2025-01-25T06:15:45Z',
            progress: 100,
            discovered_devices: 4,
            total_ips: 4,
            completed_ips: 4
          },
          {
            id: 2,
            name: 'Quick Network Scan',
            target: '192.168.1.0/24',
            scan_type: 'quick',
            status: 'running',
            start_time: '2025-01-25T06:20:00Z',
            end_time: null,
            progress: 65,
            discovered_devices: 12,
            total_ips: 254,
            completed_ips: 165
          },
          {
            id: 3,
            name: 'Lab Environment Scan',
            target: '10.0.0.0/16',
            scan_type: 'comprehensive',
            status: 'failed',
            start_time: '2025-01-25T05:45:00Z',
            end_time: '2025-01-25T06:00:00Z',
            progress: 25,
            discovered_devices: 0,
            total_ips: 65534,
            completed_ips: 16383,
            error_message: 'Network timeout'
          }
        ];
        setScans(mockScans);
        setFilteredScans(mockScans);
        setLoading(false);
      }, 1000);
    };

    loadScans();
  }, []);

  useEffect(() => {
    let filtered = scans;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(scan =>
        scan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.target.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(scan => scan.status === statusFilter);
    }

    setFilteredScans(filtered);
  }, [scans, searchTerm, statusFilter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <Square className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
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
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getScanTypeIcon = (scanType) => {
    switch (scanType) {
      case 'quick':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'comprehensive':
        return <Network className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getScanTypeLabel = (scanType) => {
    switch (scanType) {
      case 'quick':
        return 'Quick Scan';
      case 'comprehensive':
        return 'Comprehensive Scan';
      default:
        return 'Custom Scan';
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

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleViewResults = (scanId) => {
    // Navigate to scan results view
    console.log('View results for scan:', scanId);
  };

  const handleDownloadResults = (scanId) => {
    // Download scan results
    console.log('Download results for scan:', scanId);
  };

  const handleCancelScan = (scanId) => {
    // Cancel running scan
    console.log('Cancel scan:', scanId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-primary"></div>
              <div className="text-muted-foreground font-medium">Loading scans...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/discovery')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Discovery</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">All Scans</h1>
              <p className="text-muted-foreground">Comprehensive view of all network discovery scans</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {filteredScans.length} of {scans.length} scans
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search scans by name or target..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Status</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scans List */}
        <div className="grid gap-4">
          {filteredScans.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No scans found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'No scans have been performed yet'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredScans.map((scan) => (
              <Card key={scan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {getStatusIcon(scan.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {scan.name}
                          </h3>
                          <Badge className={cn("text-xs", getStatusColor(scan.status))}>
                            {scan.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Target</p>
                              <p className="font-medium">{scan.target}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getScanTypeIcon(scan.scan_type)}
                            <div>
                              <p className="text-muted-foreground">Type</p>
                              <p className="font-medium">{getScanTypeLabel(scan.scan_type)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Timer className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Duration</p>
                              <p className="font-medium">{formatDuration(scan.start_time, scan.end_time)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <HardDrive className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Discovered</p>
                              <p className="font-medium">{scan.discovered_devices} devices</p>
                            </div>
                          </div>
                        </div>

                        {scan.status === 'running' && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{formatScanProgress(scan.progress)}</span>
                            </div>
                            <Progress value={getCappedProgress(scan.progress)} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {scan.completed_ips} of {scan.total_ips} IPs scanned
                            </p>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 mt-4 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Started: {formatTimestamp(scan.start_time)}</span>
                          {scan.end_time && (
                            <>
                              <span>•</span>
                              <span>Ended: {formatTimestamp(scan.end_time)}</span>
                            </>
                          )}
                        </div>

                        {scan.error_message && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                            <p className="text-sm text-red-800 dark:text-red-200">
                              <strong>Error:</strong> {scan.error_message}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {scan.status === 'running' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelScan(scan.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Square className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                      
                      {scan.status === 'completed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResults(scan.id)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadResults(scan.id)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ScansView;
