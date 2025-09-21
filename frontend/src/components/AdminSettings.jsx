import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { cn } from '../utils/cn';

const AdminSettings = () => {
  const { statusMessage, clearStatusMessage } = useApp();
  const { hasPermission } = useAuth();
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

  // Check if user has admin permissions
  if (!hasPermission('admin')) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-100 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-400">
              You need administrator privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/v2/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/v2/roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchScannerConfigs = async () => {
    try {
      const response = await fetch('/api/v2/scanner-configs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setScannerConfigs(data);
      }
    } catch (error) {
      console.error('Failed to fetch scanner configs:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
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
      const response = await fetch('/api/v2/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      });
      
      if (response.ok) {
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
      } else {
        alert('Failed to create user');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      });
      
      if (response.ok) {
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
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchUsers();
        alert('User deleted successfully!');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    } finally {
      setLoading(false);
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

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-100 flex items-center">
                <span className="mr-2">⚙️</span>
                Admin Settings
              </h1>
              <p className="text-sm text-gray-400">
                System configuration and user management
              </p>
            </div>
            <Badge className="bg-red-900 text-red-200">
              Admin Only
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="system">System Settings</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="scanners">Scanner Configs</TabsTrigger>
            </TabsList>

            {/* System Settings Tab */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Default Subnet
                      </label>
                      <Input
                        value={settings.default_subnet}
                        onChange={(e) => setSettings({...settings, default_subnet: e.target.value})}
                        placeholder="172.18.0.0/16"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto_discovery"
                      checked={settings.auto_discovery_enabled}
                      onChange={(e) => setSettings({...settings, auto_discovery_enabled: e.target.checked})}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="auto_discovery" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Enable Auto Discovery
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="email_notifications"
                      checked={settings.email_notifications}
                      onChange={(e) => setSettings({...settings, email_notifications: e.target.checked})}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="email_notifications" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Enable Email Notifications
                    </label>
                  </div>

                  <div className="pt-4">
                    <Button onClick={saveSettings} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AWX Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        AWX URL
                      </label>
                      <Input
                        value={settings.awx_url}
                        onChange={(e) => setSettings({...settings, awx_url: e.target.value})}
                        placeholder="https://awx.example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        AWX Username
                      </label>
                      <Input
                        value={settings.awx_username}
                        onChange={(e) => setSettings({...settings, awx_username: e.target.value})}
                        placeholder="admin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        AWX Password
                      </label>
                      <Input
                        type="password"
                        value={settings.awx_password}
                        onChange={(e) => setSettings({...settings, awx_password: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        AWX Token
                      </label>
                      <Input
                        type="password"
                        value={settings.awx_token}
                        onChange={(e) => setSettings({...settings, awx_token: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>User Management</CardTitle>
                    <Button onClick={() => openUserModal()}>
                      Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900 dark:text-slate-100">
                              {user.full_name || user.username}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {user.email} • {user.role?.name || 'No Role'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUserModal(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
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
            </TabsContent>

            {/* Scanner Configs Tab */}
            <TabsContent value="scanners" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Scanner Configurations</CardTitle>
                    <Button onClick={() => setShowScannerModal(true)}>
                      Add Scanner
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scannerConfigs.map((scanner) => (
                      <div key={scanner.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-100">
                            {scanner.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {scanner.url} • Max Scans: {scanner.max_concurrent_scans}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={scanner.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'}>
                            {scanner.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {scanner.is_default && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editingUser ? 'Edit User' : 'Create User'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Username *
              </label>
              <Input
                value={userForm.username}
                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email *
              </label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <Input
                value={userForm.full_name}
                onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password {!editingUser && '*'}
              </label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Role *
              </label>
              <select
                value={userForm.role_id}
                onChange={(e) => setUserForm({...userForm, role_id: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Role</option>
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
                id="is_active"
                checked={userForm.is_active}
                onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Active
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowUserModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={editingUser ? handleUpdateUser : handleCreateUser}
              disabled={loading || !userForm.username || !userForm.email || !userForm.role_id || (!editingUser && !userForm.password)}
            >
              {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSettings;
