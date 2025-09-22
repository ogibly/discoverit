import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import OperationsManagement from './OperationsManagement';
import { cn } from '../utils/cn';
import PageHeader from './PageHeader';

const AdminSettings = () => {
  const { 
    statusMessage, 
    clearStatusMessage,
    fetchSettings: fetchSettingsAPI,
    updateSettings: updateSettingsAPI,
    fetchUsers: fetchUsersAPI,
    createUser: createUserAPI,
    updateUser: updateUserAPI,
    deleteUser: deleteUserAPI,
    fetchRoles: fetchRolesAPI,
    fetchScannerConfigs: fetchScannerConfigsAPI
  } = useApp();
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('system');
  
  // System Settings State
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
  
  // User Management State
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role_id: '',
    is_active: true
  });

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
    if (hasPermission('admin')) {
      fetchSettings();
      fetchUsers();
      fetchRoles();
      fetchScannerConfigs();
    }
  }, [hasPermission]);

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['system', 'users', 'scanners', 'operations'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Check if user has admin permissions
  if (!hasPermission('admin')) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-subheading text-foreground mb-2">
              Access Denied
            </h2>
            <p className="text-body text-muted-foreground">
              You need administrator privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // API Functions using centralized calls
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchSettingsAPI();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await fetchUsersAPI();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await fetchRolesAPI();
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchScannerConfigs = async () => {
    try {
      const data = await fetchScannerConfigsAPI();
      setScannerConfigs(data);
    } catch (error) {
      console.error('Failed to fetch scanner configs:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      await updateSettingsAPI(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      await createUserAPI(userForm);
      setShowUserModal(false);
      setUserForm({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role_id: '',
        is_active: true
      });
      fetchUsers();
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    try {
      setLoading(true);
      await updateUserAPI(editingUser.id, userForm);
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role_id: '',
        is_active: true
      });
      fetchUsers();
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUserAPI(userId);
        fetchUsers();
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    }
  };

  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        password: '',
        role_id: user.role_id,
        is_active: user.is_active
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role_id: '',
        is_active: true
      });
    }
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({
      username: '',
      email: '',
      full_name: '',
      password: '',
      role_id: '',
      is_active: true
    });
  };

  // Scanner management functions
  const handleCreateScanner = async () => {
    try {
      const response = await fetch('/api/v2/scanners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(scannerForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create scanner');
      }

      setStatusMessage('Satellite scanner created successfully');
      setTimeout(() => setStatusMessage(null), 3000);
      setShowScannerModal(false);
      resetScannerForm();
      // Refresh scanner list
    } catch (error) {
      console.error('Failed to create scanner:', error);
      setStatusMessage('Failed to create scanner: ' + error.message);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleEditScanner = (scanner) => {
    setEditingScanner(scanner);
    setScannerForm({
      name: scanner.name,
      url: scanner.url,
      subnets: scanner.subnets || [],
      is_active: scanner.is_active,
      is_default: scanner.is_default || false,
      max_concurrent_scans: scanner.max_concurrent_scans || 3,
      timeout_seconds: scanner.timeout_seconds || 300
    });
    setShowScannerModal(true);
  };

  const handleDeleteScanner = async (scannerId) => {
    if (window.confirm('Are you sure you want to delete this satellite scanner?')) {
      try {
        const response = await fetch(`/api/v2/scanners/${scannerId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to delete scanner');
        }

        setStatusMessage('Satellite scanner deleted successfully');
        setTimeout(() => setStatusMessage(null), 3000);
        // Refresh scanner list
      } catch (error) {
        console.error('Failed to delete scanner:', error);
        setStatusMessage('Failed to delete scanner: ' + error.message);
        setTimeout(() => setStatusMessage(null), 5000);
      }
    }
  };

  const resetScannerForm = () => {
    setScannerForm({
      name: '',
      url: '',
      subnets: [],
      is_active: true,
      is_default: false,
      max_concurrent_scans: 3,
      timeout_seconds: 300
    });
    setEditingScanner(null);
  };

  const closeScannerModal = () => {
    setShowScannerModal(false);
    resetScannerForm();
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <PageHeader
        title="Admin Settings"
        subtitle="Manage system settings, users, and configurations"
        actions={[
          {
            label: "Administrator",
            variant: "secondary",
            className: "bg-primary text-primary-foreground"
          }
        ]}
      />

      {/* Status Message */}
      {statusMessage && (
        <div className="px-6 py-3 bg-info/10 border-b border-info/20">
          <div className="flex items-center justify-between">
            <span className="text-body text-info">{statusMessage}</span>
            <button
              onClick={clearStatusMessage}
              className="text-info hover:text-info/80 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system">System Settings</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="scanners">Scanner Configs</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="text-subheading text-foreground">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Default Subnet
                    </label>
                    <Input
                      value={settings.default_subnet}
                      onChange={(e) => setSettings({...settings, default_subnet: e.target.value})}
                      placeholder="172.18.0.0/16"
                    />
                  </div>
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Scan Timeout (seconds)
                    </label>
                    <Input
                      type="number"
                      value={settings.scan_timeout}
                      onChange={(e) => setSettings({...settings, scan_timeout: parseInt(e.target.value)})}
                      placeholder="300"
                    />
                  </div>
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Max Concurrent Scans
                    </label>
                    <Input
                      type="number"
                      value={settings.max_concurrent_scans}
                      onChange={(e) => setSettings({...settings, max_concurrent_scans: parseInt(e.target.value)})}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Max Discovery Depth
                    </label>
                    <Input
                      type="number"
                      value={settings.max_discovery_depth}
                      onChange={(e) => setSettings({...settings, max_discovery_depth: parseInt(e.target.value)})}
                      placeholder="3"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.auto_discovery_enabled}
                      onChange={(e) => setSettings({...settings, auto_discovery_enabled: e.target.checked})}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    <span className="text-body text-foreground">Auto Discovery Enabled</span>
                  </label>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.email_notifications}
                      onChange={(e) => setSettings({...settings, email_notifications: e.target.checked})}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    <span className="text-body text-foreground">Email Notifications</span>
                  </label>
                </div>

                <div className="pt-4">
                  <Button onClick={saveSettings} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="text-subheading text-foreground">AWX Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      AWX URL
                    </label>
                    <Input
                      value={settings.awx_url}
                      onChange={(e) => setSettings({...settings, awx_url: e.target.value})}
                      placeholder="https://awx.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Username
                    </label>
                    <Input
                      value={settings.awx_username}
                      onChange={(e) => setSettings({...settings, awx_username: e.target.value})}
                      placeholder="admin"
                    />
                  </div>
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Password
                    </label>
                    <Input
                      type="password"
                      value={settings.awx_password}
                      onChange={(e) => setSettings({...settings, awx_password: e.target.value})}
                      autoComplete="new-password"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Token
                    </label>
                    <Input
                      value={settings.awx_token}
                      onChange={(e) => setSettings({...settings, awx_token: e.target.value})}
                      placeholder="Optional API token"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="surface-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-subheading text-foreground">User Management</CardTitle>
                  <Button onClick={() => openUserModal()}>
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-md border border-border">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-subheading text-foreground">{user.full_name || user.username}</h3>
                          <p className="text-body text-muted-foreground">{user.email}</p>
                          <Badge className={user.is_active ? 'bg-success text-success-foreground' : 'bg-error text-error-foreground'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUserModal(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scanner Configs Tab */}
          <TabsContent value="scanners" className="space-y-6">
            {/* Main Scanner Configuration */}
            <Card className="surface-elevated border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-subheading text-foreground flex items-center">
                      <span className="mr-2">🎯</span>
                      Main Scanner Configuration
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Core scanner that handles all IPs/subnets not assigned to satellite scanners
                    </p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    Default
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Scanner Name
                    </label>
                    <Input
                      value="Main Scanner"
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Scanner URL
                    </label>
                    <Input
                      value="http://scanner:8001"
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Default Subnets
                    </label>
                    <Input
                      value="172.18.0.0/16, 192.168.0.0/16, 10.0.0.0/8"
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Handles all subnets not specifically assigned to satellite scanners
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-md">
                  <div className="flex items-center">
                    <span className="text-info mr-2">ℹ️</span>
                    <p className="text-sm text-info">
                      The main scanner is automatically configured and handles all network discovery requests by default.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Satellite Scanners */}
            <Card className="surface-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-subheading text-foreground flex items-center">
                      <span className="mr-2">🛰️</span>
                      Satellite Scanners
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Additional scanners for specific subnets, VLANs, or network segments
                    </p>
                  </div>
                  <Button onClick={() => setShowScannerModal(true)}>
                    Add Satellite Scanner
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {scannerConfigs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🛰️</div>
                    <h3 className="text-subheading text-foreground mb-2">No Satellite Scanners</h3>
                    <p className="text-body text-muted-foreground mb-4">
                      Add satellite scanners to enhance discovery capabilities for specific network segments.
                    </p>
                    <Button onClick={() => setShowScannerModal(true)}>
                      Add Your First Satellite Scanner
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scannerConfigs.map((config) => (
                      <div key={config.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-md border border-border">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-subheading text-foreground">{config.name}</h3>
                            {config.is_default && (
                              <Badge className="bg-primary text-primary-foreground text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-body text-muted-foreground mb-2">{config.url}</p>
                          <div className="flex items-center space-x-2">
                            <Badge className={config.is_active ? 'bg-success text-success-foreground' : 'bg-error text-error-foreground'}>
                              {config.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Subnets: {config.subnets?.length || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditScanner(config)}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteScanner(config.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="space-y-6">
            <OperationsManagement />
          </TabsContent>
        </Tabs>
      </div>

      {/* User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={closeUserModal}
        title={editingUser ? 'Edit User' : 'Create User'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Username
            </label>
            <Input
              value={userForm.username}
              onChange={(e) => setUserForm({...userForm, username: e.target.value})}
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Email
            </label>
            <Input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({...userForm, email: e.target.value})}
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Full Name
            </label>
            <Input
              value={userForm.full_name}
              onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Password
            </label>
            <Input
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm({...userForm, password: e.target.value})}
              autoComplete="new-password"
              placeholder="Enter password"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Role
            </label>
            <select
              value={userForm.role_id}
              onChange={(e) => setUserForm({...userForm, role_id: e.target.value})}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={userForm.is_active}
              onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})}
              className="rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-body text-foreground">Active</span>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={closeUserModal}>
              Cancel
            </Button>
            <Button onClick={editingUser ? handleUpdateUser : handleCreateUser} disabled={loading}>
              {loading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Scanner Modal */}
      <Modal
        isOpen={showScannerModal}
        onClose={closeScannerModal}
        title={editingScanner ? 'Edit Satellite Scanner' : 'Add Satellite Scanner'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Scanner Name
            </label>
            <Input
              value={scannerForm.name}
              onChange={(e) => setScannerForm({...scannerForm, name: e.target.value})}
              placeholder="e.g., Branch Office Scanner"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Scanner URL
            </label>
            <Input
              value={scannerForm.url}
              onChange={(e) => setScannerForm({...scannerForm, url: e.target.value})}
              placeholder="e.g., http://scanner2:8001"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Assigned Subnets
            </label>
            <Input
              value={scannerForm.subnets.join(', ')}
              onChange={(e) => setScannerForm({...scannerForm, subnets: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
              placeholder="e.g., 192.168.1.0/24, 10.0.1.0/24"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated list of subnets this scanner should handle
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Max Concurrent Scans
              </label>
              <Input
                type="number"
                value={scannerForm.max_concurrent_scans}
                onChange={(e) => setScannerForm({...scannerForm, max_concurrent_scans: parseInt(e.target.value)})}
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Timeout (seconds)
              </label>
              <Input
                type="number"
                value={scannerForm.timeout_seconds}
                onChange={(e) => setScannerForm({...scannerForm, timeout_seconds: parseInt(e.target.value)})}
                min="60"
                max="3600"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scannerForm.is_active}
                onChange={(e) => setScannerForm({...scannerForm, is_active: e.target.checked})}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">Active</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scannerForm.is_default}
                onChange={(e) => setScannerForm({...scannerForm, is_default: e.target.checked})}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">Default Scanner</span>
            </label>
          </div>
          <div className="p-3 bg-info/10 border border-info/20 rounded-md">
            <div className="flex items-center">
              <span className="text-info mr-2">ℹ️</span>
              <p className="text-sm text-info">
                Satellite scanners are used for specific network segments. The main scanner handles all other requests.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={closeScannerModal}>
              Cancel
            </Button>
            <Button onClick={handleCreateScanner}>
              {editingScanner ? 'Update Scanner' : 'Add Scanner'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSettings;