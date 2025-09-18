import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button, Input, Card, Modal, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from './ui';

const ScannerManager = () => {
  const { api } = useApp();
  const [scanners, setScanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingScanner, setEditingScanner] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [healthChecks, setHealthChecks] = useState({});
  const [statistics, setStatistics] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    subnets: [],
    is_active: true,
    max_concurrent_scans: 3,
    timeout_seconds: 300
  });

  useEffect(() => {
    loadScanners();
    loadStatistics();
  }, []);

  const loadScanners = async () => {
    try {
      setLoading(true);
      const response = await api.get('/scanners');
      setScanners(response.data);
    } catch (error) {
      console.error('Failed to load scanners:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await api.get('/scanners/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const scannerData = { ...formData };
      await api.post('/scanners', scannerData);
      setShowCreateModal(false);
      resetForm();
      loadScanners();
      loadStatistics();
    } catch (error) {
      console.error('Failed to create scanner:', error);
      alert('Failed to create scanner: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdate = async () => {
    try {
      const scannerData = { ...formData };
      delete scannerData.id; // Remove ID from update data
      
      await api.put(`/scanners/${editingScanner.id}`, scannerData);
      setShowEditModal(false);
      setEditingScanner(null);
      resetForm();
      loadScanners();
      loadStatistics();
    } catch (error) {
      console.error('Failed to update scanner:', error);
      alert('Failed to update scanner: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this scanner configuration?')) return;
    
    try {
      await api.delete(`/scanners/${id}`);
      loadScanners();
      loadStatistics();
    } catch (error) {
      console.error('Failed to delete scanner:', error);
      alert('Failed to delete scanner: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (scanner) => {
    setEditingScanner(scanner);
    setFormData({
      ...scanner,
      subnets: scanner.subnets || []
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      subnets: [],
      is_active: true,
      max_concurrent_scans: 3,
      timeout_seconds: 300
    });
  };

  const checkHealth = async (scannerId) => {
    try {
      const response = await api.get(`/scanners/${scannerId}/health`);
      setHealthChecks(prev => ({
        ...prev,
        [scannerId]: response.data
      }));
    } catch (error) {
      console.error('Failed to check health:', error);
      setHealthChecks(prev => ({
        ...prev,
        [scannerId]: { status: 'error', message: 'Health check failed' }
      }));
    }
  };

  const testConnection = async (scannerId) => {
    try {
      const response = await api.post(`/scanners/${scannerId}/test`);
      alert(`Connection test: ${response.data.status}\n${response.data.message}`);
    } catch (error) {
      console.error('Failed to test connection:', error);
      alert('Connection test failed: ' + (error.response?.data?.detail || error.message));
    }
  };

  const checkAllHealth = async () => {
    try {
      const response = await api.get('/scanners/health/all');
      const healthMap = {};
      response.data.forEach(result => {
        healthMap[result.scanner_id] = result;
      });
      setHealthChecks(healthMap);
    } catch (error) {
      console.error('Failed to check all health:', error);
    }
  };

  const syncWithSettings = async () => {
    try {
      const response = await api.post('/scanners/sync-settings');
      alert(`Sync completed: ${response.data.message}`);
    } catch (error) {
      console.error('Failed to sync with settings:', error);
      alert('Failed to sync with settings: ' + (error.response?.data?.detail || error.message));
    }
  };

  const filteredScanners = scanners.filter(scanner => 
    !searchTerm || 
    scanner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scanner.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      case 'timeout': return 'text-yellow-600 bg-yellow-100';
      case 'unreachable': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Scanner Management</h1>
          <p className="text-slate-600">Manage network scanner configurations and health</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={checkAllHealth}>
            Check All Health
          </Button>
          <Button variant="secondary" onClick={syncWithSettings}>
            Sync Settings
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            + Add Scanner
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statistics.total_scanners}</div>
            <div className="text-sm text-slate-600">Total Scanners</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{statistics.active_scanners}</div>
            <div className="text-sm text-slate-600">Active Scanners</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{statistics.inactive_scanners}</div>
            <div className="text-sm text-slate-600">Inactive Scanners</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-600">{statistics.total_subnets_covered}</div>
            <div className="text-sm text-slate-600">Subnets Covered</div>
          </Card>
        </div>
      )}

      <Card>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search scanners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredScanners.map(scanner => {
              const health = healthChecks[scanner.id];
              return (
                <Card key={scanner.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-900">{scanner.name}</h3>
                      <Badge variant={scanner.is_active ? 'success' : 'secondary'}>
                        {scanner.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => checkHealth(scanner.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="Check Health"
                      >
                        🏥
                      </button>
                      <button
                        onClick={() => testConnection(scanner.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                        title="Test Connection"
                      >
                        🔌
                      </button>
                      <button
                        onClick={() => handleEdit(scanner)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(scanner.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">URL:</span>
                      <span className="font-mono text-slate-700">{scanner.url}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">Max Concurrent:</span>
                      <span>{scanner.max_concurrent_scans}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">Timeout:</span>
                      <span>{scanner.timeout_seconds}s</span>
                    </div>
                    
                    {scanner.subnets && scanner.subnets.length > 0 && (
                      <div>
                        <span className="text-slate-500">Subnets:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {scanner.subnets.map((subnet, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {subnet}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {health && (
                      <div className="mt-3 p-2 rounded-md">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(health.status)}`}>
                          {health.status.toUpperCase()}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">{health.message}</div>
                        {health.response_time && (
                          <div className="text-xs text-slate-500">Response: {health.response_time.toFixed(2)}s</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 text-xs text-slate-400">
                    Created: {new Date(scanner.created_at).toLocaleDateString()}
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredScanners.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No scanners found. Create your first scanner configuration to get started.
            </div>
          )}
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Scanner"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter scanner name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL *
              </label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="http://scanner:8001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Subnets (one per line)
            </label>
            <textarea
              value={formData.subnets.join('\n')}
              onChange={(e) => setFormData({...formData, subnets: e.target.value.split('\n').filter(s => s.trim())})}
              placeholder="192.168.1.0/24&#10;10.0.0.0/8"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Concurrent Scans
              </label>
              <Input
                type="number"
                value={formData.max_concurrent_scans}
                onChange={(e) => setFormData({...formData, max_concurrent_scans: parseInt(e.target.value)})}
                min="1"
                max="20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Timeout (seconds)
              </label>
              <Input
                type="number"
                value={formData.timeout_seconds}
                onChange={(e) => setFormData({...formData, timeout_seconds: parseInt(e.target.value)})}
                min="30"
                max="3600"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
              Active
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            Create Scanner
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingScanner(null);
          resetForm();
        }}
        title="Edit Scanner"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter scanner name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL *
              </label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="http://scanner:8001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Subnets (one per line)
            </label>
            <textarea
              value={formData.subnets.join('\n')}
              onChange={(e) => setFormData({...formData, subnets: e.target.value.split('\n').filter(s => s.trim())})}
              placeholder="192.168.1.0/24&#10;10.0.0.0/8"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Concurrent Scans
              </label>
              <Input
                type="number"
                value={formData.max_concurrent_scans}
                onChange={(e) => setFormData({...formData, max_concurrent_scans: parseInt(e.target.value)})}
                min="1"
                max="20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Timeout (seconds)
              </label>
              <Input
                type="number"
                value={formData.timeout_seconds}
                onChange={(e) => setFormData({...formData, timeout_seconds: parseInt(e.target.value)})}
                min="30"
                max="3600"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active_edit" className="text-sm font-medium text-slate-700">
              Active
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false);
              setEditingScanner(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate}>
            Update Scanner
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ScannerManager;
