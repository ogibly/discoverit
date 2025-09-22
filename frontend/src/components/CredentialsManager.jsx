import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { cn } from '../utils/cn';

const CredentialsManager = () => {
  const { 
    credentials, 
    loading, 
    fetchCredentials, 
    createCredential, 
    updateCredential, 
    deleteCredential 
  } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCredentials, setSelectedCredentials] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    credential_type: 'username_password',
    username: '',
    password: '',
    ssh_private_key: '',
    ssh_passphrase: '',
    domain: '',
    port: '',
    is_active: true
  });

  const credentialTypes = [
    { value: 'all', label: 'All Credentials', icon: '🔑' },
    { value: 'username_password', label: 'Username/Password', icon: '🔑' },
    { value: 'ssh_key', label: 'SSH Private Key', icon: '🔐' },
    { value: 'api_key', label: 'API Key', icon: '🌐' },
    { value: 'certificate', label: 'Certificate', icon: '📜' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'credential_type', label: 'Type' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'is_active', label: 'Status' }
  ];

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      await fetchCredentials();
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  // Filter and sort credentials
  const filteredCredentials = credentials
    .filter(credential => {
      const matchesSearch = credential.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (credential.description && credential.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filterType === 'all' || credential.credential_type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'credential_type':
          aValue = a.credential_type;
          bValue = b.credential_type;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'is_active':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const allSelected = filteredCredentials.length > 0 && filteredCredentials.every(credential => selectedCredentials.includes(credential.id));

  const handleCreate = async () => {
    try {
      const credentialData = { ...formData };
      
      // Clean up empty fields based on credential type
      if (credentialData.credential_type !== 'username_password') {
        credentialData.username = null;
        credentialData.password = null;
      }
      if (credentialData.credential_type !== 'ssh_key') {
        credentialData.ssh_private_key = null;
        credentialData.ssh_passphrase = null;
      }

      await createCredential(credentialData);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create credential:', error);
      alert('Failed to create credential: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdate = async () => {
    try {
      const credentialData = { ...formData };
      delete credentialData.id;
      
      await updateCredential(editingCredential.id, credentialData);
      setShowEditModal(false);
      setEditingCredential(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update credential:', error);
      alert('Failed to update credential: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    
    try {
      await deleteCredential(id);
    } catch (error) {
      console.error('Failed to delete credential:', error);
      alert('Failed to delete credential: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleBulkDelete = async (credentialIds) => {
    if (!confirm(`Are you sure you want to delete ${credentialIds.length} credentials?`)) return;
    
    try {
      await Promise.all(credentialIds.map(id => api.delete(`/credentials/${id}`)));
      setSelectedCredentials([]);
      loadCredentials();
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      alert('Failed to delete credentials: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      credential_type: 'username_password',
      username: '',
      password: '',
      ssh_private_key: '',
      ssh_passphrase: '',
      domain: '',
      port: '',
      is_active: true
    });
  };

  const toggleCredentialSelection = (credentialId) => {
    setSelectedCredentials(prev => 
      prev.includes(credentialId) 
        ? prev.filter(id => id !== credentialId)
        : [...prev, credentialId]
    );
  };

  const selectAllCredentials = (credentialIds) => {
    setSelectedCredentials(credentialIds);
  };

  const getCredentialTypeIcon = (type) => {
    switch (type) {
      case 'username_password': return '🔑';
      case 'ssh_key': return '🔐';
      case 'api_key': return '🌐';
      case 'certificate': return '📜';
      default: return '🔑';
    }
  };

  const getCredentialTypeColor = (type) => {
    switch (type) {
      case 'username_password': return 'bg-blue-500/20 text-blue-600';
      case 'ssh_key': return 'bg-green-500/20 text-green-600';
      case 'api_key': return 'bg-purple-500/20 text-purple-600';
      case 'certificate': return 'bg-orange-500/20 text-orange-600';
      default: return 'bg-gray-500/20 text-gray-600';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground';
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Credentials</h1>
            <p className="text-body text-muted-foreground mt-1">
              Manage authentication credentials for your assets
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{credentials.length}</div>
              <div className="text-caption text-muted-foreground">Total Credentials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{credentials.filter(c => c.is_active).length}</div>
              <div className="text-caption text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{credentials.filter(c => !c.is_active).length}</div>
              <div className="text-caption text-muted-foreground">Inactive</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="surface-elevated">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search credentials by name or description..."
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
                {credentialTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "px-3 py-1 text-sm",
                    viewMode === 'grid' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ⊞
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "px-3 py-1 text-sm",
                    viewMode === 'table' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ☰
                </Button>
              </div>
              <Button onClick={() => setShowCreateModal(true)} className="ml-2">
                Create Credential
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Credential Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Active Credentials</p>
                <p className="text-2xl font-bold text-success">{credentials.filter(c => c.is_active).length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                <span className="text-success">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Inactive Credentials</p>
                <p className="text-2xl font-bold text-error">{credentials.filter(c => !c.is_active).length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-error/20 flex items-center justify-center">
                <span className="text-error">❌</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Credential Types</p>
                <p className="text-2xl font-bold text-info">{new Set(credentials.map(c => c.credential_type)).size}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
                <span className="text-info">🔑</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-warning">{selectedCredentials.length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <span className="text-warning">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedCredentials.length > 0 && (
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-body text-foreground">
                  {selectedCredentials.length} credential(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCredentials([])}
                  className="text-caption"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkDelete(selectedCredentials)}
                  className="text-error hover:text-error hover:bg-error/10 border-error/20"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credential List */}
      {loading ? (
        <Card className="surface-elevated">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h3 className="text-subheading text-foreground mb-2">Loading credentials...</h3>
          </CardContent>
        </Card>
      ) : filteredCredentials.length === 0 ? (
        <Card className="surface-elevated">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">🔑</div>
            <h3 className="text-subheading text-foreground mb-2">No credentials found</h3>
            <p className="text-body text-muted-foreground">
              Create your first credential to authenticate with your assets.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCredentials.map((credential) => (
            <Card key={credential.id} className="surface-interactive">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedCredentials.includes(credential.id)}
                      onChange={() => toggleCredentialSelection(credential.id)}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", getCredentialTypeColor(credential.credential_type))}>
                      {getCredentialTypeIcon(credential.credential_type)}
                    </div>
                  </div>
                  <Badge className={cn("text-xs", getStatusColor(credential.is_active))}>
                    {credential.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-subheading text-foreground truncate">
                      {credential.name}
                    </h3>
                    <p className="text-caption text-muted-foreground">
                      {credential.description || 'No description'}
                    </p>
                  </div>

                  <div className="space-y-2 text-caption text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="capitalize">{credential.credential_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span>{credential.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    {credential.domain && (
                      <div className="flex justify-between">
                        <span>Domain:</span>
                        <span className="font-mono">{credential.domain}</span>
                      </div>
                    )}
                    {credential.port && (
                      <div className="flex justify-between">
                        <span>Port:</span>
                        <span className="font-mono">{credential.port}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(credential.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCredential(credential);
                        setFormData({
                          name: credential.name || '',
                          description: credential.description || '',
                          credential_type: credential.credential_type || 'username_password',
                          username: credential.username || '',
                          password: credential.password || '',
                          ssh_private_key: credential.ssh_private_key || '',
                          ssh_passphrase: credential.ssh_passphrase || '',
                          domain: credential.domain || '',
                          port: credential.port || '',
                          is_active: credential.is_active !== false
                        });
                        setShowEditModal(true);
                      }}
                      className="flex-1 text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(credential.id)}
                      className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="surface-elevated">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => selectAllCredentials(allSelected ? [] : filteredCredentials.map(c => c.id))}
                        className="rounded border-border text-primary focus:ring-ring"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Credential</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Type</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Domain</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Created</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCredentials.map((credential) => (
                    <tr key={credential.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCredentials.includes(credential.id)}
                          onChange={() => toggleCredentialSelection(credential.id)}
                          className="rounded border-border text-primary focus:ring-ring"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-sm", getCredentialTypeColor(credential.credential_type))}>
                            {getCredentialTypeIcon(credential.credential_type)}
                          </div>
                          <div>
                            <div className="text-body font-medium text-foreground">
                              {credential.name}
                            </div>
                            <div className="text-caption text-muted-foreground">
                              {credential.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body text-foreground capitalize">
                          {credential.credential_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn("text-xs", getStatusColor(credential.is_active))}>
                          {credential.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body text-foreground font-mono">
                          {credential.domain || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body text-muted-foreground">
                          {new Date(credential.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCredential(credential);
                              setFormData({
                                name: credential.name || '',
                                description: credential.description || '',
                                credential_type: credential.credential_type || 'username_password',
                                username: credential.username || '',
                                password: credential.password || '',
                                ssh_private_key: credential.ssh_private_key || '',
                                ssh_passphrase: credential.ssh_passphrase || '',
                                domain: credential.domain || '',
                                port: credential.port || '',
                                is_active: credential.is_active !== false
                              });
                              setShowEditModal(true);
                            }}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(credential.id)}
                            className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Credential Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Credential"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter credential name"
              required
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Description
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter credential description"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Credential Type *
            </label>
            <select
              value={formData.credential_type}
              onChange={(e) => setFormData({...formData, credential_type: e.target.value})}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              required
            >
              {credentialTypes.filter(t => t.value !== 'all').map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {formData.credential_type === 'username_password' && (
            <>
              <div>
                <label className="block text-body font-medium text-foreground mb-2">
                  Username *
                </label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-body font-medium text-foreground mb-2">
                  Password *
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </>
          )}

          {formData.credential_type === 'ssh_key' && (
            <>
              <div>
                <label className="block text-body font-medium text-foreground mb-2">
                  SSH Private Key *
                </label>
                <textarea
                  value={formData.ssh_private_key}
                  onChange={(e) => setFormData({...formData, ssh_private_key: e.target.value})}
                  placeholder="Enter SSH private key"
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-body font-medium text-foreground mb-2">
                  SSH Passphrase
                </label>
                <Input
                  type="password"
                  value={formData.ssh_passphrase}
                  onChange={(e) => setFormData({...formData, ssh_passphrase: e.target.value})}
                  placeholder="Enter SSH passphrase (optional)"
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Domain
              </label>
              <Input
                value={formData.domain}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
                placeholder="Enter domain"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Port
              </label>
              <Input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({...formData, port: e.target.value})}
                placeholder="Enter port"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-body text-foreground">Active</span>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Credential
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Credential Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Credential"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter credential name"
              required
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Description
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter credential description"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Credential Type *
            </label>
            <select
              value={formData.credential_type}
              onChange={(e) => setFormData({...formData, credential_type: e.target.value})}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              required
            >
              {credentialTypes.filter(t => t.value !== 'all').map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {formData.credential_type === 'username_password' && (
            <>
              <div>
                <label className="block text-body font-medium text-foreground mb-2">
                  Username *
                </label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-body font-medium text-foreground mb-2">
                  Password *
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </>
          )}

          {formData.credential_type === 'ssh_key' && (
            <>
              <div>
                <label className="block text-body font-medium text-foreground mb-2">
                  SSH Private Key *
                </label>
                <textarea
                  value={formData.ssh_private_key}
                  onChange={(e) => setFormData({...formData, ssh_private_key: e.target.value})}
                  placeholder="Enter SSH private key"
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-body font-medium text-foreground mb-2">
                  SSH Passphrase
                </label>
                <Input
                  type="password"
                  value={formData.ssh_passphrase}
                  onChange={(e) => setFormData({...formData, ssh_passphrase: e.target.value})}
                  placeholder="Enter SSH passphrase (optional)"
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Domain
              </label>
              <Input
                value={formData.domain}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
                placeholder="Enter domain"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Port
              </label>
              <Input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({...formData, port: e.target.value})}
                placeholder="Enter port"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-body text-foreground">Active</span>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Credential
            </Button>
          </div>
        </form>
      </Modal>
        </div>
      </div>
    </div>
  );
};

export default CredentialsManager;
