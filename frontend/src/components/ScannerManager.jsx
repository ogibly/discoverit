import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, Modal, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from './ui';
import { cn } from '../utils/cn';

const ScannerManager = () => {
  const { api } = useApp();
  const { user, hasPermission } = useAuth();
  const [scanners, setScanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingScanner, setEditingScanner] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('default');
  const [healthChecks, setHealthChecks] = useState({});
  const [statistics, setStatistics] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    subnets: [],
    is_active: true,
    max_concurrent_scans: 3,
    timeout_seconds: 300,
    is_default: false
  });

  useEffect(() => {
    loadScanners();
    loadStatistics();
  }, []);

  const loadScanners = async () => {
    try {
      const response = await api.get('/scanners');
      setScanners(response.data || []);
    } catch (error) {
      console.error('Failed to load scanners:', error);
      setScanners([]);
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

  const handleCreateScanner = async () => {
    try {
      await api.post('/scanners', formData);
      setShowCreateModal(false);
      resetForm();
      loadScanners();
    } catch (error) {
      console.error('Failed to create scanner:', error);
      alert('Failed to create scanner: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateScanner = async () => {
    try {
      await api.put(`/scanners/${editingScanner.id}`, formData);
      setShowEditModal(false);
      setEditingScanner(null);
      resetForm();
      loadScanners();
    } catch (error) {
      console.error('Failed to update scanner:', error);
      alert('Failed to update scanner: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteScanner = async (scannerId) => {
    if (!confirm('Are you sure you want to delete this scanner?')) return;
    
    try {
      await api.delete(`/scanners/${scannerId}`);
      loadScanners();
    } catch (error) {
      console.error('Failed to delete scanner:', error);
      alert('Failed to delete scanner: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditScanner = (scanner) => {
    setEditingScanner(scanner);
    setFormData({
      name: scanner.name || '',
      url: scanner.url || '',
      subnets: scanner.subnets || [],
      is_active: scanner.is_active !== false,
      max_concurrent_scans: scanner.max_concurrent_scans || 3,
      timeout_seconds: scanner.timeout_seconds || 300,
      is_default: scanner.is_default || false
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
      timeout_seconds: 300,
      is_default: false
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

  const defaultScanner = scanners.find(s => s.is_default);
  const customScanners = scanners.filter(s => !s.is_default);

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  // Check if user has admin permissions for custom scanner management
  const isAdmin = hasPermission('admin') || user?.is_superuser;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Scanner Management</h1>
          <p className="text-slate-600">
            Manage network scanner services for device discovery
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>
            + Add Custom Scanner
          </Button>
        )}
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{scanners.length}</div>
            <div className="text-sm text-slate-600">Total Scanners</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {scanners.filter(s => s.is_active).length}
            </div>
            <div className="text-sm text-slate-600">Active</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {statistics.total_scans || 0}
            </div>
            <div className="text-sm text-slate-600">Total Scans</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {statistics.active_scans || 0}
            </div>
            <div className="text-sm text-slate-600">Active Scans</div>
          </Card>
        </div>
      )}

      {/* Scanner Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="default">Default Scanner</TabsTrigger>
          <TabsTrigger value="custom">Custom Scanners ({customScanners.length})</TabsTrigger>
        </TabsList>

        {/* Default Scanner Tab */}
        <TabsContent value="default">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🖥️</span>
                <span>Default Scanner</span>
                <Badge className="bg-blue-100 text-blue-800">System</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {defaultScanner ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{defaultScanner.name}</h3>
                      <p className="text-sm text-slate-600">{defaultScanner.url}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getHealthStatusColor(healthChecks[defaultScanner.id]?.status || 'unknown')}>
                          {getHealthStatusIcon(healthChecks[defaultScanner.id]?.status || 'unknown')}
                          {healthChecks[defaultScanner.id]?.status || 'Unknown'}
                        </Badge>
                        <Badge className={defaultScanner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {defaultScanner.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      <div>Max Concurrent Scans: {defaultScanner.max_concurrent_scans}</div>
                      <div>Timeout: {defaultScanner.timeout_seconds}s</div>
                      <div>Subnets: {defaultScanner.subnets?.length || 0}</div>
                    </div>
                  </div>
                  
                  {defaultScanner.subnets && defaultScanner.subnets.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Covered Subnets</h4>
                      <div className="flex flex-wrap gap-2">
                        {defaultScanner.subnets.map((subnet, index) => (
                          <Badge key={index} variant="outline">
                            {subnet}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkHealth(defaultScanner.id)}
                    >
                      Check Health
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(defaultScanner.id)}
                    >
                      Test Connection
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditScanner(defaultScanner)}
                      >
                        Configure
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-2">🖥️</div>
                  <p>No default scanner configured. Contact your administrator.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Scanners Tab */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>🏢</span>
                  <span>Custom Scanners</span>
                </div>
                {isAdmin && (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={checkAllHealth}>
                      Check All Health
                    </Button>
                    <Button variant="outline" size="sm" onClick={syncWithSettings}>
                      Sync Settings
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isAdmin ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-2">🔒</div>
                  <p>Only administrators can manage custom scanners.</p>
                  <p className="text-sm mt-2">Contact your administrator to add custom scanner services.</p>
                </div>
              ) : customScanners.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-2">🏢</div>
                  <p>No custom scanners configured.</p>
                  <p className="text-sm mt-2">Add custom scanner services for your specific network environments.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="flex space-x-4">
                    <Input
                      placeholder="Search scanners..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  {/* Scanner List */}
                  <div className="space-y-3">
                    {customScanners.filter(scanner => 
                      !searchTerm || 
                      scanner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      scanner.url.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((scanner) => (
                      <div
                        key={scanner.id}
                        className="flex items-center space-x-4 p-4 border rounded-lg hover:border-slate-300 transition-colors"
                      >
                        <div className="text-2xl">🏢</div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-slate-900 truncate">
                              {scanner.name}
                            </h3>
                            <Badge className={getHealthStatusColor(healthChecks[scanner.id]?.status || 'unknown')}>
                              {getHealthStatusIcon(healthChecks[scanner.id]?.status || 'unknown')}
                              {healthChecks[scanner.id]?.status || 'Unknown'}
                            </Badge>
                            <Badge className={scanner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {scanner.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 truncate">
                            {scanner.url}
                          </p>
                          <div className="text-xs text-slate-500 mt-1">
                            Max Scans: {scanner.max_concurrent_scans} | 
                            Timeout: {scanner.timeout_seconds}s | 
                            Subnets: {scanner.subnets?.length || 0}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkHealth(scanner.id)}
                          >
                            Health
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testConnection(scanner.id)}
                          >
                            Test
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditScanner(scanner)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteScanner(scanner.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Scanner Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Custom Scanner"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Scanner Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter scanner name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Scanner URL *
              </label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="http://scanner.example.com:8001"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Covered Subnets (one per line)
            </label>
            <textarea
              value={formData.subnets.join('\n')}
              onChange={(e) => setFormData({...formData, subnets: e.target.value.split('\n').filter(s => s.trim())})}
              placeholder="192.168.1.0/24&#10;10.0.0.0/8"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
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
                max="10"
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
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="rounded border-slate-300"
            />
            <label className="text-sm font-medium text-slate-700">
              Active (available for scanning)
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateScanner}>
              Add Scanner
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Scanner Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Scanner"
      >
        <div className="space-y-4">
          {/* Same form as create modal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Scanner Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter scanner name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Scanner URL *
              </label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="http://scanner.example.com:8001"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Covered Subnets (one per line)
            </label>
            <textarea
              value={formData.subnets.join('\n')}
              onChange={(e) => setFormData({...formData, subnets: e.target.value.split('\n').filter(s => s.trim())})}
              placeholder="192.168.1.0/24&#10;10.0.0.0/8"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
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
                max="10"
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
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="rounded border-slate-300"
            />
            <label className="text-sm font-medium text-slate-700">
              Active (available for scanning)
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateScanner}>
              Update Scanner
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScannerManager;