import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { cn } from '../utils/cn';
import { 
  Play, 
  Pause, 
  Square, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown,
  Settings,
  Zap,
  Globe,
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Network,
  Server,
  Code,
  Database,
  Shield,
  Key,
  User,
  Lock,
  Unlock
} from 'lucide-react';
import PageHeader from './PageHeader';

const OperationsManagement = () => {
  const { 
    operations, 
    assets, 
    assetGroups, 
    credentials,
    loading,
    fetchOperations,
    createOperation,
    updateOperation,
    deleteOperation,
    runOperation
  } = useApp();
  const { user, hasPermission } = useAuth();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedOperations, setSelectedOperations] = useState([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [editingOperation, setEditingOperation] = useState(null);
  const [runningOperation, setRunningOperation] = useState(null);
  
  // Operation form state
  const [operationForm, setOperationForm] = useState({
    name: '',
    description: '',
    operation_type: 'awx',
    is_active: true,
    
    // AWX Configuration
    awx_job_template_id: '',
    awx_job_template_name: '',
    awx_extra_vars: {},
    awx_inventory_source: 'assets',
    awx_limit: '',
    awx_tags: '',
    awx_skip_tags: '',
    awx_verbosity: 0,
    
    // API Configuration
    api_url: '',
    api_method: 'POST',
    api_headers: {},
    api_body: {},
    api_auth_type: 'none',
    api_auth_credentials: '',
    api_timeout: 30,
    
    // Script Configuration
    script_type: 'powershell', // powershell, bash, python
    script_content: '',
    script_file_path: '',
    script_args: {},
    script_timeout: 300,
    script_working_directory: '',
    
    // Target Configuration
    target_type: 'assets', // assets, asset_groups, labels
    target_assets: [],
    target_asset_groups: [],
    target_labels: [],
    
    // Credentials
    credential_id: null,
    
    // Scheduling
    schedule_enabled: false,
    schedule_cron: '',
    schedule_timezone: 'UTC'
  });

  // Load data on component mount
  useEffect(() => {
    if (hasPermission('operations_read')) {
      fetchOperations();
    }
  }, [hasPermission, fetchOperations]);

  // Filter and sort operations
  const filteredOperations = React.useMemo(() => {
    let filtered = operations.filter(operation => {
      const matchesSearch = !searchTerm || 
        operation.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operation.operation_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
        (filterType === 'active' && operation.is_active) ||
        (filterType === 'inactive' && !operation.is_active) ||
        (filterType === 'awx' && operation.operation_type === 'awx') ||
        (filterType === 'api' && operation.operation_type === 'api') ||
        (filterType === 'script' && operation.operation_type === 'script');
      
      return matchesSearch && matchesFilter;
    });

    // Sort operations
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [operations, searchTerm, filterType, sortBy, sortOrder]);

  // Operation type configurations
  const operationTypes = {
    awx: {
      name: 'AWX/Ansible Tower',
      description: 'Execute Ansible playbooks via AWX Tower',
      icon: <Server className="w-5 h-5" />,
      color: 'bg-blue-500/20 text-blue-600',
      features: ['Job Template Execution', 'Inventory Management', 'Variable Passing', 'Scheduling']
    },
    api: {
      name: 'API Call',
      description: 'Make HTTP API calls to external services',
      icon: <Globe className="w-5 h-5" />,
      color: 'bg-green-500/20 text-green-600',
      features: ['REST API Integration', 'Custom Headers', 'Authentication', 'Response Handling']
    },
    script: {
      name: 'Script Execution',
      description: 'Execute scripts via WinRM or SSH',
      icon: <Terminal className="w-5 h-5" />,
      color: 'bg-purple-500/20 text-purple-600',
      features: ['PowerShell/Bash Scripts', 'WinRM/SSH Execution', 'Parameter Passing', 'Output Capture']
    }
  };

  // Statistics
  const stats = {
    total: operations.length,
    active: operations.filter(op => op.is_active).length,
    inactive: operations.filter(op => !op.is_active).length,
    awx: operations.filter(op => op.operation_type === 'awx').length,
    api: operations.filter(op => op.operation_type === 'api').length,
    script: operations.filter(op => op.operation_type === 'script').length
  };

  // Handlers
  const handleCreateOperation = async () => {
    try {
      await createOperation(operationForm);
      setShowCreateModal(false);
      resetForm();
      alert('Operation created successfully!');
    } catch (error) {
      console.error('Failed to create operation:', error);
      alert('Failed to create operation: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditOperation = (operation) => {
    setEditingOperation(operation);
    setOperationForm({
      ...operation,
      target_assets: operation.target_assets || [],
      target_asset_groups: operation.target_asset_groups || [],
      target_labels: operation.target_labels || []
    });
    setShowEditModal(true);
  };

  const handleUpdateOperation = async () => {
    try {
      await updateOperation(editingOperation.id, operationForm);
      setShowEditModal(false);
      setEditingOperation(null);
      resetForm();
      alert('Operation updated successfully!');
    } catch (error) {
      console.error('Failed to update operation:', error);
      alert('Failed to update operation: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteOperation = async (operationId) => {
    if (confirm('Are you sure you want to delete this operation?')) {
      try {
        await deleteOperation(operationId);
        alert('Operation deleted successfully!');
      } catch (error) {
        console.error('Failed to delete operation:', error);
        alert('Failed to delete operation: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleRunOperation = (operation) => {
    setRunningOperation(operation);
    setShowRunModal(true);
  };

  const resetForm = () => {
    setOperationForm({
      name: '',
      description: '',
      operation_type: 'awx',
      is_active: true,
      awx_job_template_id: '',
      awx_job_template_name: '',
      awx_extra_vars: {},
      awx_inventory_source: 'assets',
      awx_limit: '',
      awx_tags: '',
      awx_skip_tags: '',
      awx_verbosity: 0,
      api_url: '',
      api_method: 'POST',
      api_headers: {},
      api_body: {},
      api_auth_type: 'none',
      api_auth_credentials: '',
      api_timeout: 30,
      script_type: 'powershell',
      script_content: '',
      script_file_path: '',
      script_args: {},
      script_timeout: 300,
      script_working_directory: '',
      target_type: 'assets',
      target_assets: [],
      target_asset_groups: [],
      target_labels: [],
      credential_id: null,
      schedule_enabled: false,
      schedule_cron: '',
      schedule_timezone: 'UTC'
    });
  };

  const getOperationIcon = (type) => {
    return operationTypes[type]?.icon || <Settings className="w-5 h-5" />;
  };

  const getOperationColor = (type) => {
    return operationTypes[type]?.color || 'bg-gray-500/20 text-gray-600';
  };

  const getStatusIcon = (operation) => {
    if (!operation.is_active) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusBadge = (operation) => {
    return operation.is_active ? 'Active' : 'Inactive';
  };

  const getStatusColor = (operation) => {
    return operation.is_active ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600';
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <PageHeader
        title="Operations"
        subtitle="Manage automation operations and scripts"
        metrics={[
          { value: stats.total, label: "Total Operations", color: "text-primary" },
          { value: stats.active, label: "Active", color: "text-green-600" },
          { value: stats.inactive, label: "Inactive", color: "text-red-600" }
        ]}
        actions={[
          {
            label: "Create Operation",
            onClick: () => setShowCreateModal(true),
            icon: <Plus className="w-4 h-4" />,
            variant: "default"
          }
        ]}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Operations</p>
                    <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-green-600 text-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inactive Operations</p>
                    <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
                  </div>
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <XCircle className="text-red-600 text-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Operation Types</p>
                    <p className="text-2xl font-bold text-foreground">{Object.keys(operationTypes).length}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Settings className="text-blue-600 text-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Selected</p>
                    <p className="text-2xl font-bold text-foreground">{selectedOperations.length}</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-orange-600 text-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Controls */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search operations by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Operations</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="awx">AWX Operations</option>
                    <option value="api">API Operations</option>
                    <option value="script">Script Operations</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="name">Name</option>
                    <option value="operation_type">Type</option>
                    <option value="created_at">Created</option>
                    <option value="updated_at">Updated</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                  
                  {/* View Toggle - Integrated into toolbar */}
                  <div className="flex items-center space-x-2 border-l border-border pl-3">
                    <span className="text-sm font-medium text-foreground">View:</span>
                    <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="text-xs font-medium transition-all duration-200 h-8 px-3"
                      >
                        ⊞
                      </Button>
                      <Button
                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className="text-xs font-medium transition-all duration-200 h-8 px-3"
                      >
                        ☰
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operations List */}
          {filteredOperations.length === 0 ? (
            <Card className="surface-elevated">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚙️</div>
                  <h3 className="text-subheading text-foreground mb-2">No operations found</h3>
                  <p className="text-body text-muted-foreground mb-4">
                    Create your first operation to automate tasks on your assets.
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Operation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
            )}>
              {filteredOperations.map((operation) => (
                <Card key={operation.id} className="surface-interactive group hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", getOperationColor(operation.operation_type))}>
                          {getOperationIcon(operation.operation_type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{operation.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {operationTypes[operation.operation_type]?.name || operation.operation_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(operation)}
                        <Badge className={cn("text-xs", getStatusColor(operation))}>
                          {getStatusBadge(operation)}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {operation.description || 'No description provided'}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRunOperation(operation)}
                          className="text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Run
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOperation(operation)}
                          className="text-xs"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOperation(operation.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(operation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Operation Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setEditingOperation(null);
          resetForm();
        }}
        title={editingOperation ? 'Edit Operation' : 'Create Operation'}
        size="xl"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Operation Name *
                </label>
                <Input
                  value={operationForm.name}
                  onChange={(e) => setOperationForm({...operationForm, name: e.target.value})}
                  placeholder="Enter operation name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Operation Type *
                </label>
                <select
                  value={operationForm.operation_type}
                  onChange={(e) => setOperationForm({...operationForm, operation_type: e.target.value})}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="awx">AWX/Ansible Tower</option>
                  <option value="api">API Call</option>
                  <option value="script">Script Execution</option>
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
                placeholder="Describe what this operation does"
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                rows={3}
              />
            </div>
          </div>

          {/* Operation Type Configuration */}
          <Tabs value={operationForm.operation_type} onValueChange={(value) => setOperationForm({...operationForm, operation_type: value})}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="awx">AWX Configuration</TabsTrigger>
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="script">Script Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="awx" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Job Template ID
                  </label>
                  <Input
                    value={operationForm.awx_job_template_id}
                    onChange={(e) => setOperationForm({...operationForm, awx_job_template_id: e.target.value})}
                    placeholder="AWX Job Template ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Job Template Name
                  </label>
                  <Input
                    value={operationForm.awx_job_template_name}
                    onChange={(e) => setOperationForm({...operationForm, awx_job_template_name: e.target.value})}
                    placeholder="AWX Job Template Name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Extra Variables (JSON)
                </label>
                <textarea
                  value={JSON.stringify(operationForm.awx_extra_vars, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setOperationForm({...operationForm, awx_extra_vars: parsed});
                    } catch (error) {
                      // Keep the string value for now
                    }
                  }}
                  placeholder='{"variable1": "value1", "variable2": "value2"}'
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    API URL *
                  </label>
                  <Input
                    value={operationForm.api_url}
                    onChange={(e) => setOperationForm({...operationForm, api_url: e.target.value})}
                    placeholder="https://api.example.com/endpoint"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    HTTP Method
                  </label>
                  <select
                    value={operationForm.api_method}
                    onChange={(e) => setOperationForm({...operationForm, api_method: e.target.value})}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Request Headers (JSON)
                </label>
                <textarea
                  value={JSON.stringify(operationForm.api_headers, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setOperationForm({...operationForm, api_headers: parsed});
                    } catch (error) {
                      // Keep the string value for now
                    }
                  }}
                  placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Request Body (JSON)
                </label>
                <textarea
                  value={JSON.stringify(operationForm.api_body, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setOperationForm({...operationForm, api_body: parsed});
                    } catch (error) {
                      // Keep the string value for now
                    }
                  }}
                  placeholder='{"key": "value", "asset_ip": "{{asset_ip}}"}'
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="script" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Script Type
                  </label>
                  <select
                    value={operationForm.script_type}
                    onChange={(e) => setOperationForm({...operationForm, script_type: e.target.value})}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="powershell">PowerShell</option>
                    <option value="bash">Bash</option>
                    <option value="python">Python</option>
                    <option value="cmd">Windows CMD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Timeout (seconds)
                  </label>
                  <Input
                    type="number"
                    value={operationForm.script_timeout}
                    onChange={(e) => setOperationForm({...operationForm, script_timeout: parseInt(e.target.value) || 300})}
                    placeholder="300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Script Content
                </label>
                <textarea
                  value={operationForm.script_content}
                  onChange={(e) => setOperationForm({...operationForm, script_content: e.target.value})}
                  placeholder="Write your script here..."
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                  rows={8}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Target Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Target Configuration</h3>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Target Type
              </label>
              <select
                value={operationForm.target_type}
                onChange={(e) => setOperationForm({...operationForm, target_type: e.target.value})}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="assets">Specific Assets</option>
                <option value="asset_groups">Asset Groups</option>
                <option value="labels">Assets with Labels</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Available Assets
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
          </div>

          {/* Status */}
          <div className="flex items-center space-x-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={operationForm.is_active}
                onChange={(e) => setOperationForm({...operationForm, is_active: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-foreground">Active</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingOperation(null);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button onClick={editingOperation ? handleUpdateOperation : handleCreateOperation}>
            {editingOperation ? 'Update' : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default OperationsManagement;