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
import { cn } from '../utils/cn';
import PageHeader from './PageHeader';
import ScanTemplateManager from './admin/ScanTemplateManager';
import { validateForm, FIELD_VALIDATIONS, VALIDATION_RULES } from '../utils/validation';
import { handleFormSubmission, COMMON_FIELD_CONFIGS, createFieldChangeHandler } from '../utils/formHelpers';

const AdminSettings = () => {
  const { 
    statusMessage, 
    setStatusMessage,
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
  } = useApp();
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('users');
  
  
  // User Management State
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [settings, setSettings] = useState(null);
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
  const [userFormErrors, setUserFormErrors] = useState({});

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

  // Satellite scanner management state
  const [satelliteScanners, setSatelliteScanners] = useState([]);
  const [scannerHealth, setScannerHealth] = useState({});
  const [scannerNetworkInfo, setScannerNetworkInfo] = useState({});
  const [scannerLogs, setScannerLogs] = useState({});
  const [showTroubleshootModal, setShowTroubleshootModal] = useState(false);
  const [selectedScannerForTroubleshoot, setSelectedScannerForTroubleshoot] = useState(null);
  const [troubleshootResults, setTroubleshootResults] = useState({});

  // API Key management state
  const [apiKeys, setApiKeys] = useState([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState(null);
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    description: '',
    permissions: ['scanner:read', 'scanner:write'],
    expires_at: '',
    is_active: true
  });
  const [newApiKey, setNewApiKey] = useState(null);

  // LDAP configuration state
  const [ldapConfigs, setLdapConfigs] = useState([]);
  const [showLDAPModal, setShowLDAPModal] = useState(false);
  const [editingLDAP, setEditingLDAP] = useState(null);
  const [ldapForm, setLdapForm] = useState({
    name: '',
    server_uri: '',
    bind_dn: '',
    bind_password: '',
    user_base_dn: '',
    user_search_filter: '',
    group_base_dn: '',
    group_search_filter: '',
    is_default: false,
    is_active: true
  });
  const [ldapFormErrors, setLdapFormErrors] = useState({});


  // Role management state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [roleFormErrors, setRoleFormErrors] = useState({});

  // Subnet management state
  const [subnets, setSubnets] = useState([]);
  const [showSubnetModal, setShowSubnetModal] = useState(false);
  const [editingSubnet, setEditingSubnet] = useState(null);
  
  // Access list management state
  const [showAccessListModal, setShowAccessListModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceType, setResourceType] = useState(null); // 'subnet' or 'scanner'
  const [resourceUsers, setResourceUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [subnetForm, setSubnetForm] = useState({
    name: '',
    description: '',
    cidr: '',
    gateway: '',
    vlan_id: '',
    location: '',
    department: '',
    is_active: true,
    is_managed: false,
    scan_frequency: 'weekly',
    tags: {}
  });
  const [subnetFormErrors, setSubnetFormErrors] = useState({});

  useEffect(() => {
    if (hasPermission('admin')) {
      fetchSettings();
      fetchUsers();
      fetchRoles();
      fetchScannerConfigsAPI();
      loadLDAPConfigs();
      fetchApiKeys();
    }
    if (hasPermission('subnets:read')) {
      fetchSubnets();
    }
    if (hasPermission('satellite_scanners:read')) {
      fetchSatelliteScanners();
    }
  }, [hasPermission]);

  // Auto-refresh satellite scanner data every 30 seconds
  useEffect(() => {
    if (hasPermission('admin') && activeTab === 'scanners') {
      const interval = setInterval(() => {
        fetchSatelliteScanners();
        // Check health for all scanners
        satelliteScanners.forEach(scanner => {
          checkScannerHealth(scanner.id);
        });
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [hasPermission, activeTab, satelliteScanners]);

  // Load LDAP configurations
  const loadLDAPConfigs = async () => {
    try {
      const configs = await fetchLDAPConfigs();
      setLdapConfigs(configs);
    } catch (error) {
      console.error('Failed to load LDAP configurations:', error);
    }
  };


  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['system', 'users', 'ldap', 'permissions', 'scanners'].includes(tabParam)) {
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


  const handleCreateUser = async () => {
    // Validate form
    const userValidations = {
      username: FIELD_VALIDATIONS.username,
      email: FIELD_VALIDATIONS.email,
      full_name: FIELD_VALIDATIONS.fullName,
      password: FIELD_VALIDATIONS.password
    };
    
    const { isValid, errors } = validateForm(userForm, userValidations);
    setUserFormErrors(errors);
    
    if (!isValid) {
      setStatusMessage('Please fix the validation errors before submitting.');
      return;
    }
    
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
      setUserFormErrors({});
      fetchUsers();
      setStatusMessage('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      setStatusMessage('Error creating user: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    // Validate form (password is optional for updates)
    const userValidations = {
      username: FIELD_VALIDATIONS.username,
      email: FIELD_VALIDATIONS.email,
      full_name: FIELD_VALIDATIONS.fullName
    };
    
    // Only validate password if it's provided
    if (userForm.password && userForm.password.trim()) {
      userValidations.password = FIELD_VALIDATIONS.password;
    }
    
    const { isValid, errors } = validateForm(userForm, userValidations);
    setUserFormErrors(errors);
    
    if (!isValid) {
      setStatusMessage('Please fix the validation errors before submitting.');
      return;
    }
    
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
      setUserFormErrors({});
      fetchUsers();
      setStatusMessage('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      setStatusMessage('Error updating user: ' + (error.response?.data?.detail || error.message));
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

  // Satellite scanner management functions
  const fetchSatelliteScanners = async () => {
    try {
      const response = await fetch('/api/v2/satellite-scanners', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const scanners = await response.json();
        setSatelliteScanners(scanners);
      }
    } catch (error) {
      console.error('Failed to fetch satellite scanners:', error);
    }
  };

  const checkScannerHealth = async (scannerId) => {
    try {
      // Skip health check if scannerId is undefined or null
      if (!scannerId) {
        console.warn('Skipping health check for scanner with undefined ID');
        return;
      }

      // Find the scanner to check if it has a real ID
      const scanner = satelliteScanners.find(s => (s.id || s.name) === scannerId);
      if (!scanner) {
        console.warn('Scanner not found for health check:', scannerId);
        return;
      }

      // Only check health for scanners that have a real ID (satellite scanners)
      if (!scanner.id) {
        // For scanners without ID (like Default Scanner), show a simple status
        const health = {
          scanner_id: scannerId,
          name: scanner.name,
          url: scanner.url,
          status: 'default',
          message: 'Default scanner - health monitoring not available'
        };
        setScannerHealth(prev => ({ ...prev, [scannerId]: health }));
        return health;
      }

      // Check if this is a satellite scanner (has an 'id' field that starts with 'scanner_')
      const isSatelliteScanner = scanner.id && scanner.id.startsWith('scanner_');
      const endpoint = isSatelliteScanner 
        ? `/api/v2/satellite-scanners/${scanner.id}/health`
        : `/api/v2/scanners/${scanner.id}/health`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const health = await response.json();
        setScannerHealth(prev => ({ ...prev, [scannerId]: health }));
        return health;
      }
    } catch (error) {
      console.error('Failed to check scanner health:', error);
      setScannerHealth(prev => ({ 
        ...prev, 
        [scannerId]: { status: 'error', message: 'Health check failed' }
      }));
    }
  };

  const getScannerNetworkInfo = async (scannerId) => {
    try {
      // Skip if scannerId is undefined or null
      if (!scannerId) {
        console.warn('Skipping network info for scanner with undefined ID');
        return;
      }

      const scanner = satelliteScanners.find(s => (s.id || s.name) === scannerId);
      if (!scanner) return;

      // Only get network info for scanners that have a real ID (satellite scanners)
      if (!scanner.id) {
        // For scanners without ID (like Default Scanner), show default network info
        const networkInfo = {
          subnets: scanner.subnets || [],
          message: 'Default scanner - using configured subnets'
        };
        setScannerNetworkInfo(prev => ({ ...prev, [scannerId]: networkInfo }));
        return networkInfo;
      }

      // Get network info from the backend instead of directly from the scanner
      const response = await fetch(`/api/v2/satellite-scanners/${scanner.id}/health`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const healthData = await response.json();
        const networkInfo = healthData.network_info || {};
        setScannerNetworkInfo(prev => ({ ...prev, [scannerId]: networkInfo }));
        return networkInfo;
      }
    } catch (error) {
      console.error('Failed to get scanner network info:', error);
      setScannerNetworkInfo(prev => ({ 
        ...prev, 
        [scannerId]: { error: 'Failed to fetch network information' }
      }));
    }
  };

  const refreshScannerNetworks = async (scannerId) => {
    try {
      const scanner = satelliteScanners.find(s => s.id === scannerId);
      if (!scanner) return;

      const response = await fetch(`${scanner.url}/refresh-networks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setStatusMessage(`Network refresh ${result.status}: ${result.message}`);
        setTimeout(() => setStatusMessage(null), 3000);
        // Refresh network info
        getScannerNetworkInfo(scannerId);
      }
    } catch (error) {
      console.error('Failed to refresh scanner networks:', error);
      setStatusMessage('Failed to refresh scanner networks');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const getScannerLogs = async (scannerId, lines = 100) => {
    try {
      // Skip if scannerId is undefined or null
      if (!scannerId) {
        console.warn('Skipping logs for scanner with undefined ID');
        return;
      }

      const scanner = satelliteScanners.find(s => (s.id || s.name) === scannerId);
      if (!scanner) return;

      // Show appropriate message based on scanner type
      const logs = {
        message: scanner.id 
          ? "Logs are not available via web interface for satellite scanners."
          : "Logs are not available via web interface for default scanners.",
        note: scanner.id 
          ? "Check the satellite scanner's local log files or console output for detailed logs."
          : "Check the main DiscoverIT backend logs for default scanner activity.",
        last_heartbeat: scanner.last_heartbeat,
        status: scanner.status
      };
      
      setScannerLogs(prev => ({ ...prev, [scannerId]: logs }));
      return logs;
    } catch (error) {
      console.error('Failed to get scanner logs:', error);
      setScannerLogs(prev => ({ 
        ...prev, 
        [scannerId]: { error: 'Failed to fetch logs' }
      }));
    }
  };

  const runTroubleshootDiagnostics = async (scannerId) => {
    const scanner = satelliteScanners.find(s => s.id === scannerId);
    if (!scanner) return;

    setTroubleshootResults(prev => ({ ...prev, [scannerId]: { status: 'running' } }));

    const diagnostics = {
      health: await checkScannerHealth(scannerId),
      networkInfo: await getScannerNetworkInfo(scannerId),
      logs: await getScannerLogs(scannerId, 50)
    };

    setTroubleshootResults(prev => ({ ...prev, [scannerId]: { status: 'completed', ...diagnostics } }));
  };

  const openTroubleshootModal = (scanner) => {
    setSelectedScannerForTroubleshoot(scanner);
    setShowTroubleshootModal(true);
    runTroubleshootDiagnostics(scanner.id);
  };

  // API Key management functions
  const fetchApiKeys = async () => {
    try {
      console.log('Fetching API keys...');
      const response = await fetch('/api/v2/api-keys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('API keys response status:', response.status);
      if (response.ok) {
        const keys = await response.json();
        console.log('API keys received:', keys);
        setApiKeys(keys);
      } else {
        console.error('API keys fetch failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  const createApiKey = async () => {
    try {
      // Prepare the form data, converting empty string to null for expires_at
      const formData = {
        ...apiKeyForm,
        expires_at: apiKeyForm.expires_at === '' ? null : apiKeyForm.expires_at
      };
      
      const response = await fetch('/api/v2/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create API key');
      }

      const result = await response.json();
      setNewApiKey(result);
      setStatusMessage('API key created successfully');
      setTimeout(() => setStatusMessage(null), 3000);
      fetchApiKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
      setStatusMessage('Failed to create API key: ' + error.message);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const deleteApiKey = async (keyId) => {
    if (window.confirm('Are you sure you want to delete this API key?')) {
      try {
        const response = await fetch(`/api/v2/api-keys/${keyId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to delete API key');
        }

        setStatusMessage('API key deleted successfully');
        setTimeout(() => setStatusMessage(null), 3000);
        fetchApiKeys();
      } catch (error) {
        console.error('Failed to delete API key:', error);
        setStatusMessage('Failed to delete API key: ' + error.message);
        setTimeout(() => setStatusMessage(null), 5000);
      }
    }
  };

  const revokeApiKey = async (keyId) => {
    if (window.confirm('Are you sure you want to revoke this API key?')) {
      try {
        const response = await fetch(`/api/v2/api-keys/${keyId}/revoke`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to revoke API key');
        }

        setStatusMessage('API key revoked successfully');
        setTimeout(() => setStatusMessage(null), 3000);
        fetchApiKeys();
      } catch (error) {
        console.error('Failed to revoke API key:', error);
        setStatusMessage('Failed to revoke API key: ' + error.message);
        setTimeout(() => setStatusMessage(null), 5000);
      }
    }
  };

  const regenerateApiKey = async (keyId) => {
    if (window.confirm('Are you sure you want to regenerate this API key? The old key will no longer work.')) {
      try {
        const response = await fetch(`/api/v2/api-keys/${keyId}/regenerate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to regenerate API key');
        }

        const result = await response.json();
        setNewApiKey(result);
        setStatusMessage('API key regenerated successfully');
        setTimeout(() => setStatusMessage(null), 3000);
        fetchApiKeys();
      } catch (error) {
        console.error('Failed to regenerate API key:', error);
        setStatusMessage('Failed to regenerate API key: ' + error.message);
        setTimeout(() => setStatusMessage(null), 5000);
      }
    }
  };

  const resetApiKeyForm = () => {
    setApiKeyForm({
      name: '',
      description: '',
      permissions: ['scanner:read', 'scanner:write'],
      expires_at: '',
      is_active: true
    });
    setEditingApiKey(null);
    setNewApiKey(null);
  };

  const closeApiKeyModal = () => {
    setShowApiKeyModal(false);
    resetApiKeyForm();
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
    // Validate form
    const ldapValidations = {
      name: FIELD_VALIDATIONS.ldapName,
      server_uri: FIELD_VALIDATIONS.ldapServerUri,
      user_base_dn: FIELD_VALIDATIONS.ldapUserBaseDn,
      bind_dn: FIELD_VALIDATIONS.ldapBindDn,
      bind_password: FIELD_VALIDATIONS.ldapBindPassword,
      user_search_filter: FIELD_VALIDATIONS.ldapUserSearchFilter,
      group_base_dn: FIELD_VALIDATIONS.ldapGroupBaseDn,
      group_search_filter: FIELD_VALIDATIONS.ldapGroupSearchFilter
    };
    
    const { isValid, errors } = validateForm(ldapForm, ldapValidations);
    setLdapFormErrors(errors);
    
    if (!isValid) {
      setStatusMessage('Please fix the validation errors before submitting.');
      return;
    }
    
    try {
      const config = await createLDAPConfig(ldapForm);
      setLdapConfigs([...ldapConfigs, config]);
      setShowLDAPModal(false);
      setLdapForm({
        name: '',
        server_uri: '',
        bind_dn: '',
        bind_password: '',
        user_base_dn: '',
        user_search_filter: '',
        group_base_dn: '',
        group_search_filter: '',
        is_default: false,
        is_active: true
      });
      setLdapFormErrors({});
      setStatusMessage('LDAP configuration created successfully!');
    } catch (error) {
      console.error('Failed to create LDAP config:', error);
      setStatusMessage('Failed to create LDAP configuration: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditLDAP = (config) => {
    setEditingLDAP(config);
    setLdapForm({
      name: config.name,
      server_uri: config.server_uri,
      bind_dn: config.bind_dn,
      bind_password: config.bind_password,
      user_base_dn: config.user_base_dn,
      user_search_filter: config.user_search_filter,
      group_base_dn: config.group_base_dn,
      group_search_filter: config.group_search_filter,
      is_default: config.is_default,
      is_active: config.is_active
    });
    setShowLDAPModal(true);
  };

  const handleUpdateLDAP = async () => {
    // Validate form
    const ldapValidations = {
      name: FIELD_VALIDATIONS.ldapName,
      server_uri: FIELD_VALIDATIONS.ldapServerUri,
      user_base_dn: FIELD_VALIDATIONS.ldapUserBaseDn,
      bind_dn: FIELD_VALIDATIONS.ldapBindDn,
      bind_password: FIELD_VALIDATIONS.ldapBindPassword,
      user_search_filter: FIELD_VALIDATIONS.ldapUserSearchFilter,
      group_base_dn: FIELD_VALIDATIONS.ldapGroupBaseDn,
      group_search_filter: FIELD_VALIDATIONS.ldapGroupSearchFilter
    };
    
    const { isValid, errors } = validateForm(ldapForm, ldapValidations);
    setLdapFormErrors(errors);
    
    if (!isValid) {
      setStatusMessage('Please fix the validation errors before submitting.');
      return;
    }
    
    try {
      const config = await updateLDAPConfig(editingLDAP.id, ldapForm);
      setLdapConfigs(ldapConfigs.map(c => c.id === editingLDAP.id ? config : c));
      setShowLDAPModal(false);
      setEditingLDAP(null);
      setLdapForm({
        name: '',
        server_uri: '',
        bind_dn: '',
        bind_password: '',
        user_base_dn: '',
        user_search_filter: '',
        group_base_dn: '',
        group_search_filter: '',
        is_default: false,
        is_active: true
      });
      setLdapFormErrors({});
      setStatusMessage('LDAP configuration updated successfully!');
    } catch (error) {
      console.error('Failed to update LDAP config:', error);
      setStatusMessage('Failed to update LDAP configuration: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteLDAP = async (ldapId) => {
    if (confirm('Are you sure you want to delete this LDAP configuration?')) {
      try {
        await deleteLDAPConfig(ldapId);
        setLdapConfigs(ldapConfigs.filter(c => c.id !== ldapId));
        setStatusMessage('LDAP configuration deleted successfully!');
      } catch (error) {
        console.error('Failed to delete LDAP config:', error);
        setStatusMessage('Failed to delete LDAP configuration: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  // Clear field error when user starts typing
  const handleLdapFormChange = (field, value) => {
    setLdapForm({ ...ldapForm, [field]: value });
    if (ldapFormErrors[field]) {
      setLdapFormErrors({ ...ldapFormErrors, [field]: null });
    }
  };

  const handleUserFormChange = (field, value) => {
    setUserForm({ ...userForm, [field]: value });
    if (userFormErrors[field]) {
      setUserFormErrors({ ...userFormErrors, [field]: null });
    }
  };

  const handleRoleFormChange = (field, value) => {
    setRoleForm({ ...roleForm, [field]: value });
    if (roleFormErrors[field]) {
      setRoleFormErrors({ ...roleFormErrors, [field]: null });
    }
  };

  const handleTestLDAPConnection = async (configId) => {
    try {
      const result = await testLDAPConnection(configId);
      if (result.success) {
        setStatusMessage('LDAP connection test successful!');
      } else {
        setStatusMessage('LDAP connection test failed: ' + result.message);
      }
    } catch (error) {
      console.error('Failed to test LDAP connection:', error);
      setStatusMessage('Failed to test LDAP connection: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSyncLDAPUsers = async (configId) => {
    try {
      const result = await syncLDAPUsers(configId);
      
      if (result.success) {
        const totalUsers = (result.users_created || 0) + (result.users_updated || 0);
        const message = `LDAP user sync completed successfully!\n\n` +
          `• Users created: ${result.users_created || 0}\n` +
          `• Users updated: ${result.users_updated || 0}\n` +
          `• Users deactivated: ${result.users_deactivated || 0}\n` +
          `• Total synchronized: ${totalUsers}\n` +
          `• Errors: ${result.errors_count || 0}`;
        
        alert(message);
      } else {
        alert(`LDAP sync failed: ${result.error || 'Unknown error'}`);
      }
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Failed to sync LDAP users:', error);
      alert('Failed to sync LDAP users: ' + (error.response?.data?.detail || error.message));
    }
  };


  // Role management functions
  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/v2/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(roleForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create role');
      }

      setShowRoleModal(false);
      setRoleForm({ name: '', description: '', permissions: [] });
      fetchRoles();
      setStatusMessage('Role created successfully');
    } catch (error) {
      console.error('Failed to create role:', error);
      setStatusMessage(`Failed to create role: ${error.message}`);
    }
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

  const handleUpdateRole = async () => {
    try {
      const response = await fetch(`/api/v2/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(roleForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update role');
      }

      setShowRoleModal(false);
      setEditingRole(null);
      setRoleForm({ name: '', description: '', permissions: [] });
      fetchRoles();
      setStatusMessage('Role updated successfully');
    } catch (error) {
      console.error('Failed to update role:', error);
      setStatusMessage(`Failed to update role: ${error.message}`);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/v2/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete role');
      }

      fetchRoles();
      setStatusMessage('Role deleted successfully');
    } catch (error) {
      console.error('Failed to delete role:', error);
      setStatusMessage(`Failed to delete role: ${error.message}`);
    }
  };

  const handleRoleSubmit = () => {
    if (editingRole) {
      handleUpdateRole();
    } else {
      handleCreateRole();
    }
  };

  // Subnet management functions
  const fetchSubnets = async () => {
    try {
      const response = await fetch('/api/v2/subnets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSubnets(data);
    } catch (error) {
      console.error('Failed to fetch subnets:', error);
    }
  };

  const handleCreateSubnet = async () => {
    const success = await handleFormSubmission({
      formData: subnetForm,
      validations: COMMON_FIELD_CONFIGS.subnet.validations,
      setFormErrors: setSubnetFormErrors,
      setError: setStatusMessage,
      submitFunction: async (cleanedData) => {
        const response = await fetch('/api/v2/subnets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(cleanedData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to create subnet');
        }
      },
      onSuccess: () => {
        setShowSubnetModal(false);
        setSubnetForm({
          name: '',
          description: '',
          cidr: '',
          gateway: '',
          vlan_id: '',
          location: '',
          department: '',
          is_active: true,
          is_managed: false,
          scan_frequency: 'weekly',
          tags: {}
        });
        fetchSubnets();
        setStatusMessage('Subnet created successfully');
      },
      optionalFields: COMMON_FIELD_CONFIGS.subnet.optionalFields,
      numericFields: COMMON_FIELD_CONFIGS.subnet.numericFields
    });
  };

  const handleEditSubnet = (subnet) => {
    setEditingSubnet(subnet);
    setSubnetForm({
      name: subnet.name,
      description: subnet.description || '',
      cidr: subnet.cidr,
      gateway: subnet.gateway || '',
      vlan_id: subnet.vlan_id || '',
      location: subnet.location || '',
      department: subnet.department || '',
      is_active: subnet.is_active,
      is_managed: subnet.is_managed,
      scan_frequency: subnet.scan_frequency,
      tags: subnet.tags || {}
    });
    setShowSubnetModal(true);
  };

  const handleUpdateSubnet = async () => {
    const success = await handleFormSubmission({
      formData: subnetForm,
      validations: COMMON_FIELD_CONFIGS.subnet.validations,
      setFormErrors: setSubnetFormErrors,
      setError: setStatusMessage,
      submitFunction: async (cleanedData) => {
        const response = await fetch(`/api/v2/subnets/${editingSubnet.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(cleanedData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to update subnet');
        }
      },
      onSuccess: () => {
        setShowSubnetModal(false);
        setEditingSubnet(null);
        setSubnetForm({
          name: '',
          description: '',
          cidr: '',
          gateway: '',
          vlan_id: '',
          location: '',
          department: '',
          is_active: true,
          is_managed: false,
          scan_frequency: 'weekly',
          tags: {}
        });
        fetchSubnets();
        setStatusMessage('Subnet updated successfully');
      },
      optionalFields: COMMON_FIELD_CONFIGS.subnet.optionalFields,
      numericFields: COMMON_FIELD_CONFIGS.subnet.numericFields
    });
  };

  const handleDeleteSubnet = async (subnetId) => {
    if (!window.confirm('Are you sure you want to delete this subnet? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/v2/subnets/${subnetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete subnet');
      }

      fetchSubnets();
      setStatusMessage('Subnet deleted successfully');
    } catch (error) {
      console.error('Failed to delete subnet:', error);
      setStatusMessage(`Failed to delete subnet: ${error.message}`);
    }
  };

  // Access list management functions
  const fetchResourceUsers = async (resourceId, type) => {
    try {
      const endpoint = type === 'subnet' ? `/api/v2/subnets/${resourceId}/users` : `/api/v2/scanners/${resourceId}/users`;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resource users');
      }

      const data = await response.json();
      setResourceUsers(data);
    } catch (error) {
      console.error('Failed to fetch resource users:', error);
      setStatusMessage(`Failed to fetch resource users: ${error.message}`, 'error');
    }
  };

  const grantAccess = async (resourceId, userId, type) => {
    try {
      const endpoint = type === 'subnet' ? `/api/v2/subnets/${resourceId}/grant-access/${userId}` : `/api/v2/scanners/${resourceId}/grant-access/${userId}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to grant access');
      }

      // Refresh the resource users list
      fetchResourceUsers(resourceId, type);
      setStatusMessage('Access granted successfully');
    } catch (error) {
      console.error('Failed to grant access:', error);
      setStatusMessage(`Failed to grant access: ${error.message}`, 'error');
    }
  };

  const revokeAccess = async (resourceId, userId, type) => {
    try {
      const endpoint = type === 'subnet' ? `/api/v2/subnets/${resourceId}/revoke-access/${userId}` : `/api/v2/scanners/${resourceId}/revoke-access/${userId}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to revoke access');
      }

      // Refresh the resource users list
      fetchResourceUsers(resourceId, type);
      setStatusMessage('Access revoked successfully');
    } catch (error) {
      console.error('Failed to revoke access:', error);
      setStatusMessage(`Failed to revoke access: ${error.message}`, 'error');
    }
  };

  const handleManageAccess = (resource, type) => {
    setSelectedResource(resource);
    setResourceType(type);
    setShowAccessListModal(true);
    fetchResourceUsers(resource.id, type);
  };

  const handleSubnetSubmit = () => {
    if (editingSubnet) {
      handleUpdateSubnet();
    } else {
      handleCreateSubnet();
    }
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
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            {hasPermission('satellite_scanners:read') && (
              <TabsTrigger value="scanners">Scanner Configs</TabsTrigger>
            )}
            <TabsTrigger value="templates">Scan Templates</TabsTrigger>
            {hasPermission('subnets:read') && (
              <TabsTrigger value="subnets">Subnets</TabsTrigger>
            )}
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>


          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="text-subheading text-foreground">System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-body font-medium text-foreground mb-2">
                      Scan Retry Time Limit (minutes)
                    </label>
                    <Input
                      type="number"
                      value={settings?.scan_retry_time_limit_minutes || 30}
                      onChange={(e) => {
                        const newSettings = { ...settings };
                        newSettings.scan_retry_time_limit_minutes = parseInt(e.target.value);
                        setSettings(newSettings);
                      }}
                      min="1"
                      max="1440"
                      placeholder="30"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How long after a scan fails can it be retried (1-1440 minutes)
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => fetchSettings()}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        await updateSettingsAPI(settings);
                        setStatusMessage('Settings updated successfully');
                      } catch (error) {
                        setStatusMessage('Failed to update settings');
                        console.error('Error updating settings:', error);
                      }
                    }}
                  >
                    Save Settings
                  </Button>
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
                            <p className="text-body text-muted-foreground">{config.server_uri}</p>
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



          {/* Scanner Configs Tab */}
          {hasPermission('satellite_scanners:read') && (
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
                  {hasPermission('satellite_scanners:create') && (
                    <Button onClick={() => setShowScannerModal(true)}>
                      Add Satellite Scanner
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {satelliteScanners.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🛰️</div>
                    <h3 className="text-subheading text-foreground mb-2">No Satellite Scanners</h3>
                    <p className="text-body text-muted-foreground mb-4">
                      Add satellite scanners to enhance discovery capabilities for specific network segments.
                    </p>
                    {hasPermission('satellite_scanners:create') && (
                      <Button onClick={() => setShowScannerModal(true)}>
                        Add Your First Satellite Scanner
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {satelliteScanners.map((config) => {
                      // Use ID if available, otherwise use name as fallback identifier
                      const scannerId = config.id || config.name;
                      const health = scannerHealth[scannerId];
                      const networkInfo = scannerNetworkInfo[scannerId];
                      const isHealthy = health?.status === 'healthy';
                      
                      return (
                        <div key={config.id} className="p-4 bg-muted/30 rounded-md border border-border">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-subheading text-foreground">{config.name}</h3>
                                {config.is_default && (
                                  <Badge className="bg-primary text-primary-foreground text-xs">
                                    Default
                                  </Badge>
                                )}
                                <Badge className={isHealthy ? 'bg-success text-success-foreground' : 'bg-error text-error-foreground'}>
                                  {isHealthy ? '🟢 Online' : '🔴 Offline'}
                                </Badge>
                              </div>
                              <p className="text-body text-muted-foreground mb-2">{config.url}</p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>Subnets: {config.subnets?.length || 0}</span>
                                {networkInfo?.subnets && (
                                  <span>Detected: {networkInfo.subnets.length}</span>
                                )}
                                {health?.response_time && (
                                  <span>Response: {Math.round(health.response_time * 1000)}ms</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => checkScannerHealth(scannerId)}
                                disabled={!config.is_active}
                              >
                                🔍 Health
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => getScannerNetworkInfo(scannerId)}
                                disabled={!config.is_active}
                              >
                                🌐 Networks
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openTroubleshootModal(config)}
                                disabled={!config.is_active}
                              >
                                🔧 Troubleshoot
                              </Button>
                              {hasPermission('satellite_scanners:update') && (
                                <Button variant="outline" size="sm" onClick={() => handleEditScanner(config)}>
                                  Edit
                                </Button>
                              )}
                              {hasPermission('users:read') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleManageAccess(config, 'scanner')}
                                >
                                  Manage Access
                                </Button>
                              )}
                              {hasPermission('satellite_scanners:delete') && (
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteScanner(scannerId)}>
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Health Status */}
                          {health && (
                            <div className="mb-3 p-2 bg-muted/50 rounded text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Health Status:</span>
                                <span className={isHealthy ? 'text-success' : 'text-error'}>
                                  {health.message}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Network Information */}
                          {networkInfo && !networkInfo.error && (
                            <div className="mb-3 p-2 bg-muted/50 rounded text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">Network Info:</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => refreshScannerNetworks(scannerId)}
                                  className="h-6 px-2 text-xs"
                                >
                                  🔄 Refresh
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-muted-foreground">Subnets:</span>
                                  <div className="text-xs">
                                    {networkInfo.subnets?.map((subnet, idx) => (
                                      <div key={idx} className="truncate">{subnet}</div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Interfaces:</span>
                                  <div className="text-xs">
                                    {networkInfo.interfaces?.map((iface, idx) => (
                                      <div key={idx} className="truncate">
                                        {iface.name} {iface.is_up ? '🟢' : '🔴'}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <Card className="surface-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-subheading text-foreground flex items-center">
                      <span className="mr-2">🔑</span>
                      API Key Management
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage API keys for satellite scanners and external integrations
                    </p>
                  </div>
                  <Button onClick={() => setShowApiKeyModal(true)}>
                    Generate New API Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔑</div>
                    <h3 className="text-subheading text-foreground mb-2">No API Keys</h3>
                    <p className="text-body text-muted-foreground mb-4">
                      Generate API keys to enable satellite scanner authentication and external integrations.
                    </p>
                    <Button onClick={() => setShowApiKeyModal(true)}>
                      Generate Your First API Key
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-md border border-border">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-subheading text-foreground">{key.name}</h3>
                            <Badge className={key.is_active ? 'bg-success text-success-foreground' : 'bg-error text-error-foreground'}>
                              {key.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-body text-muted-foreground mb-2">{key.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Prefix: {key.key_prefix}...</span>
                            <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                            {key.last_used && (
                              <span>Last Used: {new Date(key.last_used).toLocaleDateString()}</span>
                            )}
                            {key.expires_at && (
                              <span>Expires: {new Date(key.expires_at).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">Permissions: </span>
                            {key.permissions?.map((perm, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs mr-1">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => revokeApiKey(key.id)}
                            disabled={!key.is_active}
                          >
                            {key.is_active ? 'Revoke' : 'Revoked'}
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => regenerateApiKey(key.id)}
                            disabled={!key.is_active}
                          >
                            🔄 Regenerate
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => deleteApiKey(key.id)}
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

          {/* Scan Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <ScanTemplateManager />
          </TabsContent>

          {/* Subnets Management Tab */}
          {hasPermission('subnets:read') && (
            <TabsContent value="subnets" className="space-y-6">
            <Card className="surface-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-subheading text-foreground flex items-center">
                      <span className="mr-2">🌐</span>
                      Network Subnet Management
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage network subnets for organized scanning and monitoring
                    </p>
                  </div>
                  {hasPermission('subnets:create') && (
                    <Button onClick={() => setShowSubnetModal(true)}>
                      Add Subnet
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subnets.map((subnet) => (
                    <div key={subnet.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-md border border-border">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-semibold">
                            {subnet.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-subheading text-foreground">{subnet.name}</h3>
                          <p className="text-body text-muted-foreground">{subnet.description || 'No description'}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className="bg-info text-info-foreground">
                              {subnet.cidr}
                            </Badge>
                            {subnet.is_managed && (
                              <Badge className="bg-success text-success-foreground">
                                Managed
                              </Badge>
                            )}
                            {subnet.is_active ? (
                              <Badge className="bg-success text-success-foreground">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground">
                                Inactive
                              </Badge>
                            )}
                            {subnet.department && (
                              <Badge variant="outline">
                                {subnet.department}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {subnet.location && `📍 ${subnet.location}`}
                            {subnet.gateway && ` • Gateway: ${subnet.gateway}`}
                            {subnet.vlan_id && ` • VLAN: ${subnet.vlan_id}`}
                            {subnet.is_managed && ` • Scan: ${subnet.scan_frequency}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {hasPermission('subnets:update') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSubnet(subnet)}
                          >
                            Edit
                          </Button>
                        )}
                        {hasPermission('users:read') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageAccess(subnet, 'subnet')}
                          >
                            Manage Access
                          </Button>
                        )}
                        {hasPermission('subnets:delete') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteSubnet(subnet.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {subnets.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🌐</div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Subnets Yet</h3>
                      <p className="text-muted-foreground">
                        Create your first network subnet to organize your scanning activities.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </TabsContent>
          )}

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
              Username *
            </label>
            <Input
              value={userForm.username}
              onChange={(e) => handleUserFormChange('username', e.target.value)}
              placeholder="Enter username"
              className={userFormErrors.username ? 'border-red-500' : ''}
            />
            {userFormErrors.username && (
              <p className="text-red-500 text-sm mt-1">{userFormErrors.username}</p>
            )}
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Email *
            </label>
            <Input
              type="email"
              value={userForm.email}
              onChange={(e) => handleUserFormChange('email', e.target.value)}
              placeholder="Enter email"
              className={userFormErrors.email ? 'border-red-500' : ''}
            />
            {userFormErrors.email && (
              <p className="text-red-500 text-sm mt-1">{userFormErrors.email}</p>
            )}
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
              Password *
            </label>
            <Input
              type="password"
              value={userForm.password}
              onChange={(e) => handleUserFormChange('password', e.target.value)}
              autoComplete="new-password"
              placeholder="Enter password"
              className={userFormErrors.password ? 'border-red-500' : ''}
            />
            {userFormErrors.password && (
              <p className="text-red-500 text-sm mt-1">{userFormErrors.password}</p>
            )}
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


      {/* LDAP Modal */}
      <Modal
        isOpen={showLDAPModal}
        onClose={() => {
          setShowLDAPModal(false);
          setEditingLDAP(null);
          setLdapForm({
            name: '',
            server_uri: '',
            bind_dn: '',
            bind_password: '',
            user_base_dn: '',
            user_search_filter: '',
            group_base_dn: '',
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
              onChange={(e) => handleLdapFormChange('name', e.target.value)}
              placeholder="e.g., Corporate Active Directory"
              className={ldapFormErrors.name ? 'border-red-500' : ''}
            />
            {ldapFormErrors.name && (
              <p className="text-red-500 text-sm mt-1">{ldapFormErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Server URL *
            </label>
            <Input
              value={ldapForm.server_uri}
              onChange={(e) => handleLdapFormChange('server_uri', e.target.value)}
              placeholder="e.g., ldap://dc.company.com:389"
              className={ldapFormErrors.server_uri ? 'border-red-500' : ''}
            />
            {ldapFormErrors.server_uri && (
              <p className="text-red-500 text-sm mt-1">{ldapFormErrors.server_uri}</p>
            )}
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
              value={ldapForm.user_base_dn}
              onChange={(e) => handleLdapFormChange('user_base_dn', e.target.value)}
              placeholder="e.g., OU=Users,DC=company,DC=com"
              className={ldapFormErrors.user_base_dn ? 'border-red-500' : ''}
            />
            {ldapFormErrors.user_base_dn && (
              <p className="text-red-500 text-sm mt-1">{ldapFormErrors.user_base_dn}</p>
            )}
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
              value={ldapForm.group_base_dn}
              onChange={(e) => setLdapForm({...ldapForm, group_base_dn: e.target.value})}
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
              server_uri: '',
              bind_dn: '',
              bind_password: '',
              user_base_dn: '',
              user_search_filter: '',
              group_base_dn: '',
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

      {/* Troubleshooting Modal */}
      <Modal
        isOpen={showTroubleshootModal}
        onClose={() => setShowTroubleshootModal(false)}
        title={`Troubleshoot Scanner: ${selectedScannerForTroubleshoot?.name}`}
        size="large"
      >
        {selectedScannerForTroubleshoot && (
          <div className="space-y-6">
            {/* Scanner Info */}
            <div className="p-4 bg-muted/30 rounded-md">
              <h3 className="text-subheading text-foreground mb-2">Scanner Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <div className="font-medium">{selectedScannerForTroubleshoot.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">URL:</span>
                  <div className="font-medium">{selectedScannerForTroubleshoot.url}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="font-medium">
                    <Badge className={selectedScannerForTroubleshoot.is_active ? 'bg-success text-success-foreground' : 'bg-error text-error-foreground'}>
                      {selectedScannerForTroubleshoot.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Subnets:</span>
                  <div className="font-medium">{selectedScannerForTroubleshoot.subnets?.length || 0}</div>
                </div>
              </div>
            </div>

            {/* Diagnostic Results */}
            {troubleshootResults[selectedScannerForTroubleshoot.id] && (
              <div className="space-y-4">
                {troubleshootResults[selectedScannerForTroubleshoot.id].status === 'running' && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Running diagnostics...</p>
                  </div>
                )}

                {troubleshootResults[selectedScannerForTroubleshoot.id].status === 'completed' && (
                  <>
                    {/* Health Check Results */}
                    <div className="p-4 bg-muted/30 rounded-md">
                      <h3 className="text-subheading text-foreground mb-3 flex items-center">
                        🔍 Health Check Results
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => checkScannerHealth(selectedScannerForTroubleshoot.id)}
                          className="ml-2 h-6 px-2 text-xs"
                        >
                          🔄 Refresh
                        </Button>
                      </h3>
                      {troubleshootResults[selectedScannerForTroubleshoot.id].health && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge className={troubleshootResults[selectedScannerForTroubleshoot.id].health.status === 'healthy' ? 'bg-success text-success-foreground' : 'bg-error text-error-foreground'}>
                              {troubleshootResults[selectedScannerForTroubleshoot.id].health.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Message:</span>
                            <span className="text-sm">{troubleshootResults[selectedScannerForTroubleshoot.id].health.message}</span>
                          </div>
                          {troubleshootResults[selectedScannerForTroubleshoot.id].health.response_time && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Response Time:</span>
                              <span className="text-sm">{Math.round(troubleshootResults[selectedScannerForTroubleshoot.id].health.response_time * 1000)}ms</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Network Information */}
                    <div className="p-4 bg-muted/30 rounded-md">
                      <h3 className="text-subheading text-foreground mb-3 flex items-center">
                        🌐 Network Information
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => getScannerNetworkInfo(selectedScannerForTroubleshoot.id)}
                          className="ml-2 h-6 px-2 text-xs"
                        >
                          🔄 Refresh
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => refreshScannerNetworks(selectedScannerForTroubleshoot.id)}
                          className="ml-1 h-6 px-2 text-xs"
                        >
                          🔄 Refresh Networks
                        </Button>
                      </h3>
                      {troubleshootResults[selectedScannerForTroubleshoot.id].networkInfo && (
                        <div className="space-y-3">
                          {troubleshootResults[selectedScannerForTroubleshoot.id].networkInfo.error ? (
                            <div className="text-error text-sm">
                              Error: {troubleshootResults[selectedScannerForTroubleshoot.id].networkInfo.error}
                            </div>
                          ) : (
                            <>
                              <div>
                                <span className="text-sm font-medium">Detected Subnets:</span>
                                <div className="mt-1 space-y-1">
                                  {troubleshootResults[selectedScannerForTroubleshoot.id].networkInfo.subnets?.map((subnet, idx) => (
                                    <div key={idx} className="text-sm bg-muted/50 px-2 py-1 rounded">{subnet}</div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Network Interfaces:</span>
                                <div className="mt-1 space-y-1">
                                  {troubleshootResults[selectedScannerForTroubleshoot.id].networkInfo.interfaces?.map((iface, idx) => (
                                    <div key={idx} className="text-sm bg-muted/50 px-2 py-1 rounded flex items-center justify-between">
                                      <span>{iface.name}</span>
                                      <div className="flex items-center space-x-2">
                                        <span className={iface.is_up ? 'text-success' : 'text-error'}>
                                          {iface.is_up ? '🟢 Up' : '🔴 Down'}
                                        </span>
                                        {iface.speed > 0 && (
                                          <span className="text-xs text-muted-foreground">{iface.speed}Mbps</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Recent Logs */}
                    <div className="p-4 bg-muted/30 rounded-md">
                      <h3 className="text-subheading text-foreground mb-3 flex items-center">
                        📋 Recent Logs
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => getScannerLogs(selectedScannerForTroubleshoot.id, 100)}
                          className="ml-2 h-6 px-2 text-xs"
                        >
                          🔄 Refresh
                        </Button>
                      </h3>
                      {troubleshootResults[selectedScannerForTroubleshoot.id].logs && (
                        <div className="space-y-2">
                          {troubleshootResults[selectedScannerForTroubleshoot.id].logs.error ? (
                            <div className="text-error text-sm">
                              Error: {troubleshootResults[selectedScannerForTroubleshoot.id].logs.error}
                            </div>
                          ) : (
                            <div className="bg-black/50 text-green-400 p-3 rounded text-xs font-mono max-h-64 overflow-y-auto">
                              {troubleshootResults[selectedScannerForTroubleshoot.id].logs.logs?.map((log, idx) => (
                                <div key={idx} className="mb-1">{log}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowTroubleshootModal(false)}>
                Close
              </Button>
              <Button onClick={() => runTroubleshootDiagnostics(selectedScannerForTroubleshoot.id)}>
                🔄 Run Diagnostics Again
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* API Key Modal */}
      <Modal
        isOpen={showApiKeyModal}
        onClose={closeApiKeyModal}
        title={editingApiKey ? 'Edit API Key' : 'Generate New API Key'}
      >
        <div className="space-y-4">
          {newApiKey ? (
            // Show the generated API key
            <div className="space-y-4">
              <div className="p-4 bg-success/10 border border-success/20 rounded-md">
                <div className="flex items-center mb-2">
                  <span className="text-success mr-2">✅</span>
                  <span className="font-medium text-success">API Key Generated Successfully!</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Copy this API key now. It will not be shown again for security reasons.
                </p>
                <div className="bg-muted p-3 rounded border">
                  <code className="text-sm font-mono break-all">{newApiKey.key}</code>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={async () => {
                    try {
                      // Try modern clipboard API first
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(newApiKey.key);
                        setStatusMessage('API key copied to clipboard!');
                      } else {
                        // Fallback for older browsers or non-HTTPS contexts
                        const textArea = document.createElement('textarea');
                        textArea.value = newApiKey.key;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-999999px';
                        textArea.style.top = '-999999px';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        setStatusMessage('API key copied to clipboard!');
                      }
                    } catch (error) {
                      console.error('Failed to copy to clipboard:', error);
                      setStatusMessage('Failed to copy to clipboard. Please copy manually.');
                    }
                  }}
                >
                  📋 Copy to Clipboard
                </Button>
              </div>
              <div className="flex justify-end space-x-2">
                <Button onClick={closeApiKeyModal}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            // Show the form
            <div className="space-y-4">
              <div>
                <label className="block text-body font-medium text-foreground mb-2">
                  API Key Name *
                </label>
                <Input
                  value={apiKeyForm.name}
                  onChange={(e) => setApiKeyForm({...apiKeyForm, name: e.target.value})}
                  placeholder="e.g., Satellite Scanner - Branch Office"
                />
              </div>
              <div>
                <label className="block text-body font-medium text-foreground mb-2">
                  Description
                </label>
                <Input
                  value={apiKeyForm.description}
                  onChange={(e) => setApiKeyForm({...apiKeyForm, description: e.target.value})}
                  placeholder="Optional description for this API key"
                />
              </div>
              <div>
                <label className="block text-body font-medium text-foreground mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {['scanner:read', 'scanner:write', 'scanner:admin'].map((perm) => (
                    <label key={perm} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={apiKeyForm.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setApiKeyForm({
                              ...apiKeyForm,
                              permissions: [...apiKeyForm.permissions, perm]
                            });
                          } else {
                            setApiKeyForm({
                              ...apiKeyForm,
                              permissions: apiKeyForm.permissions.filter(p => p !== perm)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-body font-medium text-foreground mb-2">
                  Expiration Date (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={apiKeyForm.expires_at}
                  onChange={(e) => setApiKeyForm({...apiKeyForm, expires_at: e.target.value})}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for no expiration
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={apiKeyForm.is_active}
                  onChange={(e) => setApiKeyForm({...apiKeyForm, is_active: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-foreground">
                  Active
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={closeApiKeyModal}>
                  Cancel
                </Button>
                <Button onClick={createApiKey} disabled={!apiKeyForm.name.trim()}>
                  Generate API Key
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Role Management Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setEditingRole(null);
          setRoleForm({ name: '', description: '', permissions: [] });
        }}
        title={editingRole ? 'Edit Role' : 'Add Role'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Role Name *
            </label>
            <Input
              value={roleForm.name}
              onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
              placeholder="e.g., Security Analyst"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={roleForm.description}
              onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
              placeholder="Describe the role's responsibilities and access level"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Permissions
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {[
                'assets:read', 'assets:write', 'assets:admin',
                'scans:read', 'scans:write', 'scans:admin',
                'discovery:read', 'discovery:write', 'discovery:admin',
                'users:read', 'users:write', 'users:admin',
                'roles:read', 'roles:write', 'roles:admin',
                'settings:read', 'settings:write', 'settings:admin',
                'api_keys:read', 'api_keys:write', 'api_keys:admin',
                'ldap:read', 'ldap:write', 'ldap:admin',
                'scanners:read', 'scanners:write', 'scanners:admin',
                'templates:read', 'templates:write', 'templates:admin'
              ].map((perm) => (
                <label key={perm} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={roleForm.permissions.includes(perm)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRoleForm({
                          ...roleForm,
                          permissions: [...roleForm.permissions, perm]
                        });
                      } else {
                        setRoleForm({
                          ...roleForm,
                          permissions: roleForm.permissions.filter(p => p !== perm)
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-foreground">{perm}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRoleModal(false);
                setEditingRole(null);
                setRoleForm({ name: '', description: '', permissions: [] });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRoleSubmit} 
              disabled={!roleForm.name.trim()}
            >
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Subnet Management Modal */}
      <Modal
        isOpen={showSubnetModal}
        onClose={() => {
          setShowSubnetModal(false);
          setEditingSubnet(null);
          setSubnetForm({
            name: '',
            description: '',
            cidr: '',
            gateway: '',
            vlan_id: '',
            location: '',
            department: '',
            is_active: true,
            is_managed: false,
            scan_frequency: 'weekly',
            tags: {}
          });
          setSubnetFormErrors({});
        }}
        title={editingSubnet ? 'Edit Subnet' : 'Add Subnet'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Subnet Name *
            </label>
            <Input
              value={subnetForm.name}
              onChange={(e) => {
                setSubnetForm({...subnetForm, name: e.target.value});
                if (subnetFormErrors.name) {
                  setSubnetFormErrors({...subnetFormErrors, name: null});
                }
              }}
              placeholder="e.g., Office Network"
              className={subnetFormErrors.name ? 'border-red-500' : ''}
            />
            {subnetFormErrors.name && (
              <p className="text-red-500 text-sm mt-1">{subnetFormErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={subnetForm.description}
              onChange={(e) => {
                setSubnetForm({...subnetForm, description: e.target.value});
                if (subnetFormErrors.description) {
                  setSubnetFormErrors({...subnetFormErrors, description: null});
                }
              }}
              placeholder="Describe this subnet's purpose and location"
              className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${subnetFormErrors.description ? 'border-red-500' : 'border-border'}`}
              rows={3}
            />
            {subnetFormErrors.description && (
              <p className="text-red-500 text-sm mt-1">{subnetFormErrors.description}</p>
            )}
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              CIDR Notation *
            </label>
            <Input
              value={subnetForm.cidr}
              onChange={(e) => {
                setSubnetForm({...subnetForm, cidr: e.target.value});
                if (subnetFormErrors.cidr) {
                  setSubnetFormErrors({...subnetFormErrors, cidr: null});
                }
              }}
              placeholder="e.g., 192.168.1.0/24"
              className={subnetFormErrors.cidr ? 'border-red-500' : ''}
            />
            {subnetFormErrors.cidr && (
              <p className="text-red-500 text-sm mt-1">{subnetFormErrors.cidr}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Network address and subnet mask in CIDR notation
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Gateway IP
              </label>
              <Input
                value={subnetForm.gateway}
                onChange={(e) => {
                  setSubnetForm({...subnetForm, gateway: e.target.value});
                  if (subnetFormErrors.gateway) {
                    setSubnetFormErrors({...subnetFormErrors, gateway: null});
                  }
                }}
                placeholder="e.g., 192.168.1.1"
                className={subnetFormErrors.gateway ? 'border-red-500' : ''}
              />
              {subnetFormErrors.gateway && (
                <p className="text-red-500 text-sm mt-1">{subnetFormErrors.gateway}</p>
              )}
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                VLAN ID
              </label>
              <Input
                type="number"
                min="1"
                max="4094"
                value={subnetForm.vlan_id}
                onChange={(e) => {
                  setSubnetForm({...subnetForm, vlan_id: e.target.value});
                  if (subnetFormErrors.vlan_id) {
                    setSubnetFormErrors({...subnetFormErrors, vlan_id: null});
                  }
                }}
                placeholder="e.g., 100"
                className={subnetFormErrors.vlan_id ? 'border-red-500' : ''}
              />
              {subnetFormErrors.vlan_id && (
                <p className="text-red-500 text-sm mt-1">{subnetFormErrors.vlan_id}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Location
              </label>
              <Input
                value={subnetForm.location}
                onChange={(e) => {
                  setSubnetForm({...subnetForm, location: e.target.value});
                  if (subnetFormErrors.location) {
                    setSubnetFormErrors({...subnetFormErrors, location: null});
                  }
                }}
                placeholder="e.g., Building A, Floor 2"
                className={subnetFormErrors.location ? 'border-red-500' : ''}
              />
              {subnetFormErrors.location && (
                <p className="text-red-500 text-sm mt-1">{subnetFormErrors.location}</p>
              )}
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Department
              </label>
              <Input
                value={subnetForm.department}
                onChange={(e) => {
                  setSubnetForm({...subnetForm, department: e.target.value});
                  if (subnetFormErrors.department) {
                    setSubnetFormErrors({...subnetFormErrors, department: null});
                  }
                }}
                placeholder="e.g., IT, Engineering"
                className={subnetFormErrors.department ? 'border-red-500' : ''}
              />
              {subnetFormErrors.department && (
                <p className="text-red-500 text-sm mt-1">{subnetFormErrors.department}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Scan Frequency
            </label>
            <select
              value={subnetForm.scan_frequency}
              onChange={(e) => setSubnetForm({...subnetForm, scan_frequency: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="manual">Manual Only</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={subnetForm.is_active}
                onChange={(e) => setSubnetForm({...subnetForm, is_active: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm font-medium text-foreground">Active</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={subnetForm.is_managed}
                onChange={(e) => setSubnetForm({...subnetForm, is_managed: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm font-medium text-foreground">Managed</span>
            </label>
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSubnetModal(false);
                setEditingSubnet(null);
                setSubnetForm({
                  name: '',
                  description: '',
                  cidr: '',
                  gateway: '',
                  vlan_id: '',
                  location: '',
                  department: '',
                  is_active: true,
                  is_managed: false,
                  scan_frequency: 'weekly',
                  tags: {}
                });
                setSubnetFormErrors({});
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubnetSubmit} 
              disabled={!subnetForm.name.trim() || !subnetForm.cidr.trim()}
            >
              {editingSubnet ? 'Update Subnet' : 'Create Subnet'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Access List Management Modal */}
      <Modal
        isOpen={showAccessListModal}
        onClose={() => {
          setShowAccessListModal(false);
          setSelectedResource(null);
          setResourceType(null);
          setResourceUsers([]);
        }}
        title={`Manage Access - ${selectedResource?.name || 'Resource'}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-info/10 border border-info/20 rounded-md">
            <div className="flex items-center">
              <span className="text-info mr-2">ℹ️</span>
              <p className="text-sm text-info">
                {resourceType === 'subnet' 
                  ? 'Manage which users can access this subnet for scanning and monitoring.'
                  : 'Manage which users can use this satellite scanner for enhanced discovery.'
                }
              </p>
            </div>
          </div>

          {/* Current Users with Access */}
          <div>
            <h3 className="text-subheading text-foreground mb-3">Users with Access</h3>
            {resourceUsers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No users have access to this {resourceType}.
              </div>
            ) : (
              <div className="space-y-2">
                {resourceUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-semibold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-subheading text-foreground">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.full_name || user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokeAccess(selectedResource.id, user.id, resourceType)}
                    >
                      Revoke Access
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grant Access to New Users */}
          <div>
            <h3 className="text-subheading text-foreground mb-3">Grant Access</h3>
            <div className="space-y-2">
              {users
                .filter(user => !resourceUsers.some(ru => ru.id === user.id))
                .map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-muted-foreground font-semibold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-subheading text-foreground">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.full_name || user.email}</p>
                        {user.role && (
                          <Badge variant="outline" className="text-xs">
                            {user.role.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => grantAccess(selectedResource.id, user.id, resourceType)}
                    >
                      Grant Access
                    </Button>
                  </div>
                ))}
            </div>
            {users.filter(user => !resourceUsers.some(ru => ru.id === user.id)).length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                All users already have access to this {resourceType}.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSettings;