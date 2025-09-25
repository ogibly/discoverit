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
import { 
  Server, 
  Play, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Network,
  Database,
  Key,
  Users,
  Globe,
  Zap,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  TestTube,
  BookOpen,
  Code,
  Layers,
  Target,
  FileText,
  Wrench
} from 'lucide-react';

const AWXIntegration = () => {
  const { 
    assets, 
    assetGroups, 
    credentials,
    statusMessage,
    clearStatusMessage
  } = useApp();
  const { hasPermission } = useAuth();

  // State management
  const [awxSettings, setAwxSettings] = useState({
    awx_url: '',
    awx_username: '',
    awx_password: '',
    awx_token: '',
    awx_connected: false,
    awx_inventory_id: '',
    awx_sync_inventory: false,
    awx_sync_interval: 30
  });

  const [jobTemplates, setJobTemplates] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [credentials_awx, setCredentialsAWX] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Modal states
  const [showCreateOperationModal, setShowCreateOperationModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  // Operation creation state
  const [operationForm, setOperationForm] = useState({
    name: '',
    description: '',
    job_template_id: '',
    job_template_name: '',
    inventory_source: 'assets', // assets, asset_groups, labels, custom
    target_assets: [],
    target_asset_groups: [],
    target_labels: [],
    custom_inventory: '',
    extra_vars: {},
    limit: '',
    tags: '',
    skip_tags: '',
    verbosity: 0,
    credential_ids: [],
    ask_variables_on_launch: true,
    ask_inventory_on_launch: false,
    ask_credential_on_launch: true
  });

  // Predefined variables for operations
  const predefinedVariables = {
    asset_variables: [
      { name: 'asset_ip', description: 'Primary IP address of the asset', example: '192.168.1.100' },
      { name: 'asset_name', description: 'Name of the asset', example: 'web-server-01' },
      { name: 'asset_hostname', description: 'Hostname of the asset', example: 'web01.company.com' },
      { name: 'asset_os', description: 'Operating system of the asset', example: 'Windows Server 2019' },
      { name: 'asset_mac', description: 'MAC address of the asset', example: '00:1B:44:11:3A:B7' },
      { name: 'asset_manufacturer', description: 'Hardware manufacturer', example: 'Dell Inc.' },
      { name: 'asset_model', description: 'Hardware model', example: 'PowerEdge R740' }
    ],
    credential_variables: [
      { name: 'credential_username', description: 'Username from selected credential', example: 'admin' },
      { name: 'credential_password', description: 'Password from selected credential', example: 'password123' },
      { name: 'credential_ssh_key', description: 'SSH private key path', example: '/path/to/key' },
      { name: 'credential_domain', description: 'Domain for Windows credentials', example: 'COMPANY' }
    ],
    system_variables: [
      { name: 'operation_id', description: 'Unique operation ID', example: '12345' },
      { name: 'operation_name', description: 'Name of the operation', example: 'Deploy Application' },
      { name: 'timestamp', description: 'Current timestamp', example: '2024-01-15T10:30:00Z' },
      { name: 'user_id', description: 'ID of the user running the operation', example: '1' },
      { name: 'user_name', description: 'Username of the user running the operation', example: 'admin' }
    ],
    inventory_variables: [
      { name: 'inventory_ips', description: 'Comma-separated list of asset IPs', example: '192.168.1.100,192.168.1.101' },
      { name: 'inventory_count', description: 'Number of assets in inventory', example: '5' },
      { name: 'inventory_groups', description: 'Asset groups as Ansible groups', example: 'web_servers,db_servers' }
    ]
  };

  // Load AWX settings on mount
  useEffect(() => {
    loadAWXSettings();
  }, []);

  const loadAWXSettings = async () => {
    try {
      setLoading(true);
      // This would be an API call to get current AWX settings
      // const settings = await fetchAWXSettings();
      // setAwxSettings(settings);
    } catch (error) {
      console.error('Failed to load AWX settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAWXConnection = async () => {
    try {
      setLoading(true);
      setConnectionStatus('testing');
      
      // Test AWX connection via API
      const result = await fetch('/api/v2/awx/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(awxSettings)
      });
      
      const data = await result.json();
      
      if (data.success) {
        setConnectionStatus('connected');
        setAwxSettings(prev => ({ ...prev, awx_connected: true }));
        
        // Load AWX resources
        await loadAWXResources();
      } else {
        setConnectionStatus('failed');
        setAwxSettings(prev => ({ ...prev, awx_connected: false }));
        alert(`Connection failed: ${data.error}`);
      }
      
    } catch (error) {
      console.error('AWX connection test failed:', error);
      setConnectionStatus('failed');
      setAwxSettings(prev => ({ ...prev, awx_connected: false }));
      alert('Connection test failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAWXResources = async () => {
    try {
      // Load job templates, inventories, credentials, and projects from AWX API
      const [templatesRes, inventoriesRes, credentialsRes, projectsRes] = await Promise.all([
        fetch('/api/v2/awx/job-templates', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/v2/awx/inventories', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/v2/awx/credentials', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/v2/awx/projects', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const templatesData = await templatesRes.json();
      const inventoriesData = await inventoriesRes.json();
      const credentialsData = await credentialsRes.json();
      const projectsData = await projectsRes.json();

      if (templatesData.success) {
        setJobTemplates(templatesData.templates);
      }
      if (inventoriesData.success) {
        setInventories(inventoriesData.inventories);
      }
      if (credentialsData.success) {
        setCredentialsAWX(credentialsData.credentials);
      }
      if (projectsData.success) {
        setProjects(projectsData.projects);
      }
      
    } catch (error) {
      console.error('Failed to load AWX resources:', error);
      // Fallback to empty arrays on error
      setJobTemplates([]);
      setInventories([]);
      setCredentialsAWX([]);
      setProjects([]);
    }
  };

  const createOperation = async () => {
    try {
      setLoading(true);
      
      // Validate form
      if (!operationForm.name || !operationForm.job_template_id) {
        throw new Error('Operation name and job template are required');
      }

      // Create operation with predefined variables
      const operationData = {
        ...operationForm,
        extra_vars: {
          ...operationForm.extra_vars,
          // Add predefined variables
          asset_variables: predefinedVariables.asset_variables,
          credential_variables: predefinedVariables.credential_variables,
          system_variables: predefinedVariables.system_variables,
          inventory_variables: predefinedVariables.inventory_variables
        }
      };

      // Create operation via API
      const result = await fetch('/api/v2/awx/create-operation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(operationData)
      });

      const data = await result.json();
      
      if (data.success) {
        alert('AWX operation created successfully!');
        setShowCreateOperationModal(false);
        resetOperationForm();
      } else {
        throw new Error(data.error || 'Failed to create operation');
      }
      
    } catch (error) {
      console.error('Failed to create operation:', error);
      alert('Failed to create operation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetOperationForm = () => {
    setOperationForm({
      name: '',
      description: '',
      job_template_id: '',
      job_template_name: '',
      inventory_source: 'assets',
      target_assets: [],
      target_asset_groups: [],
      target_labels: [],
      custom_inventory: '',
      extra_vars: {},
      limit: '',
      tags: '',
      skip_tags: '',
      verbosity: 0,
      credential_ids: [],
      ask_variables_on_launch: true,
      ask_inventory_on_launch: false,
      ask_credential_on_launch: true
    });
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'testing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'testing':
        return 'Testing Connection...';
      case 'failed':
        return 'Connection Failed';
      default:
        return 'Not Connected';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500/20 text-green-600 border-green-200';
      case 'testing':
        return 'bg-blue-500/20 text-blue-600 border-blue-200';
      case 'failed':
        return 'bg-red-500/20 text-red-600 border-red-200';
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AWX Integration</h1>
            <p className="text-muted-foreground">Manage AWX/Ansible Tower integration and operations</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={cn("flex items-center space-x-2", getConnectionStatusColor())}>
              {getConnectionStatusIcon()}
              <span>{getConnectionStatusText()}</span>
            </Badge>
            <Button
              onClick={testAWXConnection}
              disabled={loading || !awxSettings.awx_url || !awxSettings.awx_username}
              variant="outline"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="connection" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="templates">Job Templates</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
          </TabsList>

          {/* Connection Tab */}
          <TabsContent value="connection" className="space-y-6">
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>AWX/Ansible Tower Connection</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      AWX/Tower URL *
                    </label>
                    <Input
                      value={awxSettings.awx_url}
                      onChange={(e) => setAwxSettings({...awxSettings, awx_url: e.target.value})}
                      placeholder="https://awx.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Username *
                    </label>
                    <Input
                      value={awxSettings.awx_username}
                      onChange={(e) => setAwxSettings({...awxSettings, awx_username: e.target.value})}
                      placeholder="admin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Password *
                    </label>
                    <Input
                      type="password"
                      value={awxSettings.awx_password}
                      onChange={(e) => setAwxSettings({...awxSettings, awx_password: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Connection status will be tested when you click "Test Connection"
                  </div>
                  <Button onClick={testAWXConnection} disabled={loading}>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Available Job Templates</h3>
              <Button onClick={() => setShowTemplateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Operation
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobTemplates.map((template) => (
                <Card key={template.id} className="surface-interactive group hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Code className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{template.name}</h4>
                          <p className="text-xs text-muted-foreground">Job Template</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOperationForm(prev => ({
                            ...prev,
                            job_template_id: template.id,
                            job_template_name: template.name
                          }));
                          setShowCreateOperationModal(true);
                        }}
                        className="text-xs"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Create Operation
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Inventory Management</h3>
              <Button onClick={() => setShowInventoryModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Inventory
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventories.map((inventory) => (
                <Card key={inventory.id} className="surface-interactive group hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <Database className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{inventory.name}</h4>
                          <p className="text-xs text-muted-foreground">Inventory</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      {inventory.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">AWX Operations</h3>
              <Button onClick={() => setShowCreateOperationModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Operation
              </Button>
            </div>

            <Card className="surface-elevated">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚙️</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No AWX Operations Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first AWX operation to automate tasks using Ansible playbooks.
                  </p>
                  <Button onClick={() => setShowCreateOperationModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Operation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variables Tab */}
          <TabsContent value="variables" className="space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Predefined Variables</h3>
              <p className="text-muted-foreground">
                These variables are automatically available in your AWX operations and can be used in playbooks.
              </p>

              {Object.entries(predefinedVariables).map(([category, variables]) => (
                <Card key={category} className="surface-elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {category === 'asset_variables' && <Target className="w-5 h-5" />}
                      {category === 'credential_variables' && <Key className="w-5 h-5" />}
                      {category === 'system_variables' && <Settings className="w-5 h-5" />}
                      {category === 'inventory_variables' && <Database className="w-5 h-5" />}
                      <span className="capitalize">{category.replace('_', ' ')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {variables.map((variable, index) => (
                        <div key={index} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <code className="text-sm font-mono bg-background px-2 py-1 rounded border">
                                {variable.name}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(variable.name)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {variable.description}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              Example: {variable.example}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Operation Modal */}
      <Modal
        isOpen={showCreateOperationModal}
        onClose={() => {
          setShowCreateOperationModal(false);
          resetOperationForm();
        }}
        title="Create AWX Operation"
        size="xl"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Operation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Operation Name *
                </label>
                <Input
                  value={operationForm.name}
                  onChange={(e) => setOperationForm({...operationForm, name: e.target.value})}
                  placeholder="Deploy Web Application"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Job Template *
                </label>
                <select
                  value={operationForm.job_template_id}
                  onChange={(e) => {
                    const template = jobTemplates.find(t => t.id === parseInt(e.target.value));
                    setOperationForm({
                      ...operationForm,
                      job_template_id: e.target.value,
                      job_template_name: template?.name || ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="">Select Job Template</option>
                  {jobTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={operationForm.description}
                onChange={(e) => setOperationForm({...operationForm, description: e.target.value})}
                placeholder="Describe what this operation does..."
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                rows={3}
              />
            </div>
          </div>

          {/* Target Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Target Configuration</h3>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Inventory Source
              </label>
              <select
                value={operationForm.inventory_source}
                onChange={(e) => setOperationForm({...operationForm, inventory_source: e.target.value})}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="assets">Selected Assets</option>
                <option value="asset_groups">Asset Groups</option>
                <option value="labels">Assets with Labels</option>
                <option value="custom">Custom Inventory</option>
              </select>
            </div>

            {operationForm.inventory_source === 'assets' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Assets
                </label>
                <div className="max-h-32 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                  {assets.map((asset) => (
                    <label key={asset.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={operationForm.target_assets.includes(asset.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOperationForm({
                              ...operationForm,
                              target_assets: [...operationForm.target_assets, asset.id]
                            });
                          } else {
                            setOperationForm({
                              ...operationForm,
                              target_assets: operationForm.target_assets.filter(id => id !== asset.id)
                            });
                          }
                        }}
                        className="rounded border-border text-primary focus:ring-ring"
                      />
                      <span className="text-sm text-foreground">
                        {asset.name} ({asset.primary_ip})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Extra Variables */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Extra Variables</h3>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Variables (JSON)
              </label>
              <textarea
                value={JSON.stringify(operationForm.extra_vars, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setOperationForm({...operationForm, extra_vars: parsed});
                  } catch (error) {
                    // Keep the string value for now
                  }
                }}
                placeholder='{"deployment_env": "production", "app_version": "1.2.3"}'
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can use predefined variables like <code>{"{{asset_ip}}"}</code>, <code>{"{{credential_username}}"}</code>, etc.
              </p>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Advanced Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Limit
                </label>
                <Input
                  value={operationForm.limit}
                  onChange={(e) => setOperationForm({...operationForm, limit: e.target.value})}
                  placeholder="web_servers:&production"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Verbosity
                </label>
                <select
                  value={operationForm.verbosity}
                  onChange={(e) => setOperationForm({...operationForm, verbosity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value={0}>0 - Normal</option>
                  <option value={1}>1 - Verbose</option>
                  <option value={2}>2 - More Verbose</option>
                  <option value={3}>3 - Debug</option>
                  <option value={4}>4 - Connection Debug</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => {
            setShowCreateOperationModal(false);
            resetOperationForm();
          }}>
            Cancel
          </Button>
          <Button onClick={createOperation} disabled={loading}>
            {loading ? 'Creating...' : 'Create Operation'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AWXIntegration;
