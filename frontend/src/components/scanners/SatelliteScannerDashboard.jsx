import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { cn } from '../../utils/cn';
import { 
  Satellite, 
  Network, 
  Activity, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Wifi,
  WifiOff,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';

const SatelliteScannerDashboard = ({ onClose }) => {
  const {
    scanners,
    fetchScanners,
    createScanner,
    updateScanner,
    deleteScanner,
    testScannerConnection
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedScanner, setSelectedScanner] = useState(null);
  const [scannerForm, setScannerForm] = useState({
    name: '',
    url: '',
    subnets: [],
    is_active: true,
    max_concurrent_scans: 3,
    timeout_seconds: 300,
    location: '',
    description: '',
    contact_info: ''
  });
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(null);
  const [connectionResults, setConnectionResults] = useState({});

  useEffect(() => {
    fetchScanners();
  }, [fetchScanners]);

  const handleCreateScanner = async () => {
    setLoading(true);
    try {
      await createScanner(scannerForm);
      setShowCreateModal(false);
      setScannerForm({
        name: '',
        url: '',
        subnets: [],
        is_active: true,
        max_concurrent_scans: 3,
        timeout_seconds: 300,
        location: '',
        description: '',
        contact_info: ''
      });
    } catch (error) {
      console.error('Failed to create scanner:', error);
      alert('Failed to create scanner: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScanner = async () => {
    setLoading(true);
    try {
      await updateScanner(selectedScanner.id, scannerForm);
      setShowEditModal(false);
      setSelectedScanner(null);
    } catch (error) {
      console.error('Failed to update scanner:', error);
      alert('Failed to update scanner: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScanner = async (scannerId) => {
    if (window.confirm('Are you sure you want to delete this scanner?')) {
      try {
        await deleteScanner(scannerId);
      } catch (error) {
        console.error('Failed to delete scanner:', error);
        alert('Failed to delete scanner: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleTestConnection = async (scanner) => {
    setTestingConnection(scanner.id);
    try {
      const result = await testScannerConnection(scanner.id);
      setConnectionResults(prev => ({
        ...prev,
        [scanner.id]: result
      }));
    } catch (error) {
      setConnectionResults(prev => ({
        ...prev,
        [scanner.id]: { success: false, error: error.message }
      }));
    } finally {
      setTestingConnection(null);
    }
  };

  const getScannerStatus = (scanner) => {
    const result = connectionResults[scanner.id];
    if (testingConnection === scanner.id) {
      return { status: 'testing', color: 'yellow', icon: RefreshCw };
    } else if (result) {
      return result.success 
        ? { status: 'online', color: 'green', icon: CheckCircle }
        : { status: 'offline', color: 'red', icon: AlertCircle };
    } else if (scanner.is_active) {
      return { status: 'active', color: 'blue', icon: Activity };
    } else {
      return { status: 'inactive', color: 'gray', icon: Pause };
    }
  };

  const getScannerStats = () => {
    const total = scanners.length;
    const active = scanners.filter(s => s.is_active).length;
    const online = Object.values(connectionResults).filter(r => r?.success).length;
    const offline = total - online;

    return { total, active, online, offline };
  };

  const stats = getScannerStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Satellite className="w-6 h-6" />
                <span>Satellite Scanner Dashboard</span>
              </h2>
              <p className="text-slate-400 mt-1">
                Manage distributed scanners across your network infrastructure
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Scanner List */}
          <div className="w-2/3 border-r border-slate-800 flex flex-col">
            {/* Statistics */}
            <div className="p-6 border-b border-slate-800">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-sm text-slate-400">Total Scanners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.active}</div>
                  <div className="text-sm text-slate-400">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.online}</div>
                  <div className="text-sm text-slate-400">Online</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{stats.offline}</div>
                  <div className="text-sm text-slate-400">Offline</div>
                </div>
              </div>
            </div>

            {/* Scanner List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Satellite Scanners</h3>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Scanner</span>
                </Button>
              </div>

              <div className="space-y-4">
                {scanners.map(scanner => {
                  const status = getScannerStatus(scanner);
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card key={scanner.id} className="border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center",
                              status.color === 'green' && "bg-green-500/20 text-green-500",
                              status.color === 'red' && "bg-red-500/20 text-red-500",
                              status.color === 'yellow' && "bg-yellow-500/20 text-yellow-500",
                              status.color === 'blue' && "bg-blue-500/20 text-blue-500",
                              status.color === 'gray' && "bg-gray-500/20 text-gray-500"
                            )}>
                              <StatusIcon className={cn(
                                "w-6 h-6",
                                testingConnection === scanner.id && "animate-spin"
                              )} />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-white">{scanner.name}</h4>
                                <Badge 
                                  variant={scanner.is_active ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {scanner.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                {scanner.url} • {scanner.subnets?.length || 0} subnets
                              </div>
                              {scanner.location && (
                                <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{scanner.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestConnection(scanner)}
                              disabled={testingConnection === scanner.id}
                              className="flex items-center space-x-1"
                            >
                              <RefreshCw className={cn(
                                "w-4 h-4",
                                testingConnection === scanner.id && "animate-spin"
                              )} />
                              <span>Test</span>
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedScanner(scanner);
                                setScannerForm({
                                  name: scanner.name,
                                  url: scanner.url,
                                  subnets: scanner.subnets || [],
                                  is_active: scanner.is_active,
                                  max_concurrent_scans: scanner.max_concurrent_scans || 3,
                                  timeout_seconds: scanner.timeout_seconds || 300,
                                  location: scanner.location || '',
                                  description: scanner.description || '',
                                  contact_info: scanner.contact_info || ''
                                });
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteScanner(scanner.id)}
                              className="text-red-400 border-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Connection Result */}
                        {connectionResults[scanner.id] && (
                          <div className={cn(
                            "mt-3 p-3 rounded-lg text-sm",
                            connectionResults[scanner.id].success
                              ? "bg-green-500/10 border border-green-500/20 text-green-400"
                              : "bg-red-500/10 border border-red-500/20 text-red-400"
                          )}>
                            {connectionResults[scanner.id].success ? (
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4" />
                                <span>Connection successful</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>Connection failed: {connectionResults[scanner.id].error}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Scanner Details */}
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-slate-400">Max Concurrent Scans</div>
                            <div className="text-white">{scanner.max_concurrent_scans || 3}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Timeout</div>
                            <div className="text-white">{scanner.timeout_seconds || 300}s</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Last Seen</div>
                            <div className="text-white">
                              {scanner.last_seen ? new Date(scanner.last_seen).toLocaleString() : 'Never'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel - Scanner Details & Analytics */}
          <div className="w-1/3 p-6">
            <div className="space-y-6">
              {/* Network Topology */}
              <Card className="border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Network className="w-5 h-5" />
                    <span>Network Topology</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scanners.map(scanner => (
                      <div key={scanner.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            scanner.is_active ? "bg-green-500" : "bg-gray-500"
                          )} />
                          <span className="text-sm text-slate-300">{scanner.name}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {scanner.subnets?.length || 0} subnets
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Average Response Time</span>
                        <span className="text-white">45ms</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Success Rate</span>
                        <span className="text-white">98.5%</span>
                      </div>
                      <Progress value={98.5} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Uptime</span>
                        <span className="text-white">99.9%</span>
                      </div>
                      <Progress value={99.9} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div className="flex-1">
                        <div className="text-sm text-white">Scanner-01 completed scan</div>
                        <div className="text-xs text-slate-400">2 minutes ago</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div className="flex-1">
                        <div className="text-sm text-white">Scanner-02 started scan</div>
                        <div className="text-xs text-slate-400">5 minutes ago</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <div className="flex-1">
                        <div className="text-sm text-white">Scanner-03 connection test</div>
                        <div className="text-xs text-slate-400">10 minutes ago</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Create Scanner Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl w-full max-w-md">
              <div className="border-b border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white">Add Satellite Scanner</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Scanner Name
                  </label>
                  <Input
                    value={scannerForm.name}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter scanner name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Scanner URL
                  </label>
                  <Input
                    value={scannerForm.url}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="http://scanner.example.com:8080"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Location
                  </label>
                  <Input
                    value={scannerForm.location}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Data Center A, Rack 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Concurrent Scans
                  </label>
                  <Input
                    type="number"
                    value={scannerForm.max_concurrent_scans}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, max_concurrent_scans: parseInt(e.target.value) }))}
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Timeout (seconds)
                  </label>
                  <Input
                    type="number"
                    value={scannerForm.timeout_seconds}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) }))}
                    min="30"
                    max="3600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={scannerForm.description}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Scanner description"
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white"
                    rows={3}
                  />
                </div>
              </div>
              <div className="border-t border-slate-800 p-6">
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateScanner}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Scanner'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Scanner Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl w-full max-w-md">
              <div className="border-b border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white">Edit Satellite Scanner</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Scanner Name
                  </label>
                  <Input
                    value={scannerForm.name}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter scanner name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Scanner URL
                  </label>
                  <Input
                    value={scannerForm.url}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="http://scanner.example.com:8080"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Location
                  </label>
                  <Input
                    value={scannerForm.location}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Data Center A, Rack 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Concurrent Scans
                  </label>
                  <Input
                    type="number"
                    value={scannerForm.max_concurrent_scans}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, max_concurrent_scans: parseInt(e.target.value) }))}
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Timeout (seconds)
                  </label>
                  <Input
                    type="number"
                    value={scannerForm.timeout_seconds}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) }))}
                    min="30"
                    max="3600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={scannerForm.description}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Scanner description"
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={scannerForm.is_active}
                    onChange={(e) => setScannerForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm text-slate-300">
                    Active
                  </label>
                </div>
              </div>
              <div className="border-t border-slate-800 p-6">
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateScanner}
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Scanner'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SatelliteScannerDashboard;
