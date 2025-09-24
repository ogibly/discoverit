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
    fetchScannerConfigs: fetchScannerConfigsAPI,
    fetchLDAPConfigs,
    createLDAPConfig,
    updateLDAPConfig,
    deleteLDAPConfig,
    testLDAPConnection,
    syncLDAPUsers,
    fetchIPRanges,
    createIPRange,
    updateIPRange,
    deleteIPRange
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

  // LDAP configuration state
  const [ldapConfigs, setLdapConfigs] = useState([]);
  const [showLDAPModal, setShowLDAPModal] = useState(false);
  const [editingLDAP, setEditingLDAP] = useState(null);
  const [ldapForm, setLdapForm] = useState({
    name: '',
    server_url: '',
    bind_dn: '',
    bind_password: '',
    user_search_base: '',
    user_search_filter: '',
    group_search_base: '',
    group_search_filter: '',
    is_default: false,
    is_active: true
  });

  // IP Range management state
  const [ipRanges, setIpRanges] = useState([]);
  const [showIPRangeModal, setShowIPRangeModal] = useState(false);
  const [editingIPRange, setEditingIPRange] = useState(null);
  const [ipRangeForm, setIpRangeForm] = useState({
    name: '',
    description: '',
    ip_range: '',
    range_type: 'cidr',
    is_restrictive: true,
    priority: 0,
    is_active: true
  });

  // Role management state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: []
  });

  useEffect(() => {
    if (hasPermission('admin')) {
      fetchSettings();
      fetchUsers();
      fetchRoles();
      fetchScannerConfigsAPI();
      loadLDAPConfigs();
      loadIPRanges();
    }
  }, [hasPermission]);

  // Load LDAP configurations
  const loadLDAPConfigs = async () => {
    try {
      const configs = await fetchLDAPConfigs();
      setLdapConfigs(configs);
    } catch (error) {
      console.error('Failed to load LDAP configurations:', error);
    }
  };

  // Load IP ranges
  const loadIPRanges = async () => {
    try {
      const ranges = await fetchIPRanges();
      setIpRanges(ranges);
    } catch (error) {
      console.error('Failed to load IP ranges:', error);
    }
  };

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['system', 'users', 'ldap', 'ip-ranges', 'permissions', 'awx', 'scanners', 'operations'].includes(tabParam)) {
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

  // LDAP management functions
  const handleCreateLDAP = async () => {
    try {
      const config = await createLDAPConfig(ldapForm);
      setLdapConfigs([...ldapConfigs, config]);
      setShowLDAPModal(false);
      setLdapForm({
        name: '',
        server_url: '',
        bind_dn: '',
        bind_password: '',
        user_search_base: '',
        user_search_filter: '',
        group_search_base: '',
        group_search_filter: '',
        is_default: false,
        is_active: true
      });
      alert('LDAP configuration created successfully!');
    } catch (error) {
      console.error('Failed to create LDAP config:', error);
      alert('Failed to create LDAP configuration: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditLDAP = (config) => {
    setEditingLDAP(config);
    setLdapForm({
      name: config.name,
      server_url: config.server_url,
      bind_dn: config.bind_dn,
      bind_password: config.bind_password,
      user_search_base: config.user_search_base,
      user_search_filter: config.user_search_filter,
      group_search_base: config.group_search_base,
      group_search_filter: config.group_search_filter,
      is_default: config.is_default,
      is_active: config.is_active
    });
    setShowLDAPModal(true);
  };

  const handleUpdateLDAP = async () => {
    try {
      const config = await updateLDAPConfig(editingLDAP.id, ldapForm);
      setLdapConfigs(ldapConfigs.map(c => c.id === editingLDAP.id ? config : c));
      setShowLDAPModal(false);
      setEditingLDAP(null);
      setLdapForm({
        name: '',
        server_url: '',
        bind_dn: '',
        bind_password: '',
        user_search_base: '',
        user_search_filter: '',
        group_search_base: '',
        group_search_filter: '',
        is_default: false,
        is_active: true
      });
      alert('LDAP configuration updated successfully!');
    } catch (error) {
      console.error('Failed to update LDAP config:', error);
      alert('Failed to update LDAP configuration: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteLDAP = async (ldapId) => {
    if (confirm('Are you sure you want to delete this LDAP configuration?')) {
      try {
        await deleteLDAPConfig(ldapId);
        setLdapConfigs(ldapConfigs.filter(c => c.id !== ldapId));
        alert('LDAP configuration deleted successfully!');
      } catch (error) {
        console.error('Failed to delete LDAP config:', error);
        alert('Failed to delete LDAP configuration: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleTestLDAPConnection = async (configId) => {
    try {
      const result = await testLDAPConnection(configId);
      if (result.success) {
        alert('LDAP connection test successful!');
      } else {
        alert('LDAP connection test failed: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to test LDAP connection:', error);
      alert('Failed to test LDAP connection: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSyncLDAPUsers = async (configId) => {
    try {
      const result = await syncLDAPUsers(configId);
      alert(`LDAP user sync completed. ${result.synced_users || 0} users synchronized.`);
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Failed to sync LDAP users:', error);
      alert('Failed to sync LDAP users: ' + (error.response?.data?.detail || error.message));
    }
  };

  // IP Range management functions
  const handleCreateIPRange = async () => {
    try {
      const range = await createIPRange(ipRangeForm);
      setIpRanges([...ipRanges, range]);
      setShowIPRangeModal(false);
      setIpRangeForm({
        name: '',
        description: '',
        ip_range: '',
        range_type: 'cidr',
        is_restrictive: true,
        priority: 0,
        is_active: true
      });
      alert('IP Range created successfully!');
    } catch (error) {
      console.error('Failed to create IP range:', error);
      alert('Failed to create IP range: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditIPRange = (range) => {
    setEditingIPRange(range);
    setIpRangeForm({
      name: range.name,
      description: range.description,
      ip_range: range.ip_range,
      range_type: range.range_type,
      is_restrictive: range.is_restrictive,
      priority: range.priority,
      is_active: range.is_active
    });
    setShowIPRangeModal(true);
  };

  const handleUpdateIPRange = async () => {
    try {
      const range = await updateIPRange(editingIPRange.id, ipRangeForm);
      setIpRanges(ipRanges.map(r => r.id === editingIPRange.id ? range : r));
      setShowIPRangeModal(false);
      setEditingIPRange(null);
      setIpRangeForm({
        name: '',
        description: '',
        ip_range: '',
        range_type: 'cidr',
        is_restrictive: true,
        priority: 0,
        is_active: true
      });
      alert('IP Range updated successfully!');
    } catch (error) {
      console.error('Failed to update IP range:', error);
      alert('Failed to update IP range: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteIPRange = async (rangeId) => {
    if (confirm('Are you sure you want to delete this IP range?')) {
      try {
        await deleteIPRange(rangeId);
        setIpRanges(ipRanges.filter(r => r.id !== rangeId));
        alert('IP Range deleted successfully!');
      } catch (error) {
        console.error('Failed to delete IP range:', error);
        alert('Failed to delete IP range: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  // Role management functions (placeholder)
  const handleCreateRole = async () => {
    console.log('Create role:', roleForm);
    // TODO: Implement role creation
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (roleId) => {
    console.log('Delete role:', roleId);
    // TODO: Implement role deletion
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <PageHeader
        title="Admin Settings"
        subtitle="Manage system settings, users, and configurations"
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
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="system">System Settings</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="ldap">LDAP Integration</TabsTrigger>
            <TabsTrigger value="ip-ranges">IP Ranges</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="awx">AWX Integration</TabsTrigger>
            <TabsTrigger value="scanners">Scanner Configs</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            {/* Discovery Engine Settings */}
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="text-subheading text-foreground flex items-center">
                  <span className="mr-2">🔍</span>
                  Discovery Engine Configuration
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure the core network discovery engine behavior and performance
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Default Scan Range
                    </label>
                    <Input
                      value={settings.default_subnet}
                      onChange={(e) => setSettings({...settings, default_subnet: e.target.value})}
                      placeholder="10.0.0.0/8"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default IP range for new discovery scans
                    </p>
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
                      min="60"
                      max="3600"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum time allowed for individual scans
                    </p>
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
                      min="1"
                      max="20"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum number of simultaneous scans
                    </p>
                  </div>
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Discovery Depth
                    </label>
                    <Input
                      type="number"
                      value={settings.max_discovery_depth}
                      onChange={(e) => setSettings({...settings, max_discovery_depth: parseInt(e.target.value)})}
                      placeholder="3"
                      min="1"
                      max="10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How deep to traverse network relationships
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance & Resource Settings */}
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="text-subheading text-foreground flex items-center">
                  <span className="mr-2">⚡</span>
                  Performance & Resource Management
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Optimize system performance and resource utilization
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Result Cache Duration (hours)
                    </label>
                    <Input
                      type="number"
                      value={settings.cache_duration || 24}
                      onChange={(e) => setSettings({...settings, cache_duration: parseInt(e.target.value)})}
                      placeholder="24"
                      min="1"
                      max="168"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How long to cache scan results before re-scanning
                    </p>
                  </div>
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Background Scan Interval (minutes)
                    </label>
                    <Input
                      type="number"
                      value={settings.background_scan_interval || 60}
                      onChange={(e) => setSettings({...settings, background_scan_interval: parseInt(e.target.value)})}
                      placeholder="60"
                      min="5"
                      max="1440"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How often to run background discovery scans
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-body font-medium text-foreground">Auto Discovery</label>
                      <p className="text-xs text-muted-foreground">Automatically discover new devices on the network</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.auto_discovery_enabled}
                        onChange={(e) => setSettings({...settings, auto_discovery_enabled: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-body font-medium text-foreground">Smart Scheduling</label>
                      <p className="text-xs text-muted-foreground">Schedule scans during low-activity periods</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.smart_scheduling || false}
                        onChange={(e) => setSettings({...settings, smart_scheduling: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="text-subheading text-foreground flex items-center">
                  <span className="mr-2">🔔</span>
                  Notification & Alerting
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure how and when to receive notifications about scan results
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-body font-medium text-foreground">Email Notifications</label>
                      <p className="text-xs text-muted-foreground">Send scan completion alerts via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email_notifications}
                        onChange={(e) => setSettings({...settings, email_notifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-body font-medium text-foreground">Critical Device Alerts</label>
                      <p className="text-xs text-muted-foreground">Alert when critical devices go offline</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.critical_device_alerts || false}
                        onChange={(e) => setSettings({...settings, critical_device_alerts: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-body font-medium text-foreground">New Device Discovery</label>
                      <p className="text-xs text-muted-foreground">Notify when new devices are discovered</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.new_device_notifications || false}
                        onChange={(e) => setSettings({...settings, new_device_notifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="pt-4">
              <Button onClick={saveSettings} disabled={loading} className="w-full md:w-auto">
                {loading ? 'Saving...' : 'Save All Settings'}
              </Button>
            </div>
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

          {/* LDAP Integration Tab */}
          <TabsContent value="ldap" className="space-y-6">
            <Card className="surface-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-subheading text-foreground flex items-center">
                      <span className="mr-2">🔐</span>
                      LDAP Configuration
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure LDAP authentication and user synchronization
                    </p>
                  </div>
                  <Button onClick={() => setShowLDAPModal(true)}>
                    Add LDAP Server
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ldapConfigs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔐</div>
                    <h3 className="text-subheading text-foreground mb-2">LDAP Integration</h3>
                    <p className="text-body text-muted-foreground mb-4">
                      Configure LDAP servers for centralized authentication and user management.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Active Directory integration</p>
                      <p>• User synchronization</p>
                      <p>• Group-based role mapping</p>
                      <p>• Secure authentication</p>
                    </div>
                    <Button onClick={() => setShowLDAPModal(true)} className="mt-4">
                      Configure LDAP Server
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ldapConfigs.map((config) => (
                      <div key={config.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-md border border-border">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground font-semibold">LDAP</span>
                          </div>
                          <div>
                            <h3 className="text-subheading text-foreground">{config.name}</h3>
                            <p className="text-body text-muted-foreground">{config.server_url}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={config.is_active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                                {config.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              {config.is_default && (
                                <Badge className="bg-info text-info-foreground">Default</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestLDAPConnection(config.id)}
                          >
                            Test
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncLDAPUsers(config.id)}
                          >
                            Sync Users
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditLDAP(config)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteLDAP(config.id)}
                          >
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

          {/* IP Ranges Management Tab */}
          <TabsContent value="ip-ranges" className="space-y-6">
            <Card className="surface-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-subheading text-foreground flex items-center">
                      <span className="mr-2">🌐</span>
                      IP Range Management
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Define IP ranges and assign access permissions to users
                    </p>
                  </div>
                  <Button onClick={() => setShowIPRangeModal(true)}>
                    Add IP Range
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ipRanges.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🌐</div>
                    <h3 className="text-subheading text-foreground mb-2">IP Range Access Control</h3>
                    <p className="text-body text-muted-foreground mb-4">
                      Create IP ranges and control user access to specific network segments.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• CIDR notation support</p>
                      <p>• IP range definitions</p>
                      <p>• User access restrictions</p>
                      <p>• Priority-based rules</p>
                    </div>
                    <Button onClick={() => setShowIPRangeModal(true)} className="mt-4">
                      Create IP Range
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ipRanges.map((range) => (
                      <div key={range.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-md border border-border">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground font-semibold">IP</span>
                          </div>
                          <div>
                            <h3 className="text-subheading text-foreground">{range.name}</h3>
                            <p className="text-body text-muted-foreground">{range.ip_range}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={range.is_active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                                {range.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge className={range.is_restrictive ? "bg-warning text-warning-foreground" : "bg-info text-info-foreground"}>
                                {range.is_restrictive ? 'Restrictive' : 'Permissive'}
                              </Badge>
                              <Badge className="bg-secondary text-secondary-foreground">
                                Priority: {range.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditIPRange(range)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteIPRange(range.id)}
                          >
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

          {/* Permissions Management Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card className="surface-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-subheading text-foreground flex items-center">
                      <span className="mr-2">🛡️</span>
                      Role & Permission Management
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage user roles and define granular permissions
                    </p>
                  </div>
                  <Button onClick={() => setShowRoleModal(true)}>
                    Add Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-md border border-border">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-semibold">
                            {role.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-subheading text-foreground">{role.name}</h3>
                          <p className="text-body text-muted-foreground">{role.description || 'No description'}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className="bg-info text-info-foreground">
                              {role.permissions?.length || 0} permissions
                            </Badge>
                            <Badge className="bg-success text-success-foreground">
                              {users.filter(u => u.role_id === role.id).length} users
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
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

          {/* AWX Integration Tab */}
          <TabsContent value="awx" className="space-y-6">
            {/* AWX Connection Settings */}
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="text-subheading text-foreground flex items-center">
                  <span className="mr-2">🔗</span>
                  AWX/Ansible Tower Connection
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure connection to your AWX or Ansible Tower instance
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-body font-medium text-foreground mb-2">
                      AWX/Tower URL
                    </label>
                    <Input
                      value={settings.awx_url}
                      onChange={(e) => setSettings({...settings, awx_url: e.target.value})}
                      placeholder="https://awx.example.com or https://tower.company.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Full URL to your AWX or Ansible Tower instance
                    </p>
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
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-body font-medium text-foreground mb-2">
                      API Token (Recommended)
                    </label>
                    <Input
                      type="password"
                      value={settings.awx_token}
                      onChange={(e) => setSettings({...settings, awx_token: e.target.value})}
                      placeholder="Optional: More secure than username/password"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Generate from AWX/Tower: User → Tokens → Create Token
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">Connection Status</p>
                    <p className="text-xs text-muted-foreground">
                      {settings.awx_connected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {/* Test connection logic */}}
                  >
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Job Template Management */}
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="text-subheading text-foreground flex items-center">
                  <span className="mr-2">📋</span>
                  Job Template Configuration
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Map discovery operations to AWX job templates
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* Network Discovery Template */}
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground">Network Discovery</h4>
                        <p className="text-xs text-muted-foreground">Basic network scanning and device discovery</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          settings.awx_network_discovery_template ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {settings.awx_network_discovery_template ? 'Configured' : 'Not Set'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Job Template ID
                        </label>
                        <Input
                          value={settings.awx_network_discovery_template || ''}
                          onChange={(e) => setSettings({...settings, awx_network_discovery_template: e.target.value})}
                          placeholder="e.g., 15"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Extra Variables
                        </label>
                        <Input
                          value={settings.awx_network_discovery_vars || ''}
                          onChange={(e) => setSettings({...settings, awx_network_discovery_vars: e.target.value})}
                          placeholder='{"scan_type": "comprehensive"}'
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Device Configuration Template */}
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground">Device Configuration</h4>
                        <p className="text-xs text-muted-foreground">Configure discovered devices with Ansible playbooks</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          settings.awx_device_config_template ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {settings.awx_device_config_template ? 'Configured' : 'Not Set'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Job Template ID
                        </label>
                        <Input
                          value={settings.awx_device_config_template || ''}
                          onChange={(e) => setSettings({...settings, awx_device_config_template: e.target.value})}
                          placeholder="e.g., 23"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Extra Variables
                        </label>
                        <Input
                          value={settings.awx_device_config_vars || ''}
                          onChange={(e) => setSettings({...settings, awx_device_config_vars: e.target.value})}
                          placeholder='{"config_type": "baseline"}'
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Assessment Template */}
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground">Security Assessment</h4>
                        <p className="text-xs text-muted-foreground">Run security scans and compliance checks</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          settings.awx_security_template ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {settings.awx_security_template ? 'Configured' : 'Not Set'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Job Template ID
                        </label>
                        <Input
                          value={settings.awx_security_template || ''}
                          onChange={(e) => setSettings({...settings, awx_security_template: e.target.value})}
                          placeholder="e.g., 31"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Extra Variables
                        </label>
                        <Input
                          value={settings.awx_security_vars || ''}
                          onChange={(e) => setSettings({...settings, awx_security_vars: e.target.value})}
                          placeholder='{"scan_profile": "comprehensive"}'
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workflow Integration */}
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="text-subheading text-foreground flex items-center">
                  <span className="mr-2">🔄</span>
                  Workflow Integration
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure automated workflows and job chaining
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-body font-medium text-foreground">Auto-trigger Configuration</label>
                      <p className="text-xs text-muted-foreground">Automatically run device configuration after discovery</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.awx_auto_config || false}
                        onChange={(e) => setSettings({...settings, awx_auto_config: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-body font-medium text-foreground">Security Assessment on New Devices</label>
                      <p className="text-xs text-muted-foreground">Run security scans on newly discovered devices</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.awx_auto_security || false}
                        onChange={(e) => setSettings({...settings, awx_auto_security: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-body font-medium text-foreground">Inventory Synchronization</label>
                      <p className="text-xs text-muted-foreground">Sync discovered devices to AWX inventory</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.awx_sync_inventory || false}
                        onChange={(e) => setSettings({...settings, awx_sync_inventory: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      AWX Inventory ID
                    </label>
                    <Input
                      value={settings.awx_inventory_id || ''}
                      onChange={(e) => setSettings({...settings, awx_inventory_id: e.target.value})}
                      placeholder="e.g., 5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target inventory for device synchronization
                    </p>
                  </div>
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Sync Interval (minutes)
                    </label>
                    <Input
                      type="number"
                      value={settings.awx_sync_interval || 30}
                      onChange={(e) => setSettings({...settings, awx_sync_interval: parseInt(e.target.value)})}
                      placeholder="30"
                      min="5"
                      max="1440"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How often to sync with AWX inventory
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="pt-4">
              <Button onClick={saveSettings} disabled={loading} className="w-full md:w-auto">
                {loading ? 'Saving...' : 'Save AWX Configuration'}
              </Button>
            </div>
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

      {/* IP Range Modal */}
      <Modal
        isOpen={showIPRangeModal}
        onClose={() => {
          setShowIPRangeModal(false);
          setEditingIPRange(null);
          setIpRangeForm({
            name: '',
            description: '',
            ip_range: '',
            range_type: 'cidr',
            is_restrictive: true,
            priority: 0,
            is_active: true
          });
        }}
        title={editingIPRange ? 'Edit IP Range' : 'Add IP Range'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Range Name *
            </label>
            <Input
              value={ipRangeForm.name}
              onChange={(e) => setIpRangeForm({...ipRangeForm, name: e.target.value})}
              placeholder="e.g., Corporate Network"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Description
            </label>
            <Input
              value={ipRangeForm.description}
              onChange={(e) => setIpRangeForm({...ipRangeForm, description: e.target.value})}
              placeholder="Description of this IP range"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              IP Range *
            </label>
            <Input
              value={ipRangeForm.ip_range}
              onChange={(e) => setIpRangeForm({...ipRangeForm, ip_range: e.target.value})}
              placeholder="e.g., 192.168.1.0/24 or 10.0.1.1-10.0.1.100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Supports CIDR notation (192.168.1.0/24) or IP ranges (10.0.1.1-10.0.1.100)
            </p>
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Range Type
            </label>
            <select
              value={ipRangeForm.range_type}
              onChange={(e) => setIpRangeForm({...ipRangeForm, range_type: e.target.value})}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="cidr">CIDR</option>
              <option value="range">IP Range</option>
              <option value="single">Single IP</option>
            </select>
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Priority
            </label>
            <Input
              type="number"
              value={ipRangeForm.priority}
              onChange={(e) => setIpRangeForm({...ipRangeForm, priority: parseInt(e.target.value) || 0})}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Higher numbers have higher priority (0 = lowest priority)
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ipRangeForm.is_restrictive}
                onChange={(e) => setIpRangeForm({...ipRangeForm, is_restrictive: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-foreground">Restrictive</span>
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ipRangeForm.is_active}
                onChange={(e) => setIpRangeForm({...ipRangeForm, is_active: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-foreground">Active</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => {
            setShowIPRangeModal(false);
            setEditingIPRange(null);
            setIpRangeForm({
              name: '',
              description: '',
              ip_range: '',
              range_type: 'cidr',
              is_restrictive: true,
              priority: 0,
              is_active: true
            });
          }}>
            Cancel
          </Button>
          <Button onClick={editingIPRange ? handleUpdateIPRange : handleCreateIPRange}>
            {editingIPRange ? 'Update' : 'Create'}
          </Button>
        </div>
      </Modal>

      {/* LDAP Modal */}
      <Modal
        isOpen={showLDAPModal}
        onClose={() => {
          setShowLDAPModal(false);
          setEditingLDAP(null);
          setLdapForm({
            name: '',
            server_url: '',
            bind_dn: '',
            bind_password: '',
            user_search_base: '',
            user_search_filter: '',
            group_search_base: '',
            group_search_filter: '',
            is_default: false,
            is_active: true
          });
        }}
        title={editingLDAP ? 'Edit LDAP Configuration' : 'Add LDAP Server'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Configuration Name *
            </label>
            <Input
              value={ldapForm.name}
              onChange={(e) => setLdapForm({...ldapForm, name: e.target.value})}
              placeholder="e.g., Corporate Active Directory"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Server URL *
            </label>
            <Input
              value={ldapForm.server_url}
              onChange={(e) => setLdapForm({...ldapForm, server_url: e.target.value})}
              placeholder="e.g., ldap://dc.company.com:389"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Bind DN *
            </label>
            <Input
              value={ldapForm.bind_dn}
              onChange={(e) => setLdapForm({...ldapForm, bind_dn: e.target.value})}
              placeholder="e.g., CN=service_account,OU=Service Accounts,DC=company,DC=com"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Bind Password *
            </label>
            <Input
              type="password"
              value={ldapForm.bind_password}
              onChange={(e) => setLdapForm({...ldapForm, bind_password: e.target.value})}
              placeholder="Service account password"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              User Search Base *
            </label>
            <Input
              value={ldapForm.user_search_base}
              onChange={(e) => setLdapForm({...ldapForm, user_search_base: e.target.value})}
              placeholder="e.g., OU=Users,DC=company,DC=com"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              User Search Filter
            </label>
            <Input
              value={ldapForm.user_search_filter}
              onChange={(e) => setLdapForm({...ldapForm, user_search_filter: e.target.value})}
              placeholder="e.g., (objectClass=user)"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Group Search Base
            </label>
            <Input
              value={ldapForm.group_search_base}
              onChange={(e) => setLdapForm({...ldapForm, group_search_base: e.target.value})}
              placeholder="e.g., OU=Groups,DC=company,DC=com"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Group Search Filter
            </label>
            <Input
              value={ldapForm.group_search_filter}
              onChange={(e) => setLdapForm({...ldapForm, group_search_filter: e.target.value})}
              placeholder="e.g., (objectClass=group)"
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ldapForm.is_default}
                onChange={(e) => setLdapForm({...ldapForm, is_default: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-foreground">Default</span>
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ldapForm.is_active}
                onChange={(e) => setLdapForm({...ldapForm, is_active: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-foreground">Active</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => {
            setShowLDAPModal(false);
            setEditingLDAP(null);
            setLdapForm({
              name: '',
              server_url: '',
              bind_dn: '',
              bind_password: '',
              user_search_base: '',
              user_search_filter: '',
              group_search_base: '',
              group_search_filter: '',
              is_default: false,
              is_active: true
            });
          }}>
            Cancel
          </Button>
          <Button onClick={editingLDAP ? handleUpdateLDAP : handleCreateLDAP}>
            {editingLDAP ? 'Update' : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSettings;