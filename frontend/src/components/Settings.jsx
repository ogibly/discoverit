import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { cn } from '../utils/cn';

const Settings = () => {
  const { statusMessage, clearStatusMessage } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    awx_url: '',
    awx_username: '',
    awx_password: '',
    awx_token: '',
    default_subnet: '172.18.0.0/16',
    scan_timeout: 300,
    max_concurrent_scans: 5,
    auto_discovery_enabled: true,
    max_discovery_depth: 3,
    email_notifications: false,
    email_smtp_server: '',
    email_smtp_port: 587,
    email_username: '',
    email_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  
  // Scanner configurations state
  const [scannerConfigs, setScannerConfigs] = useState([]);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [editingScanner, setEditingScanner] = useState(null);
  const [scannerForm, setScannerForm] = useState({
    name: '',
    url: '',
    subnets: [],
    is_active: true,
    is_default: false,
    max_concurrent_scans: 3,
    timeout_seconds: 300
  });

  useEffect(() => {
    fetchSettings();
    fetchScannerConfigs();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/v2/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v2/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        console.log('Settings saved successfully');
      } else {
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAWXConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      const response = await fetch('/api/v2/awx/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          awx_url: settings.awx_url,
          awx_username: settings.awx_username,
          awx_password: settings.awx_password
        }),
      });
      
      const result = await response.json();
      setConnectionStatus(result.success ? 'success' : 'error');
    } catch (error) {
      console.error('Failed to test AWX connection:', error);
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchScannerConfigs = async () => {
    try {
      const response = await fetch('/api/v2/scanners', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setScannerConfigs(data);
      }
    } catch (error) {
      console.error('Failed to fetch scanner configs:', error);
    }
  };

  const handleCreateScanner = async () => {
    try {
      const response = await fetch('/api/v2/scanners', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scannerForm),
      });
      
      if (response.ok) {
        setShowScannerModal(false);
        setScannerForm({
          name: '',
          url: '',
          subnets: [],
          is_active: true,
          is_default: false,
          max_concurrent_scans: 3,
          timeout_seconds: 300
        });
        fetchScannerConfigs();
      }
    } catch (error) {
      console.error('Failed to create scanner:', error);
    }
  };

  const handleDeleteScanner = async (id) => {
    if (!confirm('Are you sure you want to delete this scanner?')) return;
    
    try {
      const response = await fetch(`/api/v2/scanners/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        fetchScannerConfigs();
      }
    } catch (error) {
      console.error('Failed to delete scanner:', error);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', description: 'Basic application settings' },
    { id: 'awx', label: 'AWX Tower', description: 'Automation platform integration' },
    { id: 'scanners', label: 'Scanners', description: 'Network scanner configurations' },
    { id: 'notifications', label: 'Notifications', description: 'Email and alert settings' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">Configure application settings and integrations</p>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={cn(
          "p-4 rounded-lg border",
          statusMessage.type === 'success' 
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
        )}>
          <div className="flex justify-between items-center">
            <span>{statusMessage.message}</span>
            <button onClick={clearStatusMessage} className="text-current hover:opacity-70">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Default Subnet
                    </label>
                    <Input
                      value={settings.default_subnet}
                      onChange={(e) => handleInputChange('default_subnet', e.target.value)}
                      placeholder="172.18.0.0/16"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Scan Timeout (seconds)
                    </label>
                    <Input
                      type="number"
                      value={settings.scan_timeout}
                      onChange={(e) => handleInputChange('scan_timeout', parseInt(e.target.value))}
                      min="30"
                      max="3600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Max Concurrent Scans
                    </label>
                    <Input
                      type="number"
                      value={settings.max_concurrent_scans}
                      onChange={(e) => handleInputChange('max_concurrent_scans', parseInt(e.target.value))}
                      min="1"
                      max="20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Max Discovery Depth
                    </label>
                    <Input
                      type="number"
                      value={settings.max_discovery_depth}
                      onChange={(e) => handleInputChange('max_discovery_depth', parseInt(e.target.value))}
                      min="1"
                      max="5"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto_discovery"
                    checked={settings.auto_discovery_enabled}
                    onChange={(e) => handleInputChange('auto_discovery_enabled', e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="auto_discovery" className="text-sm text-slate-700 dark:text-slate-300">
                    Enable automatic discovery
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AWX Tower Settings */}
        {activeTab === 'awx' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AWX Tower Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        AWX URL
                      </label>
                      <Input
                        value={settings.awx_url}
                        onChange={(e) => handleInputChange('awx_url', e.target.value)}
                        placeholder="https://awx.example.com"
                        autoComplete="url"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Username
                      </label>
                      <Input
                        value={settings.awx_username}
                        onChange={(e) => handleInputChange('awx_username', e.target.value)}
                        placeholder="admin"
                        autoComplete="username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Password
                      </label>
                      <Input
                        type="password"
                        value={settings.awx_password}
                        onChange={(e) => handleInputChange('awx_password', e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                </form>
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={testAWXConnection}
                    disabled={testingConnection}
                    variant="outline"
                    size="sm"
                  >
                    {testingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                  {connectionStatus && (
                    <Badge variant={connectionStatus === 'success' ? 'success' : 'destructive'}>
                      {connectionStatus === 'success' ? 'Connected' : 'Failed'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scanner Settings */}
        {activeTab === 'scanners' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Scanner Configurations</CardTitle>
                  <Button onClick={() => setShowScannerModal(true)} size="sm">
                    Add Scanner
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scannerConfigs.map((scanner) => (
                    <div key={scanner.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100">{scanner.name}</h3>
                          {scanner.is_default && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          <Badge variant={scanner.is_active ? 'success' : 'secondary'}>
                            {scanner.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {scanner.url} • {scanner.subnets?.join(', ') || 'No subnets'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingScanner(scanner);
                            setScannerForm(scanner);
                            setShowScannerModal(true);
                          }}
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="email_notifications"
                    checked={settings.email_notifications}
                    onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="email_notifications" className="text-sm text-slate-700 dark:text-slate-300">
                    Enable email notifications
                  </label>
                </div>
                {settings.email_notifications && (
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          SMTP Server
                        </label>
                        <Input
                          value={settings.email_smtp_server}
                          onChange={(e) => handleInputChange('email_smtp_server', e.target.value)}
                          placeholder="smtp.gmail.com"
                          autoComplete="url"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          SMTP Port
                        </label>
                        <Input
                          type="number"
                          value={settings.email_smtp_port}
                          onChange={(e) => handleInputChange('email_smtp_port', parseInt(e.target.value))}
                          placeholder="587"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Username
                        </label>
                        <Input
                          value={settings.email_username}
                          onChange={(e) => handleInputChange('email_username', e.target.value)}
                          placeholder="user@example.com"
                          autoComplete="email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Password
                        </label>
                        <Input
                          type="password"
                          value={settings.email_password}
                          onChange={(e) => handleInputChange('email_password', e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                      </div>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Scanner Modal */}
      <Modal
        isOpen={showScannerModal}
        onClose={() => {
          setShowScannerModal(false);
          setEditingScanner(null);
          setScannerForm({
            name: '',
            url: '',
            subnets: [],
            is_active: true,
            is_default: false,
            max_concurrent_scans: 3,
            timeout_seconds: 300
          });
        }}
        title={editingScanner ? 'Edit Scanner' : 'Add Scanner'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name
            </label>
            <Input
              value={scannerForm.name}
              onChange={(e) => setScannerForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Scanner Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              URL
            </label>
            <Input
              value={scannerForm.url}
              onChange={(e) => setScannerForm(prev => ({ ...prev, url: e.target.value }))}
              placeholder="http://scanner:8001"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={scannerForm.is_active}
                onChange={(e) => setScannerForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <label htmlFor="is_active" className="text-sm text-slate-700 dark:text-slate-300">
                Active
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_default"
                checked={scannerForm.is_default}
                onChange={(e) => setScannerForm(prev => ({ ...prev, is_default: e.target.checked }))}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <label htmlFor="is_default" className="text-sm text-slate-700 dark:text-slate-300">
                Default Scanner
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowScannerModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateScanner}>
              {editingScanner ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;