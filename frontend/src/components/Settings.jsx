import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { cn } from '../utils/cn';

const Settings = () => {
  const { statusMessage, clearStatusMessage } = useApp();
  const [settings, setSettings] = useState({
    awx_url: '',
    awx_username: '',
    awx_password: '',
    awx_token: '',
    default_subnet: '172.18.0.0/16',
    scan_timeout: 300,
    max_concurrent_scans: 5,
    auto_discovery_enabled: true,
    email_notifications: false,
    email_smtp_server: '',
    email_smtp_port: 587,
    email_username: '',
    email_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        clearStatusMessage();
        // Show success message
        console.log('Settings saved successfully');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAWXConnection = async () => {
    try {
      setTestingConnection(true);
      const response = await fetch('/api/v2/settings/test-awx', {
        method: 'POST',
        headers: {
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
      
      if (result.success) {
        console.log('AWX connection test successful');
      } else {
        console.error('AWX connection test failed:', result.error);
      }
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {/* AWX Tower Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AWX Tower Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                AWX URL
              </label>
              <Input
                value={settings.awx_url}
                onChange={(e) => handleInputChange('awx_url', e.target.value)}
                placeholder="https://awx.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <Input
                value={settings.awx_username}
                onChange={(e) => handleInputChange('awx_username', e.target.value)}
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                value={settings.awx_password}
                onChange={(e) => handleInputChange('awx_password', e.target.value)}
                placeholder="password"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={testAWXConnection}
                disabled={testingConnection || !settings.awx_url}
                loading={testingConnection}
                variant="outline"
              >
                Test Connection
              </Button>
              {connectionStatus && (
                <Badge
                  className={cn(
                    'ml-2',
                    connectionStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  )}
                >
                  {connectionStatus === 'success' ? 'Connected' : 'Failed'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Scanner Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Default Subnet
              </label>
              <Input
                value={settings.default_subnet}
                onChange={(e) => handleInputChange('default_subnet', e.target.value)}
                placeholder="172.18.0.0/16"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Scan Timeout (seconds)
              </label>
              <Input
                type="number"
                value={settings.scan_timeout}
                onChange={(e) => handleInputChange('scan_timeout', parseInt(e.target.value))}
                placeholder="300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Concurrent Scans
              </label>
              <Input
                type="number"
                value={settings.max_concurrent_scans}
                onChange={(e) => handleInputChange('max_concurrent_scans', parseInt(e.target.value))}
                placeholder="5"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_discovery"
                checked={settings.auto_discovery_enabled}
                onChange={(e) => handleInputChange('auto_discovery_enabled', e.target.checked)}
                className="rounded border-slate-300"
              />
              <label htmlFor="auto_discovery" className="ml-2 text-sm font-medium text-slate-700">
                Enable Auto Discovery
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="email_notifications"
              checked={settings.email_notifications}
              onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
              className="rounded border-slate-300"
            />
            <label htmlFor="email_notifications" className="ml-2 text-sm font-medium text-slate-700">
              Enable Email Notifications
            </label>
          </div>
          
          {settings.email_notifications && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  SMTP Server
                </label>
                <Input
                  value={settings.email_smtp_server}
                  onChange={(e) => handleInputChange('email_smtp_server', e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Username
                </label>
                <Input
                  value={settings.email_username}
                  onChange={(e) => handleInputChange('email_username', e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  value={settings.email_password}
                  onChange={(e) => handleInputChange('email_password', e.target.value)}
                  placeholder="password"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end">
        <Button onClick={handleSave} loading={loading}>
          Save Settings
        </Button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={cn(
          'p-4 rounded-md border',
          statusMessage.includes('success') || statusMessage.includes('saved')
            ? 'bg-green-50 border-green-200 text-green-800'
            : statusMessage.includes('error') || statusMessage.includes('failed')
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        )}>
          <div className="flex items-center justify-between">
            <span>{statusMessage}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearStatusMessage}
              className="h-6 w-6 p-0"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;